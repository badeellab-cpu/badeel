const asyncHandler = require('express-async-handler');
const Exchange = require('../models/Exchange');
const Product = require('../models/Product');
const Lab = require('../models/Lab');
const emailService = require('../utils/email');
const { sendSuccess, sendError, sendCreated, sendUpdated } = require('../utils/apiResponse');
const { buildPagination, calculatePaginationMeta, parseQueryFilters, generateExchangeNumber } = require('../utils/helpers');

// @desc    Get all exchanges
// @route   GET /api/v1/exchanges
// @access  Private/Admin
exports.getAllExchanges = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
    } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.status = status;

    // Date range filter
    if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
        filters.$or = [
            { exchangeNumber: { $regex: search, $options: 'i' } },
            { 'requester.name': { $regex: search, $options: 'i' } },
            { 'receiver.name': { $regex: search, $options: 'i' } }
        ];
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const exchanges = await Exchange.find(filters)
        .populate('requester.user', 'name email phone')
        .populate('requester.lab', 'labName address')
        .populate('receiver.user', 'name email phone')
        .populate('receiver.lab', 'labName address')
        .populate('requesterProduct.product', 'name images condition')
        .populate('receiverProduct.product', 'name images condition')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Get total count for pagination
    const total = await Exchange.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب طلبات التبادل بنجاح', {
        exchanges,
        pagination
    });
});

// @desc    Get my exchange requests (as requester)
// @route   GET /api/v1/exchanges/my-requests
// @access  Private/Lab
exports.getMyExchangeRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    // Get user's lab
    const userId = req.user.id || req.user._id;
    const lab = await Lab.findOne({ user: userId });
    if (!lab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Build filters
    const filters = { 'requester.lab': lab._id };
    if (status) filters.status = status;

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    const exchanges = await Exchange.find(filters)
        .populate('receiver.lab', 'labName address contactPerson')
        .populate('requesterProduct.product', 'name images condition')
        .populate('receiverProduct.product', 'name images condition')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

    const total = await Exchange.countDocuments(filters);
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب طلبات التبادل التي أرسلتها بنجاح', {
        exchanges,
        pagination
    });
});

// @desc    Get exchanges on my products (as receiver)
// @route   GET /api/v1/exchanges/on-my-products
// @access  Private/Lab
exports.getExchangesOnMyProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    // Get user's lab
    const userId = req.user.id || req.user._id;
    const lab = await Lab.findOne({ user: userId });
    if (!lab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Build filters
    const filters = { 'receiver.lab': lab._id };
    if (status) filters.status = status;

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    const exchanges = await Exchange.find(filters)
        .populate('requester.lab', 'labName address contactPerson')
        .populate('requesterProduct.product', 'name images condition')
        .populate('receiverProduct.product', 'name images condition')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

    const total = await Exchange.countDocuments(filters);
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب طلبات التبادل على منتجاتك بنجاح', {
        exchanges,
        pagination
    });
});

// @desc    Get single exchange
// @route   GET /api/v1/exchanges/:id
// @access  Private/Admin or Involved Lab
exports.getExchange = asyncHandler(async (req, res) => {
    const exchange = await Exchange.findById(req.params.id)
        .populate('requester.user', 'name email phone')
        .populate('requester.lab', 'labName address contactPerson')
        .populate('receiver.user', 'name email phone')
        .populate('receiver.lab', 'labName address contactPerson')
        .populate('requesterProduct.product', 'name images specifications condition brand model')
        .populate('receiverProduct.product', 'name images specifications condition brand model');

    if (!exchange) {
        return sendError(res, 'طلب التبادل غير موجود', 404);
    }

    // Check permissions (admin or involved in exchange)
    if (req.user.role !== 'admin') {
        const userId = req.user.id || req.user._id;
        const userLab = await Lab.findOne({ user: userId });
        // Normalize lab id in case of populated document
        const normalizeLabId = (labField) => {
            if (!labField) return undefined;
            return labField._id ? labField._id.toString() : labField.toString();
        };
        const requesterLabId = normalizeLabId(exchange.requester.lab);
        const receiverLabId = normalizeLabId(exchange.receiver.lab);

        if (!userLab || (requesterLabId !== userLab._id.toString() && receiverLabId !== userLab._id.toString())) {
            return sendError(res, 'غير مصرح لك بعرض طلب التبادل هذا', 403);
        }
    }

    sendSuccess(res, 'تم جلب طلب التبادل بنجاح', exchange);
});

