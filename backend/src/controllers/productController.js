const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Lab = require('../models/Lab');
const User = require('../models/User');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted } = require('../utils/apiResponse');
const { buildPagination, calculatePaginationMeta, parseQueryFilters } = require('../utils/helpers');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 12,
        search,
        category,
        type,
        condition,
        minPrice,
        maxPrice,
        location,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        lab,
        status = 'active',
        approvalStatus = 'approved'
    } = req.query;

    // Build filters
    const filters = {};

    // Only show approved and non-asset products for public access
    if (req.user?.role !== 'admin') {
        filters.status = status;
        filters.approvalStatus = approvalStatus;
        // Hide assets from public listings
        filters.type = 'asset' in req.query ? req.query.type : { $ne: 'asset' };
    } else {
        // Admin can see all products with flexible filtering
        if (status && status !== 'all') filters.status = status;
        if (approvalStatus && approvalStatus !== 'all') filters.approvalStatus = approvalStatus;
        // Admin can see assets if they want
        if (type && type !== 'all') filters.type = type;
    }

    // Search functionality
    if (search) {
        filters.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } },
            { brand: { $regex: search, $options: 'i' } },
            { model: { $regex: search, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        const categoryObj = await Category.findById(category);
        if (categoryObj) {
            const descendants = await categoryObj.getDescendants();
            const categoryIds = [category, ...descendants.map(d => d._id)];
            filters.category = { $in: categoryIds };
        }
    }

    // Type filter (sale, exchange, asset) - but Admin already handled above
    if (type && req.user?.role !== 'admin') {
        filters.type = type;
    }

    // Condition filter
    if (condition) {
        filters.condition = condition;
    }

    // Price range filter (only for sale items)
    if (minPrice || maxPrice) {
        filters.type = 'sale';
        filters.price = {};
        if (minPrice) filters.price.$gte = parseFloat(minPrice);
        if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }

    // Lab filter
    if (lab) {
        filters.lab = lab;
    }

    // Location filter (search in lab's city)
    if (location) {
        const labIds = await Lab.find({
            'address.city': { $regex: location, $options: 'i' }
        }).distinct('_id');
        filters.lab = { $in: labIds };
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    if (sortBy === 'price') {
        sort.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
        sort['rating.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'popular') {
        sort.views = -1;
        sort.favorites = -1;
    } else {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query
    const products = await Product.find(filters)
        .populate('category', 'name slug')
        .populate('lab', 'labName address.city')
        .populate('owner', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-relatedProducts -exchangePreferences.notes');

    // Get total count for pagination
    const total = await Product.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب المنتجات بنجاح', {
        products,
        pagination,
        filters: {
            search,
            category,
            type,
            condition,
            location,
            priceRange: { min: minPrice, max: maxPrice }
        }
    });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug parent')
        .populate('lab', 'labName address contactPerson statistics')
        .populate('owner', 'name phone')
        .populate('relatedProducts', 'name slug price images type condition rating')
        .populate({
            path: 'category',
            populate: {
                path: 'parent',
                select: 'name slug'
            }
        });

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    // Check if user can view this product
    if (product.status !== 'active' || product.approvalStatus !== 'approved') {
        if (req.user?.role !== 'admin' && product.owner.toString() !== req.user?.id) {
            return sendError(res, 'المنتج غير متاح', 404);
        }
    }

    // Increment views if not owner or admin
    if (req.user?.id !== product.owner.toString() && req.user?.role !== 'admin') {
        await product.incrementViews();
    }

    sendSuccess(res, 'تم جلب المنتج بنجاح', product);
});

// @desc    Get product by slug
// @route   GET /api/v1/products/slug/:slug
// @access  Public
exports.getProductBySlug = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ 
        slug: req.params.slug,
        status: 'active',
        approvalStatus: 'approved'
    })
    .populate('category', 'name slug parent')
    .populate('lab', 'labName address contactPerson statistics')
    .populate('owner', 'name phone')
    .populate('relatedProducts', 'name slug price images type condition rating');

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    // Increment views if not owner
    if (req.user?.id !== product.owner.toString()) {
        await product.incrementViews();
    }

    sendSuccess(res, 'تم جلب المنتج بنجاح', product);
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Lab
exports.createProduct = asyncHandler(async (req, res) => {
    // Parse JSON fields if they exist
    if (req.body.shipping && typeof req.body.shipping === 'string') {
        try {
            req.body.shipping = JSON.parse(req.body.shipping);
        } catch (e) {
            req.body.shipping = { available: false };
        }
    }
    
    if (req.body.exchangePreferences && typeof req.body.exchangePreferences === 'string') {
        try {
            req.body.exchangePreferences = JSON.parse(req.body.exchangePreferences);
        } catch (e) {
            req.body.exchangePreferences = {};
        }
    }
    
    if (req.body.specifications && typeof req.body.specifications === 'string') {
        try {
            req.body.specifications = JSON.parse(req.body.specifications);
        } catch (e) {
            req.body.specifications = [];
        }
    }
    
    if (req.body.tags && typeof req.body.tags === 'string') {
        try {
            req.body.tags = JSON.parse(req.body.tags);
        } catch (e) {
            req.body.tags = [];
        }
    }
    
    if (req.body.warranty && typeof req.body.warranty === 'string') {
        try {
            req.body.warranty = JSON.parse(req.body.warranty);
        } catch (e) {
            req.body.warranty = { available: false };
        }
    }

    const {
        name,
        description,
        type,
        category,
        price,
        currency,
        quantity,
        unit,
        sku,
        barcode,
        specifications,
        condition,
        brand,
        model,
        manufacturerCountry,
        manufacturingDate,
        expiryDate,
        warranty,
        shipping,
        exchangePreferences,
        tags
    } = req.body;

    // Get lab (Admin can assign to any lab, Lab owner can only add to their lab)
    let lab;
    let owner;
    
    if (req.user.role === 'admin' && req.body.assignedLab) {
        // Admin creating product for a specific lab
        lab = await Lab.findById(req.body.assignedLab);
        if (!lab) {
            return sendError(res, 'المختبر المحدد غير موجود', 404);
        }
        owner = lab.user; // Use lab's owner
    } else {
        // Lab creating their own product
        lab = await Lab.findOne({ user: req.user.id });
        
        if (!lab) {
            return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
        }
        
        // Check if user/lab is approved
        if (req.user.status !== 'approved') {
            return sendError(res, 'يجب أن يتم اعتماد مختبرك أولاً', 403);
        }
        
        owner = req.user.id;
    }

    // Validate category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        return sendError(res, 'الفئة غير موجودة', 400);
    }

    // Validate type-specific requirements
    if (type === 'sale' && (!price || price <= 0)) {
        return sendError(res, 'السعر مطلوب للمنتجات المعروضة للبيع', 400);
    }

    if (type === 'exchange' && !exchangePreferences) {
        return sendError(res, 'تفضيلات التبادل مطلوبة للمنتجات المعروضة للتبادل', 400);
    }

    // Handle uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
            images.push({
                url: file.path,
                alt: `${name} - صورة ${index + 1}`,
                isPrimary: index === 0
            });
        });
    }

    // Create product data
    const isAsset = type === 'asset';
    const productData = {
        name: name.trim(),
        description: description.trim(),
        type,
        category,
        lab: lab._id,
        owner: owner,
        quantity: parseInt(quantity),
        unit: unit || 'قطعة',
        sku,
        barcode,
        images,
        specifications: specifications || [],
        condition: condition || 'new',
        brand: brand?.trim() || '',
        model: model?.trim() || '',
        manufacturerCountry: manufacturerCountry?.trim() || '',
        manufacturingDate,
        expiryDate,
        warranty: warranty || { available: false },
        shipping: shipping || { available: false },
        exchangePreferences: exchangePreferences || {},
        tags: tags || [],
        // Assets are internal inventory: hidden and auto-approved
        status: isAsset ? 'inactive' : 'pending',
        approvalStatus: isAsset ? 'approved' : 'pending'
    };

    // Add price and currency for sale items
    if (type === 'sale') {
        productData.price = parseFloat(price);
        productData.currency = currency || 'SAR';
    }

    const product = await Product.create(productData);

    // Update lab's product count
    lab.statistics.totalProducts += 1;
    await lab.save();

    // Update category's product count
    await Category.updateProductsCount(category);

    const populatedProduct = await Product.findById(product._id)
        .populate('category', 'name slug')
        .populate('lab', 'labName')
        .populate('owner', 'name');

    sendCreated(res, 'تم إنشاء المنتج بنجاح وهو في انتظار موافقة الإدارة', populatedProduct);
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Lab Owner
exports.updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    // Check ownership (Admin can edit any product)
    if (req.user.role !== 'admin' && product.owner.toString() !== req.user.id) {
        return sendError(res, 'غير مصرح لك بتعديل هذا المنتج', 403);
    }

    // Fields that can be updated
    const allowedFields = [
        'type',
        'description',
        'price',
        'quantity',
        'specifications',
        'condition',
        'warranty',
        'shipping',
        'exchangePreferences',
        'tags'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) return;
        // Ensure exchangePreferences is an object when updating
        if (key === 'exchangePreferences' && typeof req.body[key] === 'string') {
            try { updateData[key] = JSON.parse(req.body[key]); } catch { updateData[key] = {}; }
        } else {
            updateData[key] = req.body[key];
        }
    });

    // If type is being changed to 'sale', ensure price is valid (fallback to existing or provided)
    if (updateData.type === 'sale') {
        const priceVal = req.body.price ?? product.price;
        if (!priceVal || Number(priceVal) <= 0) {
            return sendError(res, 'السعر مطلوب ويجب أن يكون أكبر من 0 عند تغيير النوع إلى بيع', 400);
        }
        updateData.price = Number(priceVal);
        if (!req.body.currency && !product.currency) {
            updateData.currency = 'SAR';
        }
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
        const newImages = [];
        req.files.forEach((file, index) => {
            newImages.push({
                url: file.path,
                alt: `${product.name} - صورة ${index + 1}`,
                isPrimary: index === 0 && product.images.length === 0
            });
        });
        updateData.images = [...product.images, ...newImages];
    }

    // Reset approval status if product was modified
    if (Object.keys(updateData).length > 0) {
        // If changing to asset: hide and mark approved (no review), otherwise require review
        if (updateData.type === 'asset') {
            updateData.status = 'inactive';
            updateData.approvalStatus = 'approved';
        } else {
            updateData.approvalStatus = 'pending';
            updateData.status = 'pending';
        }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate('category', 'name slug')
     .populate('lab', 'labName')
     .populate('owner', 'name');

    sendUpdated(res, 'تم تحديث المنتج بنجاح', updatedProduct);
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Lab Owner or Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    // Check permissions
    if (req.user.role !== 'admin' && product.owner.toString() !== req.user.id) {
        return sendError(res, 'غير مصرح لك بحذف هذا المنتج', 403);
    }

    // Check if product is in active orders or exchanges
    const Order = require('../models/Order');
    const Exchange = require('../models/Exchange');

    const [activeOrders, activeExchanges] = await Promise.all([
        Order.countDocuments({
            'items.product': req.params.id,
            status: { $in: ['pending', 'confirmed', 'processing'] }
        }),
        Exchange.countDocuments({
            $or: [
                { 'requesterProduct.product': req.params.id },
                { 'receiverProduct.product': req.params.id }
            ],
            status: { $in: ['pending', 'accepted', 'confirmed', 'in_progress'] }
        })
    ]);

    if (activeOrders > 0 || activeExchanges > 0) {
        return sendError(res, 'لا يمكن حذف المنتج لوجود طلبات أو تبادلات نشطة عليه', 400);
    }

    await Product.findByIdAndDelete(req.params.id);

    // Update lab's product count
    const lab = await Lab.findById(product.lab);
    if (lab) {
        lab.statistics.totalProducts = Math.max(0, lab.statistics.totalProducts - 1);
        await lab.save();
    }

    // Update category's product count
    await Category.updateProductsCount(product.category);

    sendDeleted(res, 'تم حذف المنتج بنجاح');
});

