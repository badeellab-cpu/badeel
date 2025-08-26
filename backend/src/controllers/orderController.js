const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Lab = require('../models/Lab');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const emailService = require('../utils/email');
const { sendSuccess, sendError, sendCreated, sendUpdated } = require('../utils/apiResponse');
const { buildPagination, calculatePaginationMeta, parseQueryFilters, generateOrderNumber } = require('../utils/helpers');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate,
        paymentStatus,
        minAmount,
        maxAmount
    } = req.query;

    // Build filters
    const filters = {};

    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;

    // Date range filter
    if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
        filters.totalAmount = {};
        if (minAmount) filters.totalAmount.$gte = parseFloat(minAmount);
        if (maxAmount) filters.totalAmount.$lte = parseFloat(maxAmount);
    }

    // Search functionality
    if (search) {
        filters.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'buyer.name': { $regex: search, $options: 'i' } },
            { 'seller.name': { $regex: search, $options: 'i' } }
        ];
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const orders = await Order.find(filters)
        .populate('buyer.user', 'name email phone')
        .populate('buyer.lab', 'labName address')
        .populate('seller.user', 'name email phone')
        .populate('seller.lab', 'labName address')
        .populate('items.product', 'name images price')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Get total count for pagination
    const total = await Order.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب الطلبات بنجاح', {
        orders,
        pagination
    });
});

// @desc    Get my orders (as buyer)
// @route   GET /api/v1/orders/my-orders
// @access  Private/Lab
exports.getMyOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    // Get user's lab
    const lab = await Lab.findOne({ user: req.user.id });
    if (!lab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Build filters
    const filters = { 'buyer.lab': lab._id };
    if (status) filters.status = status;

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    const orders = await Order.find(filters)
        .populate('seller.lab', 'labName address contactPerson')
        .populate('items.product', 'name images price')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

    const total = await Order.countDocuments(filters);
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب طلباتك بنجاح', {
        orders,
        pagination
    });
});

// @desc    Get orders as seller
// @route   GET /api/v1/orders/as-seller
// @access  Private/Lab
exports.getOrdersAsSeller = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    // Get user's lab
    const lab = await Lab.findOne({ user: req.user.id });
    if (!lab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Build filters
    const filters = { 'seller.lab': lab._id };
    if (status) filters.status = status;

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    const orders = await Order.find(filters)
        .populate('buyer.lab', 'labName address contactPerson')
        .populate('items.product', 'name images price')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

    const total = await Order.countDocuments(filters);
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب الطلبات المرسلة إليك بنجاح', {
        orders,
        pagination
    });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private/Admin or Involved Lab