// @desc    Create exchange request
// @route   POST /api/v1/exchanges
// @access  Private/Lab
exports.createExchangeRequest = asyncHandler(async (req, res) => {
    const { 
        receiverProductId,
        requesterProductId,
        requesterQuantity,
        receiverQuantity,
        message,
        proposedDeliveryDate 
    } = req.body;

    // Get requester's lab
    const requesterLab = await Lab.findOne({ user: req.user.id });
    if (!requesterLab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Validate products
    const [receiverProduct, requesterProduct] = await Promise.all([
        Product.findById(receiverProductId).populate('lab owner'),
        Product.findById(requesterProductId).populate('lab owner')
    ]);

    if (!receiverProduct || !requesterProduct) {
        return sendError(res, 'أحد المنتجات غير موجود', 400);
    }

    // Validate receiver product
    if (receiverProduct.type !== 'exchange') {
        return sendError(res, 'المنتج المطلوب غير متاح للتبادل', 400);
    }

    if (receiverProduct.status !== 'active' || receiverProduct.approvalStatus !== 'approved') {
        return sendError(res, 'المنتج المطلوب غير متاح حالياً', 400);
    }

    if (receiverProduct.quantity < receiverQuantity) {
        return sendError(res, 'الكمية المطلوبة من المنتج غير متوفرة', 400);
    }

    // Validate requester product
    if (requesterProduct.type !== 'exchange') {
        return sendError(res, 'منتجك غير متاح للتبادل', 400);
    }

    if (requesterProduct.lab._id.toString() !== requesterLab._id.toString()) {
        return sendError(res, 'المنتج المعروض للتبادل ليس من مختبرك', 400);
    }

    if (requesterProduct.quantity < requesterQuantity) {
        return sendError(res, 'الكمية المعروضة من منتجك غير متوفرة', 400);
    }

    // Check if exchanging with same lab
    if (receiverProduct.lab._id.toString() === requesterLab._id.toString()) {
        return sendError(res, 'لا يمكنك تبادل منتجات مع نفس المختبر', 400);
    }

    // Check exchange preferences
    const exchangePreferences = receiverProduct.exchangePreferences;
    if (exchangePreferences) {
        // Check accepted categories
        if (exchangePreferences.acceptedCategories && 
            exchangePreferences.acceptedCategories.length > 0 &&
            !exchangePreferences.acceptedCategories.includes(requesterProduct.category.toString())) {
            return sendError(res, 'منتجك لا ينتمي للفئات المقبولة للتبادل', 400);
        }

        // Check accepted conditions
        if (exchangePreferences.acceptedConditions && 
            exchangePreferences.acceptedConditions.length > 0 &&
            !exchangePreferences.acceptedConditions.includes(requesterProduct.condition)) {
            return sendError(res, 'حالة منتجك لا تتوافق مع شروط التبادل', 400);
        }

        // Check preferred brands
        if (exchangePreferences.preferredBrands && 
            exchangePreferences.preferredBrands.length > 0 &&
            !exchangePreferences.preferredBrands.includes(requesterProduct.brand)) {
            return sendError(res, 'علامة منتجك التجارية غير مفضلة للتبادل', 400);
        }
    }

    // Generate exchange number
    const exchangeNumber = generateExchangeNumber();

    // Create exchange request
    const exchange = await Exchange.create({
        exchangeNumber,
        requester: {
            user: req.user.id || req.user._id,
            lab: requesterLab._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone
        },
        receiver: {
            user: receiverProduct.owner._id,
            lab: receiverProduct.lab._id,
            name: receiverProduct.owner.name,
            email: receiverProduct.owner.email,
            phone: receiverProduct.owner.phone
        },
        requesterProduct: {
            product: requesterProduct._id,
            quantity: requesterQuantity
        },
        receiverProduct: {
            product: receiverProduct._id,
            quantity: receiverQuantity
        },
        message,
        proposedDeliveryDate,
        status: exchangePreferences?.autoAccept ? 'accepted' : 'pending'
    });

    // لا نقوم بحجز الكميات هنا. سيتم خصم الكميات عند القبول لتفادي حالات الحجز غير الضرورية

    // Send notification email
    try {
        await emailService.sendExchangeRequestEmail(exchange);
    } catch (error) {
        console.error('Failed to send exchange request email:', error);
    }

    const populatedExchange = await Exchange.findById(exchange._id)
        .populate('receiver.lab', 'labName')
        .populate('requesterProduct.product', 'name images')
        .populate('receiverProduct.product', 'name images');

    sendCreated(res, 'تم إرسال طلب التبادل بنجاح', populatedExchange);
});

// @desc    Respond to exchange request
// @route   PUT /api/v1/exchanges/:id/respond
// @access  Private/Receiver
exports.respondToExchange = asyncHandler(async (req, res) => {
    const { action, message, counterOffer } = req.body;

    const validActions = ['accept', 'reject', 'counter'];
    if (!validActions.includes(action)) {
        return sendError(res, 'الإجراء غير صحيح', 400);
    }

    const exchange = await Exchange.findById(req.params.id)
        .populate('requesterProduct.product')
        .populate('receiverProduct.product');

    if (!exchange) {
        return sendError(res, 'طلب التبادل غير موجود', 404);
    }

    // Check permissions (must be receiver)
    const userLab = await Lab.findOne({ user: req.user.id });
    if (!userLab || exchange.receiver.lab.toString() !== userLab._id.toString()) {
        return sendError(res, 'غير مصرح لك بالرد على طلب التبادل هذا', 403);
    }

    // Check if exchange is still pending
    if (exchange.status !== 'pending') {
        return sendError(res, 'لا يمكن الرد على طلب التبادل في حالته الحالية', 400);
    }

    // Handle different actions
    if (action === 'accept') {
        // قبل القبول، تحقق من توفر الكميات
        const [requesterProductDoc, receiverProductDoc] = await Promise.all([
            Product.findById(exchange.requesterProduct.product._id || exchange.requesterProduct.product),
            Product.findById(exchange.receiverProduct.product._id || exchange.receiverProduct.product)
        ]);

        if (!requesterProductDoc || !receiverProductDoc) {
            return sendError(res, 'أحد المنتجات غير موجود', 400);
        }

        if (requesterProductDoc.quantity < exchange.requesterProduct.quantity) {
            return sendError(res, 'كمية منتج الطالب غير كافية', 400);
        }
        if (receiverProductDoc.quantity < exchange.receiverProduct.quantity) {
            return sendError(res, 'كمية منتج المستقبل غير كافية', 400);
        }

        // خصم الكميات فور القبول
        await Promise.all([
            Product.findByIdAndUpdate(requesterProductDoc._id, { $inc: { quantity: -exchange.requesterProduct.quantity } }),
            Product.findByIdAndUpdate(receiverProductDoc._id, { $inc: { quantity: -exchange.receiverProduct.quantity } })
        ]);

        exchange.status = 'accepted';
        exchange.acceptedAt = new Date();
        
        // تحديث عدادات التبادل فقط
        await Promise.all([
            Product.findByIdAndUpdate(requesterProductDoc._id, {
                $inc: { 'metadata.exchangedCount': 1 },
                'metadata.lastExchangedAt': new Date()
            }),
            Product.findByIdAndUpdate(receiverProductDoc._id, {
                $inc: { 'metadata.exchangedCount': 1 },
                'metadata.lastExchangedAt': new Date()
            })
        ]);

    } else if (action === 'reject') {
        exchange.status = 'rejected';
        exchange.rejectedAt = new Date();
        
        // Return products to inventory
        await Promise.all([
            Product.findByIdAndUpdate(exchange.receiverProduct.product._id, {
                $inc: { quantity: exchange.receiverProduct.quantity }
            }),
            Product.findByIdAndUpdate(exchange.requesterProduct.product._id, {
                $inc: { quantity: exchange.requesterProduct.quantity }
            })
        ]);

    } else if (action === 'counter') {
        if (!counterOffer) {
            return sendError(res, 'يجب تقديم عرض مضاد', 400);
        }
        
        exchange.status = 'counter_offered';
        exchange.counterOffer = counterOffer;
    }

    // Add response to timeline
    exchange.timeline.push({
        action,
        message,
        timestamp: new Date(),
        by: req.user.id || req.user._id
    });

    if (message) {
        exchange.receiverMessage = message;
    }

    await exchange.save();

    // Send notification email
    try {
        await emailService.sendExchangeResponseEmail(exchange, action);
    } catch (error) {
        console.error('Failed to send exchange response email:', error);
    }

    const actionText = {
        'accept': 'قبول',
        'reject': 'رفض',
        'counter': 'تقديم عرض مضاد على'
    };

    sendUpdated(res, `تم ${actionText[action]} طلب التبادل بنجاح`, {
        exchangeId: exchange._id,
        exchangeNumber: exchange.exchangeNumber,
        status: exchange.status,
        action
    });
});

// @desc    Update exchange status (Admin or involved parties)
// @route   PUT /api/v1/exchanges/:id/status
// @access  Private
exports.updateExchangeStatus = asyncHandler(async (req, res) => {
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return sendError(res, 'حالة التبادل غير صحيحة', 400);
    }

    const exchange = await Exchange.findById(req.params.id);
    if (!exchange) {
        return sendError(res, 'طلب التبادل غير موجود', 404);
    }

    // Check permissions
    if (req.user.role !== 'admin') {
        const userId = req.user.id || req.user._id;
        const userLab = await Lab.findOne({ user: userId });
        const normalizeLabId = (labField) => {
            if (!labField) return undefined;
            return labField._id ? labField._id.toString() : labField.toString();
        };
        const requesterLabId = normalizeLabId(exchange.requester.lab);
        const receiverLabId = normalizeLabId(exchange.receiver.lab);
        if (!userLab || (requesterLabId !== userLab._id.toString() && receiverLabId !== userLab._id.toString())) {
            return sendError(res, 'غير مصرح لك بتحديث حالة طلب التبادل هذا', 403);
        }
    }

    // Update exchange
    exchange.status = status;
    if (notes) {
        // Use statusHistory instead of timeline (which doesn't exist in schema)
        exchange.statusHistory.push({
            status: status,
            note: notes,
            updatedBy: req.user.id || req.user._id,
            updatedAt: new Date()
        });
    }

    // Handle status-specific logic
    if (status === 'completed') {
        exchange.completedAt = new Date();
    } else if (status === 'cancelled') {
        // Return products to inventory
        await Promise.all([
            Product.findByIdAndUpdate(exchange.receiverProduct.product, {
                $inc: { quantity: exchange.receiverProduct.quantity }
            }),
            Product.findByIdAndUpdate(exchange.requesterProduct.product, {
                $inc: { quantity: exchange.requesterProduct.quantity }
            })
        ]);
    }

    await exchange.save();

    sendUpdated(res, 'تم تحديث حالة التبادل بنجاح', {
        exchangeId: exchange._id,
        exchangeNumber: exchange.exchangeNumber,
        status: exchange.status
    });
});

