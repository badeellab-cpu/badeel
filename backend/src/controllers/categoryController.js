const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted } = require('../utils/apiResponse');
const { buildPagination, calculatePaginationMeta, parseQueryFilters, generateSlug } = require('../utils/helpers');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 50, 
        search, 
        parent, 
        isActive, // no default => show all by default
        isFeatured,
        sortBy = 'order', 
        sortOrder = 'asc',
        includeProducts = false
    } = req.query;

    // Build filters
    const filters = {};
    
    if (search) {
        filters.$or = [
            { 'name.ar': { $regex: search, $options: 'i' } },
            { 'name.en': { $regex: search, $options: 'i' } },
            { 'description.ar': { $regex: search, $options: 'i' } },
            { 'description.en': { $regex: search, $options: 'i' } }
        ];
    }

    if (parent !== undefined) {
        filters.parent = parent === 'null' || parent === '' ? null : parent;
    }

    // Only apply isActive filter when value is explicitly true/false
    if (isActive !== undefined && isActive !== 'all' && isActive !== '' && isActive !== 'undefined') {
        filters.isActive = isActive === 'true';
    }

    if (isFeatured !== undefined) {
        filters.isFeatured = isFeatured === 'true';
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Build query
    let query = Category.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Populate parent if needed
    if (parent !== 'null') {
        query = query.populate('parent', 'name slug');
    }

    // Include products count if requested
    if (includeProducts === 'true') {
        query = query.populate('products', '_id name');
    }

    const categories = await query;

    // Get total count for pagination
    const total = await Category.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب الفئات بنجاح', {
        categories,
        pagination
    });
});

// @desc    Get category tree
// @route   GET /api/v1/categories/tree
// @access  Public
exports.getCategoryTree = asyncHandler(async (req, res) => {
    const tree = await Category.buildTree();
    sendSuccess(res, 'تم جلب شجرة الفئات بنجاح', tree);
});

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res) => {
    const { includeProducts = false, productLimit = 10 } = req.query;

    let query = Category.findById(req.params.id)
        .populate('parent', 'name slug')
        .populate('subcategories', 'name slug icon order');

    if (includeProducts === 'true') {
        query = query.populate({
            path: 'products',
            match: { status: 'active', approvalStatus: 'approved' },
            select: 'name slug price images type condition rating',
            options: { limit: parseInt(productLimit) }
        });
    }

    const category = await query;

    if (!category) {
        return sendError(res, 'الفئة غير موجودة', 404);
    }

    // Increment views count
    category.metadata.viewsCount += 1;
    await category.save();

    sendSuccess(res, 'تم جلب الفئة بنجاح', category);
});

// @desc    Get category by slug
// @route   GET /api/v1/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
    const { includeProducts = false, productLimit = 10 } = req.query;

    let query = Category.findOne({ slug: req.params.slug, isActive: true })
        .populate('parent', 'name slug')
        .populate('subcategories', 'name slug icon order');

    if (includeProducts === 'true') {
        query = query.populate({
            path: 'products',
            match: { status: 'active', approvalStatus: 'approved' },
            select: 'name slug price images type condition rating',
            options: { limit: parseInt(productLimit) }
        });
    }

    const category = await query;

    if (!category) {
        return sendError(res, 'الفئة غير موجودة', 404);
    }

    // Increment views count
    category.metadata.viewsCount += 1;
    await category.save();

    sendSuccess(res, 'تم جلب الفئة بنجاح', category);
});

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        parent,
        image,
        order,
        isActive = true,
        isFeatured = false,
        attributes,
        seo
    } = req.body;

    // Check if category with same name exists (check both Arabic and English)
    const existingCategory = await Category.findOne({ 
        $or: [
            { 'name.ar': new RegExp(`^${name.ar}$`, 'i') },
            { 'name.en': new RegExp(`^${name.en}$`, 'i') }
        ],
        parent: parent || null
    });

    if (existingCategory) {
        return sendError(res, 'توجد فئة بنفس الاسم في نفس المستوى', 400);
    }

    // Validate parent category if provided
    if (parent) {
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
            return sendError(res, 'الفئة الأب غير موجودة', 400);
        }
    }

    // Generate slug from Arabic name
    const slug = generateSlug(name.ar);

    // Ensure unique slug
    let uniqueSlug = slug;
    let counter = 1;
    while (await Category.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    const categoryData = {
        name: {
            ar: name.ar.trim(),
            en: name.en.trim()
        },
        slug: uniqueSlug,
        description: {
            ar: description?.ar?.trim() || '',
            en: description?.en?.trim() || ''
        },
        parent: parent || null,
        image,
        order: order || 0,
        isActive,
        isFeatured,
        attributes: attributes || [],
        seo: seo || {}
    };

    const category = await Category.create(categoryData);

    sendCreated(res, 'تم إنشاء الفئة بنجاح', category);
});

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return sendError(res, 'الفئة غير موجودة', 404);
    }

    const {
        name,
        description,
        parent,
        icon,
        image,
        color,
        order,
        isActive,
        isFeatured,
        attributes,
        seo
    } = req.body;

    // Check if trying to set self as parent
    if (parent && parent === req.params.id) {
        return sendError(res, 'لا يمكن تعيين الفئة كأب لنفسها', 400);
    }

    // Check if category with same name exists (excluding current category)
    if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ 
            name: new RegExp(`^${name}$`, 'i'),
            parent: parent || category.parent || null,
            _id: { $ne: req.params.id }
        });

        if (existingCategory) {
            return sendError(res, 'توجد فئة بنفس الاسم في نفس المستوى', 400);
        }
    }

    // Validate parent category if provided
    if (parent && parent !== category.parent) {
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
            return sendError(res, 'الفئة الأب غير موجودة', 400);
        }

        // Check for circular reference
        const ancestors = await parentCategory.getAncestors();
        if (ancestors.some(ancestor => ancestor._id.toString() === req.params.id)) {
            return sendError(res, 'لا يمكن تعيين فئة فرعية كأب', 400);
        }
    }

    // Update fields
    const updateData = {};
    
    if (name !== undefined) {
        updateData.name = name.trim();
        // Regenerate slug if name changed
        if (name !== category.name) {
            const slug = generateSlug(name);
            let uniqueSlug = slug;
            let counter = 1;
            while (await Category.findOne({ slug: uniqueSlug, _id: { $ne: req.params.id } })) {
                uniqueSlug = `${slug}-${counter}`;
                counter++;
            }
            updateData.slug = uniqueSlug;
        }
    }

    if (description !== undefined) updateData.description = description?.trim();
    if (parent !== undefined) updateData.parent = parent || null;
    if (icon !== undefined) updateData.icon = icon;
    if (image !== undefined) updateData.image = image;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (attributes !== undefined) updateData.attributes = attributes;
    if (seo !== undefined) updateData.seo = seo;

    const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    sendUpdated(res, 'تم تحديث الفئة بنجاح', updatedCategory);
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return sendError(res, 'الفئة غير موجودة', 404);
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
        return sendError(res, `لا يمكن حذف الفئة لأن بها ${productsCount} منتج`, 400);
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ parent: req.params.id });
    if (subcategoriesCount > 0) {
        return sendError(res, `لا يمكن حذف الفئة لأن بها ${subcategoriesCount} فئة فرعية`, 400);
    }

    await Category.findByIdAndDelete(req.params.id);

    sendDeleted(res, 'تم حذف الفئة بنجاح');
});