exports.getOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('buyer.user', 'name email phone')
        .populate('buyer.lab', 'labName address contactPerson')
        .populate('seller.user', 'name email phone')
        .populate('seller.lab', 'labName address contactPerson')
        .populate('items.product', 'name images price specifications')
        .populate('transactions');

    if (!order) {
        return sendError(res, 'الطلب غير موجود', 404);
    }

    // Check permissions (admin or involved in order)
    if (req.user.role !== 'admin') {
        const userLab = await Lab.findOne({ user: req.user.id });
        if (!userLab) {
            return sendError(res, 'غير مصرح لك بعرض هذا الطلب', 403);
        }

        // Support both populated and non-populated lab fields
        const buyerLabId = (order.buyer?.lab?._id || order.buyer?.lab)?.toString?.();
        const sellerLabId = (order.seller?.lab?._id || order.seller?.lab)?.toString?.();
        const userLabId = userLab._id.toString();

        if (buyerLabId !== userLabId && sellerLabId !== userLabId) {
            return sendError(res, 'غير مصرح لك بعرض هذا الطلب', 403);
        }
    }

    sendSuccess(res, 'تم جلب الطلب بنجاح', order);
});

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private/Lab
exports.createOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
        return sendError(res, 'يجب إضافة منتجات للطلب', 400);
    }

    // Get buyer's lab
    const buyerLab = await Lab.findOne({ user: req.user.id });
    if (!buyerLab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Validate and process items
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
        const product = await Product.findById(item.product).populate('lab owner');
        
        if (!product) {
            return sendError(res, `المنتج ${item.product} غير موجود`, 400);
        }

        if (product.type !== 'sale') {
            return sendError(res, `المنتج "${product.name}" غير متاح للبيع`, 400);
        }

        if (product.status !== 'active' || product.approvalStatus !== 'approved') {
            return sendError(res, `المنتج "${product.name}" غير متاح حالياً`, 400);
        }

        if (product.quantity < item.quantity) {
            return sendError(res, `الكمية المطلوبة من "${product.name}" غير متوفرة`, 400);
        }

        // Check if buying from same lab
        if (product.lab._id.toString() === buyerLab._id.toString()) {
            return sendError(res, 'لا يمكنك شراء منتجات من مختبرك', 400);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        processedItems.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price,
            total: itemTotal
        });
    }

    // Check if all items from same seller
    const sellerIds = [...new Set(processedItems.map(item => {
        const product = items.find(i => i.product === item.product.toString());
        return product.sellerId;
    }))];

    if (sellerIds.length > 1) {
        return sendError(res, 'جميع المنتجات يجب أن تكون من نفس البائع', 400);
    }

    // Get seller info
    const firstProduct = await Product.findById(processedItems[0].product).populate('lab owner');
    const sellerLab = firstProduct.lab;

    // Calculate shipping and taxes
    const shippingCost = totalAmount >= 1000 ? 0 : 50; // Free shipping over 1000 SAR
    const taxAmount = totalAmount * 0.15; // 15% VAT
    const finalAmount = totalAmount + shippingCost + taxAmount;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await Order.create({
        orderNumber,
        buyer: {
            user: req.user.id,
            lab: buyerLab._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone
        },
        seller: {
            user: firstProduct.owner._id,
            lab: sellerLab._id,
            name: firstProduct.owner.name,
            email: firstProduct.owner.email,
            phone: firstProduct.owner.phone
        },
        items: processedItems,
        subtotal: totalAmount,
        shippingCost,
        taxAmount,
        totalAmount: finalAmount,
        currency: 'SAR',
        shippingAddress: shippingAddress || buyerLab.address,
        paymentMethod: paymentMethod || 'wallet',
        status: 'pending',
        paymentStatus: 'pending',
        notes
    });

    // Reserve products
    for (const item of processedItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { quantity: -item.quantity }
        });
    }

    // Send notification emails
    try {
        await emailService.sendOrderCreatedEmail(order);
    } catch (error) {
        console.error('Failed to send order creation email:', error);
    }

    const populatedOrder = await Order.findById(order._id)
        .populate('buyer.lab', 'labName')
        .populate('seller.lab', 'labName')
        .populate('items.product', 'name images');

    sendCreated(res, 'تم إنشاء الطلب بنجاح', populatedOrder);
});

// @desc    Update order status (Seller or Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Seller or Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
        return sendError(res, 'حالة الطلب غير صحيحة', 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        return sendError(res, 'الطلب غير موجود', 404);
    }

    // Check permissions
    if (req.user.role !== 'admin') {
        const userLab = await Lab.findOne({ user: req.user.id });
        if (!userLab || order.seller.lab.toString() !== userLab._id.toString()) {
            return sendError(res, 'غير مصرح لك بتحديث حالة هذا الطلب', 403);
        }
    }

    // Validate status transitions
    const currentStatus = order.status;
    const invalidTransitions = {
        'cancelled': ['confirmed', 'processing', 'shipped', 'delivered'],
        'completed': ['cancelled', 'refunded'],
        'refunded': ['confirmed', 'processing', 'shipped', 'delivered']
    };

    if (invalidTransitions[currentStatus] && invalidTransitions[currentStatus].includes(status)) {
        return sendError(res, `لا يمكن تغيير حالة الطلب من ${currentStatus} إلى ${status}`, 400);
    }

    // Update order
    order.status = status;
    if (notes) {
        order.timeline.push({
            status,
            timestamp: new Date(),
            notes
        });
    }

    // Handle status-specific logic
    if (status === 'cancelled') {
        // Return products to inventory
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: item.quantity }
            });
        }
        order.paymentStatus = 'refunded';
    } else if (status === 'delivered') {
        order.paymentStatus = 'completed';
        order.deliveredAt = new Date();
        
        // Process payment from buyer wallet to seller wallet
        await processOrderPayment(order);
    } else if (status === 'confirmed') {
        order.confirmedAt = new Date();
    }

    await order.save();

    // Send notification emails
    try {
        await emailService.sendOrderStatusUpdateEmail(order);
    } catch (error) {
        console.error('Failed to send order status update email:', error);
    }

    sendUpdated(res, 'تم تحديث حالة الطلب بنجاح', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus
    });
});