// @desc    Get exchange statistics
// @route   GET /api/v1/exchanges/statistics
// @access  Private/Admin
exports.getExchangeStatistics = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;

    // Get date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
        totalExchanges,
        pendingExchanges,
        acceptedExchanges,
        completedExchanges,
        rejectedExchanges,
        cancelledExchanges
    ] = await Promise.all([
        Exchange.countDocuments({ createdAt: { $gte: startDate } }),
        Exchange.countDocuments({ status: 'pending', createdAt: { $gte: startDate } }),
        Exchange.countDocuments({ status: 'accepted', createdAt: { $gte: startDate } }),
        Exchange.countDocuments({ status: 'completed', createdAt: { $gte: startDate } }),
        Exchange.countDocuments({ status: 'rejected', createdAt: { $gte: startDate } }),
        Exchange.countDocuments({ status: 'cancelled', createdAt: { $gte: startDate } })
    ]);

    const statistics = {
        period,
        exchanges: {
            total: totalExchanges,
            pending: pendingExchanges,
            accepted: acceptedExchanges,
            completed: completedExchanges,
            rejected: rejectedExchanges,
            cancelled: cancelledExchanges
        },
        successRate: totalExchanges > 0 ? Math.round((completedExchanges / totalExchanges) * 100) : 0,
        acceptanceRate: totalExchanges > 0 ? Math.round((acceptedExchanges / totalExchanges) * 100) : 0
    };

    sendSuccess(res, 'تم جلب إحصائيات التبادل بنجاح', statistics);
});