// @desc    Approve product (Admin only)
// @route   PUT /api/v1/products/:id/approve
// @access  Private/Admin
exports.approveProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('owner');

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    if (product.approvalStatus === 'approved') {
        return sendError(res, 'المنتج معتمد بالفعل', 400);
    }

    product.approvalStatus = 'approved';
    product.status = 'active';
    product.approvedBy = req.user.id;
    product.approvedAt = new Date();

    await product.save();

    // Send approval email to product owner
    try {
        await emailService.sendProductApprovedEmail(product);
    } catch (error) {
        console.error('Failed to send product approval email:', error);
    }

    sendSuccess(res, 'تم اعتماد المنتج بنجاح', {
        id: product._id,
        name: product.name,
        status: product.status,
        approvalStatus: product.approvalStatus
    });
});

// @desc    Reject product (Admin only)
// @route   PUT /api/v1/products/:id/reject
// @access  Private/Admin
exports.rejectProduct = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
        return sendError(res, 'يرجى إدخال سبب الرفض (على الأقل 10 أحرف)', 400);
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    product.approvalStatus = 'rejected';
    product.status = 'inactive';
    product.rejectionReason = reason.trim();

    await product.save();

    sendSuccess(res, 'تم رفض المنتج', {
        id: product._id,
        name: product.name,
        status: product.status,
        rejectionReason: reason
    });
});