// @desc    Cancel order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private/Buyer or Admin
exports.cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
        return sendError(res, 'الطلب غير موجود', 404);
    }

    // Check permissions
    if (req.user.role !== 'admin') {
        const userLab = await Lab.findOne({ user: req.user.id });
        if (!userLab || order.buyer.lab.toString() !== userLab._id.toString()) {
            return sendError(res, 'غير مصرح لك بإلغاء هذا الطلب', 403);
        }
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled', 'refunded'];
    if (nonCancellableStatuses.includes(order.status)) {
        return sendError(res, 'لا يمكن إلغاء هذا الطلب في حالته الحالية', 400);
    }

    // Update order status
    req.body.status = 'cancelled';
    req.body.notes = reason || 'تم إلغاء الطلب من قبل المشتري';

    return exports.updateOrderStatus(req, res);
});

// @desc    Get order statistics
// @route   GET /api/v1/orders/statistics
// @access  Private/Admin
exports.getOrderStatistics = asyncHandler(async (req, res) => {
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
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue
    ] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: startDate } }),
        Order.countDocuments({ status: 'pending', createdAt: { $gte: startDate } }),
        Order.countDocuments({ status: 'delivered', createdAt: { $gte: startDate } }),
        Order.countDocuments({ status: 'cancelled', createdAt: { $gte: startDate } }),
        Order.aggregate([
            { $match: { status: 'delivered', createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: null, average: { $avg: '$totalAmount' } } }
        ])
    ]);

    const statistics = {
        period,
        orders: {
            total: totalOrders,
            pending: pendingOrders,
            completed: completedOrders,
            cancelled: cancelledOrders
        },
        revenue: {
            total: totalRevenue[0]?.total || 0,
            currency: 'SAR'
        },
        averageOrderValue: averageOrderValue[0]?.average || 0
    };

    sendSuccess(res, 'تم جلب إحصائيات الطلبات بنجاح', statistics);
});

// Helper function to process order payment
const processOrderPayment = async (order) => {
    try {
        // Get wallets
        const [buyerWallet, sellerWallet] = await Promise.all([
            Wallet.findOne({ lab: order.buyer.lab }),
            Wallet.findOne({ lab: order.seller.lab })
        ]);

        if (!buyerWallet || buyerWallet.balance < order.totalAmount) {
            throw new Error('رصيد المشتري غير كافي');
        }

        // Create transaction record
        const transaction = await Transaction.create({
            type: 'order_payment',
            amount: order.totalAmount,
            currency: order.currency,
            from: {
                type: 'lab',
                lab: order.buyer.lab,
                user: order.buyer.user
            },
            to: {
                type: 'lab',
                lab: order.seller.lab,
                user: order.seller.user
            },
            reference: {
                type: 'order',
                id: order._id
            },
            status: 'completed',
            description: `دفع للطلب رقم ${order.orderNumber}`
        });

        // Update wallets
        await Promise.all([
            Wallet.findOneAndUpdate(
                { lab: order.buyer.lab },
                { $inc: { balance: -order.totalAmount } }
            ),
            Wallet.findOneAndUpdate(
                { lab: order.seller.lab },
                { $inc: { balance: order.totalAmount } }
            )
        ]);

        // Add transaction to order
        order.transactions.push(transaction._id);
        await order.save();

    } catch (error) {
        console.error('Failed to process order payment:', error);
        throw error;
    }
};