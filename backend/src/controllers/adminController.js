const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Exchange = require('../models/Exchange');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ExchangeRequest = require('../models/ExchangeRequest');
const Category = require('../models/Category');
const { sendSuccess, sendError, sendUpdated } = require('../utils/apiResponse');
const { getDateRangeForPeriod, buildPagination, calculatePaginationMeta } = require('../utils/helpers');

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(period);

    // Get overall statistics
    const [
        totalUsers,
        totalLabs,
        totalProducts,
        totalOrders,
        totalExchanges,
        totalRevenue,
        totalWalletBalance,
        totalCategories
    ] = await Promise.all([
        User.countDocuments(),
        Lab.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Exchange.countDocuments(),
        Transaction.aggregate([
            { $match: { type: 'order_payment', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Wallet.aggregate([
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]),
        Category.countDocuments()
    ]);

    // Get period-specific statistics
    const [
        newUsers,
        newLabs,
        newProducts,
        newOrders,
        newExchanges,
        periodRevenue,
        pendingLabs,
        pendingProducts
    ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
        Lab.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
        Product.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
        Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
        Exchange.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
        Transaction.aggregate([
            { 
                $match: { 
                    type: 'order_payment', 
                    status: 'completed',
                    createdAt: { $gte: startDate, $lte: endDate }
                } 
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        User.countDocuments({ status: 'pending', role: 'lab' }),
        Product.countDocuments({ approvalStatus: 'pending' })
    ]);

    // Get lab statistics by status
    const labsByStatus = await User.aggregate([
        { $match: { role: 'lab' } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get product statistics by status
    const productsByStatus = await Product.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get order statistics by status
    const ordersByStatus = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get exchange statistics by status
    const exchangesByStatus = await Exchange.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get top categories by product count
    const topCategories = await Product.aggregate([
        { $match: { status: 'active' } },
        { 
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        { $unwind: '$categoryInfo' },
        { $group: { _id: '$category', name: { $first: '$categoryInfo.name' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);

    // Get recent activities
    const [recentOrders, recentExchanges, recentLabs] = await Promise.all([
        Order.find().sort('-createdAt').limit(5)
            .populate('buyer.lab', 'labName')
            .populate('seller.lab', 'labName')
            .select('orderNumber totalAmount status createdAt buyer seller'),
        Exchange.find().sort('-createdAt').limit(5)
            .populate('requester.lab', 'labName')
            .populate('receiver.lab', 'labName')
            .select('exchangeNumber status createdAt requester receiver'),
        Lab.find().sort('-createdAt').limit(5)
            .populate('user', 'name email status')
            .select('labName createdAt user registrationNumber')
    ]);

    // Calculate growth rates
    const calculateGrowthRate = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const statistics = {
        period,
        overview: {
            totalUsers,
            totalLabs,
            totalProducts,
            totalOrders,
            totalExchanges,
            totalCategories,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalWalletBalance: totalWalletBalance[0]?.total || 0,
            currency: 'SAR'
        },
        periodStats: {
            newUsers,
            newLabs,
            newProducts,
            newOrders,
            newExchanges,
            periodRevenue: periodRevenue[0]?.total || 0,
            pendingLabs,
            pendingProducts
        },
        breakdown: {
            labsByStatus: Object.fromEntries(
                labsByStatus.map(item => [item._id, item.count])
            ),
            productsByStatus: Object.fromEntries(
                productsByStatus.map(item => [item._id, item.count])
            ),
            ordersByStatus: Object.fromEntries(
                ordersByStatus.map(item => [item._id, item.count])
            ),
            exchangesByStatus: Object.fromEntries(
                exchangesByStatus.map(item => [item._id, item.count])
            )
        },
        topCategories,
        recentActivities: {
            orders: recentOrders,
            exchanges: recentExchanges,
            labs: recentLabs
        }
    };

    sendSuccess(res, 'تم جلب إحصائيات لوحة التحكم بنجاح', statistics);
});

// @desc    Get system analytics
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
exports.getSystemAnalytics = asyncHandler(async (req, res) => {
    const { period = 'month', granularity = 'day' } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(period);

    // Determine date grouping format based on granularity
    let dateFormat;
    switch (granularity) {
        case 'hour':
            dateFormat = '%Y-%m-%d-%H';
            break;
        case 'day':
            dateFormat = '%Y-%m-%d';
            break;
        case 'week':
            dateFormat = '%Y-%U';
            break;
        case 'month':
            dateFormat = '%Y-%m';
            break;
        default:
            dateFormat = '%Y-%m-%d';
    }

    // Get user registration trends
    const userTrends = await User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    role: '$role'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    // Get order trends
    const orderTrends = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    status: '$status'
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    // Get product trends
    const productTrends = await Product.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    type: '$type'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    // Get transaction trends
    const transactionTrends = await Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    type: '$type'
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    // Get lab activity (orders + exchanges)
    const labActivity = await Lab.aggregate([
        {
            $lookup: {
                from: 'orders',
                let: { labId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: ['$buyer.lab', '$$labId'] },
                                    { $eq: ['$seller.lab', '$$labId'] }
                                ]
                            },
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    }
                ],
                as: 'orders'
            }
        },
        {
            $lookup: {
                from: 'exchanges',
                let: { labId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: ['$requester.lab', '$$labId'] },
                                    { $eq: ['$receiver.lab', '$$labId'] }
                                ]
                            },
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    }
                ],
                as: 'exchanges'
            }
        },
        {
            $project: {
                labName: 1,
                orderCount: { $size: '$orders' },
                exchangeCount: { $size: '$exchanges' },
                totalActivity: { $add: [{ $size: '$orders' }, { $size: '$exchanges' }] }
            }
        },
        { $sort: { totalActivity: -1 } },
        { $limit: 10 }
    ]);

    const analytics = {
        period,
        granularity,
        trends: {
            users: userTrends,
            orders: orderTrends,
            products: productTrends,
            transactions: transactionTrends
        },
        topLabs: labActivity
    };

    sendSuccess(res, 'تم جلب تحليلات النظام بنجاح', analytics);
});

// @desc    Get revenue analytics
// @route   GET /api/v1/admin/revenue-analytics
// @access  Private/Admin
exports.getRevenueAnalytics = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(period);

    // Get revenue by transaction type
    const revenueByType = await Transaction.aggregate([
        { 
            $match: { 
                status: 'completed',
                createdAt: { $gte: startDate, $lte: endDate }
            } 
        },
        {
            $group: {
                _id: '$type',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 },
                avgAmount: { $avg: '$amount' }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);

    // Get daily revenue trends
    const dailyRevenue = await Transaction.aggregate([
        { 
            $match: { 
                type: 'order_payment',
                status: 'completed',
                createdAt: { $gte: startDate, $lte: endDate }
            } 
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$amount' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Get top revenue generating labs
    const topRevenueLabs = await Transaction.aggregate([
        { 
            $match: { 
                type: 'order_payment',
                status: 'completed',
                createdAt: { $gte: startDate, $lte: endDate }
            } 
        },
        {
            $lookup: {
                from: 'labs',
                localField: 'to.lab',
                foreignField: '_id',
                as: 'lab'
            }
        },
        { $unwind: '$lab' },
        {
            $group: {
                _id: '$to.lab',
                labName: { $first: '$lab.labName' },
                totalRevenue: { $sum: '$amount' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
    ]);

    // Get wallet statistics
    const walletStats = await Wallet.aggregate([
        {
            $group: {
                _id: null,
                totalBalance: { $sum: '$balance' },
                activeWallets: { $sum: { $cond: [{ $gt: ['$balance', 0] }, 1, 0] } },
                avgBalance: { $avg: '$balance' },
                maxBalance: { $max: '$balance' },
                minBalance: { $min: '$balance' }
            }
        }
    ]);

    const analytics = {
        period,
        revenue: {
            byType: revenueByType,
            daily: dailyRevenue,
            total: revenueByType.reduce((sum, item) => sum + item.totalAmount, 0)
        },
        topLabs: topRevenueLabs,
        wallets: walletStats[0] || {
            totalBalance: 0,
            activeWallets: 0,
            avgBalance: 0,
            maxBalance: 0,
            minBalance: 0
        }
    };

    sendSuccess(res, 'تم جلب تحليلات الإيرادات بنجاح', analytics);
});

// @desc    Get user analytics
// @route   GET /api/v1/admin/user-analytics
// @access  Private/Admin
exports.getUserAnalytics = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRangeForPeriod(period);

    // Get user registration trends
    const registrationTrends = await User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    role: '$role'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    // Get user status distribution
    const userStatusDistribution = await User.aggregate([
        { $match: { role: 'lab' } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get most active labs
    const mostActiveLabs = await Lab.aggregate([
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'lab',
                as: 'products'
            }
        },
        {
            $lookup: {
                from: 'orders',
                let: { labId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: ['$buyer.lab', '$$labId'] },
                                    { $eq: ['$seller.lab', '$$labId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'orders'
            }
        },
        {
            $lookup: {
                from: 'exchanges',
                let: { labId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: ['$requester.lab', '$$labId'] },
                                    { $eq: ['$receiver.lab', '$$labId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'exchanges'
            }
        },
        {
            $project: {
                labName: 1,
                productCount: { $size: '$products' },
                orderCount: { $size: '$orders' },
                exchangeCount: { $size: '$exchanges' },
                totalActivity: {
                    $add: [
                        { $size: '$products' },
                        { $size: '$orders' },
                        { $size: '$exchanges' }
                    ]
                },
                lastActivity: {
                    $max: [
                        { $max: '$products.createdAt' },
                        { $max: '$orders.createdAt' },
                        { $max: '$exchanges.createdAt' }
                    ]
                }
            }
        },
        { $sort: { totalActivity: -1 } },
        { $limit: 10 }
    ]);

    // Get geographic distribution
    const geographicDistribution = await Lab.aggregate([
        {
            $group: {
                _id: '$address.city',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    const analytics = {
        period,
        registration: {
            trends: registrationTrends,
            totalUsers: await User.countDocuments(),
            totalLabs: await Lab.countDocuments(),
            newUsersInPeriod: await User.countDocuments({ 
                createdAt: { $gte: startDate, $lte: endDate } 
            })
        },
        labStatus: userStatusDistribution,
        activity: {
            mostActiveLabs,
            averageProductsPerLab: await Lab.aggregate([
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: 'lab',
                        as: 'products'
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgProducts: { $avg: { $size: '$products' } }
                    }
                }
            ])
        },
        geographic: geographicDistribution
    };

    sendSuccess(res, 'تم جلب تحليلات المستخدمين بنجاح', analytics);
});

// @desc    Get system health
// @route   GET /api/v1/admin/system-health
// @access  Private/Admin
exports.getSystemHealth = asyncHandler(async (req, res) => {
    const currentTime = new Date();

    // Check database connectivity
    const dbHealthy = await User.countDocuments().then(() => true).catch(() => false);

    // Get recent error logs (this would typically come from a logging service)
    const recentErrors = []; // Placeholder for actual error logging

    // Get system metrics
    const metrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: currentTime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };

    // Check key system components
    const componentStatus = {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        api: 'healthy', // API is healthy if we can respond
        fileSystem: true, // Simplified check
        email: true // Would check email service connectivity
    };

    // Get pending items that need attention
    const [
        pendingLabApprovals,
        pendingProductApprovals,
        failedTransactions,
        systemAlerts
    ] = await Promise.all([
        User.countDocuments({ status: 'pending', role: 'lab' }),
        Product.countDocuments({ approvalStatus: 'pending' }),
        Transaction.countDocuments({ status: 'failed' }),
        // In a real system, this would come from an alerting service
        Promise.resolve([])
    ]);

    const health = {
        status: Object.values(componentStatus).every(status => status === 'healthy' || status === true) ? 'healthy' : 'degraded',
        timestamp: currentTime,
        metrics,
        components: componentStatus,
        alerts: {
            pendingLabApprovals,
            pendingProductApprovals,
            failedTransactions,
            systemAlerts: systemAlerts.length
        },
        recentErrors: recentErrors.slice(0, 10) // Last 10 errors
    };

    sendSuccess(res, 'تم جلب حالة النظام بنجاح', health);
});

// @desc    Get confirmed orders (Orders + Exchanges)
// @route   GET /api/v1/admin/confirmed-orders
// @access  Private/Admin
exports.getConfirmedOrders = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        type, // 'order', 'exchange', or 'all'
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let confirmedOrders = [];
    let totalCount = 0;

    // Get confirmed orders (not pending)
    if (type !== 'exchange') {
        const orderFilters = {
            status: { $nin: ['pending'] }
        };

        if (status) orderFilters.status = status;
        if (dateFilter.$gte || dateFilter.$lte) orderFilters.createdAt = dateFilter;
        if (search) {
            orderFilters.$or = [
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(orderFilters)
            .populate('buyer.user', 'name email phone')
            .populate('buyer.lab', 'labName address contactPerson')
            .populate('seller.user', 'name email phone')
            .populate('seller.lab', 'labName address contactPerson')
            .populate('items.product', 'name images')
            .sort(sort)
            .skip(type === 'order' ? skip : 0)
            .limit(type === 'order' ? limitNum : 1000);

        const orderCount = await Order.countDocuments(orderFilters);

        // Transform orders to unified format
        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            type: 'purchase',
            buyer: order.buyer,
            seller: order.seller,
            items: order.items,
            totalAmount: order.totalAmount,
            currency: order.currency || 'SAR',
            status: order.status,
            shipping: order.shipping,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            shippingAddress: order.shippingAddress,
            payment: order.payment
        }));

        if (type === 'order') {
            confirmedOrders = transformedOrders;
            totalCount = orderCount;
        } else {
            confirmedOrders.push(...transformedOrders);
            totalCount += orderCount;
        }
    }

    // Get confirmed exchanges (accepted and above)
    if (type !== 'order') {
        const exchangeFilters = {
            status: { $in: ['accepted', 'confirmed', 'in_progress', 'completed'] }
        };

        if (status) exchangeFilters.status = status;
        if (dateFilter.$gte || dateFilter.$lte) exchangeFilters.createdAt = dateFilter;
        if (search) {
            exchangeFilters.$or = [
                { exchangeNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const exchanges = await Exchange.find(exchangeFilters)
            .populate('requester.user', 'name email phone')
            .populate('requester.lab', 'labName address contactPerson')
            .populate('receiver.user', 'name email phone')
            .populate('receiver.lab', 'labName address contactPerson')
            .populate('requesterProduct.product', 'name images')
            .populate('receiverProduct.product', 'name images')
            .sort(sort)
            .skip(type === 'exchange' ? skip : 0)
            .limit(type === 'exchange' ? limitNum : 1000);

        const exchangeCount = await Exchange.countDocuments(exchangeFilters);

        // Transform exchanges to unified format
        const transformedExchanges = exchanges.map(exchange => ({
            _id: exchange._id,
            orderNumber: exchange.exchangeNumber,
            type: 'exchange',
            buyer: exchange.requester,
            seller: exchange.receiver,
            items: [
                {
                    product: exchange.requesterProduct.product,
                    quantity: exchange.requesterProduct.quantity,
                    name: exchange.requesterProduct.product?.name || 'منتج التبادل',
                    total: 0 // No price for exchanges
                },
                {
                    product: exchange.receiverProduct.product,
                    quantity: exchange.receiverProduct.quantity,
                    name: exchange.receiverProduct.product?.name || 'منتج التبادل',
                    total: 0
                }
            ],
            exchangeProducts: {
                requester: {
                    product: exchange.requesterProduct.product,
                    quantity: exchange.requesterProduct.quantity,
                    lab: exchange.requester?.lab
                },
                receiver: {
                    product: exchange.receiverProduct.product,
                    quantity: exchange.receiverProduct.quantity,
                    lab: exchange.receiver?.lab
                }
            },
            totalAmount: 0, // No monetary value for exchanges
            currency: 'SAR',
            status: exchange.status,
            shipping: exchange.shipping,
            createdAt: exchange.createdAt,
            updatedAt: exchange.updatedAt,
            isExchange: true
        }));

        if (type === 'exchange') {
            confirmedOrders = transformedExchanges;
            totalCount = exchangeCount;
        } else {
            confirmedOrders.push(...transformedExchanges);
            totalCount += exchangeCount;
        }
    }

    // Include accepted exchange requests (mainly custom_offer) so admin can see them
    if (type !== 'order') {
        // Only include accepted custom_offer requests that don't have an exchange yet
        const requestFilters = { status: 'accepted', offerType: 'custom_offer', exchangeId: { $in: [null, undefined] } };

        if (dateFilter.$gte || dateFilter.$lte) requestFilters.createdAt = dateFilter;
        if (search) {
            requestFilters.$or = [
                { requestNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const acceptedRequests = await ExchangeRequest.find(requestFilters)
            .populate({
                path: 'requesterLab',
                select: 'labName address contactPerson user',
                populate: { path: 'user', select: 'name email phone' }
            })
            .populate({
                path: 'targetProduct.product',
                select: 'name images condition brand model'
            })
            .populate({
                path: 'targetProduct.ownerLab',
                select: 'labName address contactPerson user',
                populate: { path: 'user', select: 'name email phone' }
            })
            .populate({
                path: 'offeredProduct.product',
                select: 'name images condition brand model'
            })
            .sort(sort)
            .skip(type === 'exchange' ? 0 : 0) // handled in combined pagination below
            .limit(1000);

        const requestsCount = await ExchangeRequest.countDocuments(requestFilters);

        const transformedRequests = acceptedRequests.map(req => ({
            _id: req._id,
            orderNumber: req.requestNumber,
            type: 'exchange',
            buyer: {
                lab: req.requesterLab,
                user: req.requesterLab?.user || null
            },
            seller: {
                lab: req.targetProduct?.ownerLab,
                user: req.targetProduct?.ownerLab?.user || null
            },
            items: [
                req.offeredProduct?.product ? {
                    product: req.offeredProduct.product,
                    quantity: req.offeredProduct.quantity || 1,
                    name: req.offeredProduct.product?.name || 'عرض مقدم',
                    total: 0
                } : null,
                req.targetProduct?.product ? {
                    product: req.targetProduct.product,
                    quantity: req.targetProduct.requestedQuantity || 1,
                    name: req.targetProduct.product?.name || 'منتج مطلوب',
                    total: 0
                } : null
            ].filter(Boolean),
            totalAmount: 0,
            currency: 'SAR',
            status: 'accepted',
            shipping: null,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            isExchangeRequest: true,
            extra: {
                source: 'exchange_request',
                offerType: req.offerType,
                requestedQuantity: req?.targetProduct?.requestedQuantity || null,
                offeredQuantity: req?.offeredProduct?.quantity || null,
                customOffer: req.offerType === 'custom_offer' ? req.customOffer : null,
                respondedAt: req.respondedAt,
                expiresAt: req.expiresAt
            }
        }));

        // Only push into combined results. (We paginate combined list below)
        confirmedOrders.push(...transformedRequests);
        totalCount += requestsCount;
    }

    // If getting all types, sort and paginate the combined results
    if (type !== 'order' && type !== 'exchange') {
        // Sort combined results
        confirmedOrders.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            
            if (sortOrder === 'desc') {
                return new Date(bValue) - new Date(aValue);
            } else {
                return new Date(aValue) - new Date(bValue);
            }
        });

        // Apply pagination to combined results
        confirmedOrders = confirmedOrders.slice(skip, skip + limitNum);
    }

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(totalCount, parseInt(page), limitNum);

    // Get statistics
    const statistics = {
        totalConfirmed: totalCount,
        byType: {
            orders: await Order.countDocuments({ status: { $nin: ['pending'] } }),
            exchanges: await Exchange.countDocuments({ status: { $in: ['accepted', 'confirmed', 'in_progress', 'completed'] } })
        },
        byStatus: {
            confirmed: await Order.countDocuments({ status: 'confirmed' }) + await Exchange.countDocuments({ status: 'accepted' }) + await ExchangeRequest.countDocuments({ status: 'accepted' }),
            processing: await Order.countDocuments({ status: 'processing' }) + await Exchange.countDocuments({ status: 'confirmed' }),
            shipped: await Order.countDocuments({ status: 'shipped' }) + await Exchange.countDocuments({ status: 'in_progress' }),
            delivered: await Order.countDocuments({ status: 'delivered' }),
            completed: await Order.countDocuments({ status: 'completed' }) + await Exchange.countDocuments({ status: 'completed' })
        }
    };

    sendSuccess(res, 'تم جلب الطلبات المؤكدة بنجاح', {
        orders: confirmedOrders,
        pagination,
        statistics
    });
});

// @desc    Update order shipping information
// @route   PUT /api/v1/admin/orders/:id/shipping
// @access  Private/Admin
exports.updateOrderShipping = asyncHandler(async (req, res) => {
    const { carrier, trackingNumber, estimatedDelivery, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
        return sendError(res, 'الطلب غير موجود', 404);
    }

    // Update shipping information
    if (carrier) order.shipping.carrier = carrier;
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.shipping.estimatedDelivery = new Date(estimatedDelivery);

    // Update status to shipped if not already
    if (order.status === 'confirmed' || order.status === 'processing') {
        order.status = 'shipped';
    }

    // Add to status history
    order.statusHistory.push({
        status: order.status,
        note: notes || `تم تحديث معلومات الشحن - شركة الشحن: ${carrier || 'غير محدد'}`,
        updatedBy: req.user.id,
        updatedAt: new Date()
    });

    await order.save();

    sendUpdated(res, 'تم تحديث معلومات الشحن بنجاح', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        shipping: order.shipping
    });
});

// @desc    Update exchange delivery information
// @route   PUT /api/v1/admin/exchanges/:id/delivery
// @access  Private/Admin
exports.updateExchangeDelivery = asyncHandler(async (req, res) => {
    const { 
        requesterCarrier, 
        requesterTrackingNumber,
        receiverCarrier, 
        receiverTrackingNumber,
        estimatedDelivery,
        notes,
        applyToBoth = true,
        target = 'both', // 'both' | 'requester' | 'receiver'
        overwrite = false
    } = req.body;

    const exchange = await Exchange.findById(req.params.id);
    if (!exchange) {
        return sendError(res, 'التبادل غير موجود', 404);
    }

    // Update top-level estimated delivery if provided
    if (estimatedDelivery) {
        if (!exchange.shipping) exchange.shipping = {};
        exchange.shipping.estimatedDelivery = new Date(estimatedDelivery);
    }

    const shouldUpdateRequester = applyToBoth || target === 'requester' || target === 'both';
    const shouldUpdateReceiver = applyToBoth || target === 'receiver' || target === 'both';

    // Update requester shipping info (respect overwrite flag)
    if (shouldUpdateRequester) {
        if (requesterCarrier && (overwrite || !exchange.shipping.requesterShipping.carrier)) {
            exchange.shipping.requesterShipping.carrier = requesterCarrier;
        }
        if (requesterTrackingNumber && (overwrite || !exchange.shipping.requesterShipping.trackingNumber)) {
            exchange.shipping.requesterShipping.trackingNumber = requesterTrackingNumber;
            exchange.shipping.requesterShipping.shippedAt = new Date();
        }
        if (estimatedDelivery) {
            exchange.shipping.requesterShipping.estimatedDelivery = new Date(estimatedDelivery);
        }
    }

    // Update receiver shipping info
    if (shouldUpdateReceiver) {
        if (receiverCarrier && (overwrite || !exchange.shipping.receiverShipping.carrier)) {
            exchange.shipping.receiverShipping.carrier = receiverCarrier;
        }
        if (receiverTrackingNumber && (overwrite || !exchange.shipping.receiverShipping.trackingNumber)) {
            exchange.shipping.receiverShipping.trackingNumber = receiverTrackingNumber;
            exchange.shipping.receiverShipping.shippedAt = new Date();
        }
        if (estimatedDelivery) {
            exchange.shipping.receiverShipping.estimatedDelivery = new Date(estimatedDelivery);
        }
    }

    // Update exchange status
    if (exchange.status === 'accepted' || exchange.status === 'confirmed') {
        exchange.status = 'in_progress';
    }

    // Add to status history
    exchange.statusHistory.push({
        status: exchange.status,
        note: notes || 'تم تحديث معلومات التسليم',
        updatedBy: req.user.id,
        updatedAt: new Date()
    });

    await exchange.save();

    sendUpdated(res, 'تم تحديث معلومات التسليم بنجاح', {
        exchangeId: exchange._id,
        exchangeNumber: exchange.exchangeNumber,
        status: exchange.status,
        shipping: exchange.shipping
    });
});

// @desc    Update shipping for an accepted ExchangeRequest (create Exchange if missing)
// @route   PUT /api/v1/admin/exchange-requests/:id/shipping
// @access  Private/Admin
exports.updateAcceptedExchangeRequestShipping = asyncHandler(async (req, res) => {
    const { carrier, trackingNumber, estimatedDelivery, notes } = req.body;

    const request = await ExchangeRequest.findById(req.params.id)
        .populate({ path: 'requesterLab', select: 'user labName', populate: { path: 'user', select: 'name email phone' } })
        .populate({ path: 'targetProduct.ownerLab', select: 'user labName', populate: { path: 'user', select: 'name email phone' } })
        .populate('offeredProduct.product')
        .populate('targetProduct.product');

    if (!request) {
        return sendError(res, 'طلب التبادل غير موجود', 404);
    }

    if (request.status !== 'accepted') {
        return sendError(res, 'لا يمكن تحديث الشحن إلا لطلبات التبادل المقبولة', 400);
    }

    let exchange;
    if (request.exchangeId) {
        // Use existing exchange (don't create another)
        exchange = await Exchange.findById(request.exchangeId);
    } else {
        // Only auto-create exchange for accepted custom offers
        if (request.offerType !== 'custom_offer') {
            return sendError(res, 'لا يمكن إنشاء تبادل تلقائياً لهذا النوع من الطلبات', 400);
        }

        // Generate exchange number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const exchangeNumber = `EXC-${year}${month}${day}-${random}`;

        // Create exchange based on the accepted request (single instance)
        exchange = await Exchange.create({
            exchangeNumber,
            requester: {
                user: request.requesterLab.user,
                lab: request.requesterLab._id
            },
            receiver: {
                user: request.targetProduct.ownerLab.user,
                lab: request.targetProduct.ownerLab._id
            },
            requesterProduct: request.offeredProduct?.product ? {
                product: request.offeredProduct.product._id,
                quantity: request.offeredProduct.quantity || 1
            } : {
                product: request.targetProduct.product._id,
                quantity: request.customOffer?.quantity || 1
            },
            receiverProduct: {
                product: request.targetProduct.product._id,
                quantity: request.targetProduct.requestedQuantity || 1
            },
            status: 'accepted'
        });

        // Link once
        request.exchangeId = exchange._id;
        await request.save();
    }

    // Update shipping info
    if (!exchange.shipping) {
        exchange.shipping = {};
    }
    if (!exchange.shipping.requesterShipping) exchange.shipping.requesterShipping = {};
    if (!exchange.shipping.receiverShipping) exchange.shipping.receiverShipping = {};

    if (carrier) {
        exchange.shipping.requesterShipping.carrier = carrier;
        exchange.shipping.receiverShipping.carrier = carrier;
    }
    if (trackingNumber) {
        const now = new Date();
        exchange.shipping.requesterShipping.trackingNumber = trackingNumber;
        exchange.shipping.receiverShipping.trackingNumber = trackingNumber;
        exchange.shipping.requesterShipping.shippedAt = now;
        exchange.shipping.receiverShipping.shippedAt = now;
    }
    if (estimatedDelivery) {
        const eta = new Date(estimatedDelivery);
        // Save estimated delivery at the main shipping level for exchanges
        if (!exchange.shipping) exchange.shipping = {};
        exchange.shipping.estimatedDelivery = eta;
    }

    if (exchange.status === 'accepted' || exchange.status === 'confirmed') {
        exchange.status = 'in_progress';
    }

    exchange.statusHistory.push({
        status: exchange.status,
        note: notes || 'تم تحديث معلومات الشحن بناءً على طلب تبادل مقبول',
        updatedBy: req.user.id,
        updatedAt: new Date()
    });

    await exchange.save();

    sendUpdated(res, 'تم تحديث شحن طلب التبادل المقبول بنجاح', {
        exchangeId: exchange._id,
        exchangeNumber: exchange.exchangeNumber,
        status: exchange.status,
        shipping: exchange.shipping
    });
});