// @desc    Toggle category status
// @route   PUT /api/v1/categories/:id/toggle-status
// @access  Private/Admin
exports.toggleCategoryStatus = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return sendError(res, 'الفئة غير موجودة', 404);
    }

    category.isActive = !category.isActive;
    await category.save();

    const statusText = category.isActive ? 'تم تفعيل' : 'تم إلغاء تفعيل';
    sendSuccess(res, `${statusText} الفئة بنجاح`, {
        id: category._id,
        name: category.name,
        isActive: category.isActive
    });
});

// @desc    Get featured categories
// @route   GET /api/v1/categories/featured
// @access  Public
exports.getFeaturedCategories = asyncHandler(async (req, res) => {
    const { limit = 6 } = req.query;

    const categories = await Category.find({ 
        isFeatured: true, 
        isActive: true 
    })
    .sort('order name')
    .limit(parseInt(limit))
    .select('name slug icon image color metadata');

    sendSuccess(res, 'تم جلب الفئات المميزة بنجاح', categories);
});

// @desc    Get category statistics
// @route   GET /api/v1/categories/:id/statistics
// @access  Private/Admin
exports.getCategoryStatistics = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return sendError(res, 'الفئة غير موجودة', 404);
    }

    // Get products count by status
    const [
        totalProducts,
        activeProducts,
        pendingProducts,
        subcategoriesCount,
        descendants
    ] = await Promise.all([
        Product.countDocuments({ category: req.params.id }),
        Product.countDocuments({ category: req.params.id, status: 'active' }),
        Product.countDocuments({ category: req.params.id, status: 'pending' }),
        Category.countDocuments({ parent: req.params.id }),
        category.getDescendants()
    ]);

    // Get total products in all descendants
    const descendantIds = descendants.map(d => d._id);
    const totalProductsInTree = await Product.countDocuments({
        category: { $in: [req.params.id, ...descendantIds] }
    });

    const statistics = {
        products: {
            total: totalProducts,
            active: activeProducts,
            pending: pendingProducts,
            totalInTree: totalProductsInTree
        },
        subcategories: {
            direct: subcategoriesCount,
            total: descendants.length
        },
        views: category.metadata.viewsCount || 0
    };

    sendSuccess(res, 'تم جلب إحصائيات الفئة بنجاح', statistics);
});

// @desc    Reorder categories
// @route   PUT /api/v1/categories/reorder
// @access  Private/Admin
exports.reorderCategories = asyncHandler(async (req, res) => {
    const { categoryOrders } = req.body;

    if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
        return sendError(res, 'يرجى تقديم ترتيب الفئات', 400);
    }

    // Validate category IDs
    const categoryIds = categoryOrders.map(item => item.id);
    const existingCategories = await Category.find({ _id: { $in: categoryIds } });

    if (existingCategories.length !== categoryIds.length) {
        return sendError(res, 'بعض الفئات غير موجودة', 400);
    }

    // Update orders
    const bulkOps = categoryOrders.map(item => ({
        updateOne: {
            filter: { _id: item.id },
            update: { order: item.order }
        }
    }));

    await Category.bulkWrite(bulkOps);

    sendSuccess(res, 'تم تحديث ترتيب الفئات بنجاح');
});