// @desc    Get my products (Lab Owner)
// @route   GET /api/v1/products/my-products
// @access  Private/Lab
exports.getMyProducts = asyncHandler(async (req, res) => {
    // For lab users, get their lab
    if (req.user.role !== 'lab') {
        return sendError(res, 'هذه الخدمة متاحة للمختبرات فقط', 403);
    }

    // Find lab for this user
    const lab = await Lab.findOne({ user: req.user.id });
    if (!lab) {
        return sendError(res, 'لا يوجد مختبر مرتبط بحسابك', 400);
    }

    const { page = 1, limit = 12, status, type } = req.query;

    // Build filters - use lab ID instead of owner
    const filters = { lab: lab._id };
    
    if (status) filters.status = status;
    if (type) filters.type = type;

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    const products = await Product.find(filters)
        .populate('category', 'name slug')
        .populate('lab', 'labName')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

    const total = await Product.countDocuments(filters);
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب منتجات المختبر بنجاح', {
        products,
        pagination
    });
});

// @desc    Get trending products
// @route   GET /api/v1/products/trending
// @access  Public
exports.getTrendingProducts = asyncHandler(async (req, res) => {
    const { limit = 8 } = req.query;

    const products = await Product.getTrending(parseInt(limit));

    sendSuccess(res, 'تم جلب المنتجات الرائجة بنجاح', products);
});

// @desc    Toggle product favorite
// @route   POST /api/v1/products/:id/favorite
// @access  Private
exports.toggleFavorite = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    // Check if already favorited (you'd need to implement a favorites system)
    // For now, just increment the favorites count
    product.favorites += 1;
    await product.save();

    sendSuccess(res, 'تم إضافة المنتج إلى المفضلة', {
        id: product._id,
        favorites: product.favorites
    });
});

// @desc    Get product statistics
// @route   GET /api/v1/products/:id/statistics
// @access  Private/Owner or Admin
exports.getProductStatistics = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return sendError(res, 'المنتج غير موجود', 404);
    }

    // Check permissions
    if (req.user.role !== 'admin' && product.owner.toString() !== req.user.id) {
        return sendError(res, 'غير مصرح لك بعرض إحصائيات هذا المنتج', 403);
    }

    const statistics = {
        views: product.views,
        favorites: product.favorites,
        rating: product.rating,
        orders: product.metadata.soldCount,
        exchanges: product.metadata.exchangedCount,
        lastActivity: product.metadata.lastSoldAt || product.metadata.lastExchangedAt
    };

    sendSuccess(res, 'تم جلب إحصائيات المنتج بنجاح', statistics);
});