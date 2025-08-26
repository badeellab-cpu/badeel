const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Wallet = require('../models/Wallet');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ExchangeRequest = require('../models/ExchangeRequest');
const Exchange = require('../models/Exchange');
const emailService = require('../utils/email');
const { sendSuccess, sendError, sendCreated, sendUpdated } = require('../utils/apiResponse');
const { buildPagination, calculatePaginationMeta, parseQueryFilters } = require('../utils/helpers');

// @desc    Get all labs (Admin only)
// @route   GET /api/v1/labs
// @access  Private/Admin
exports.getAllLabs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filters
    const filters = parseQueryFilters(req.query);
    
    if (status) {
        // Filter by user status (pending, approved, rejected, suspended)
        const userIds = await User.find({ status }).distinct('_id');
        filters.user = { $in: userIds };
    }

    if (search) {
        filters.$or = [
            { labName: { $regex: search, $options: 'i' } },
            { registrationNumber: { $regex: search, $options: 'i' } },
            { licenseNumber: { $regex: search, $options: 'i' } },
            { 'address.city': { $regex: search, $options: 'i' } }
        ];
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get labs with user data
    const labs = await Lab.find(filters)
        .populate({
            path: 'user',
            select: 'name email phone role status isEmailVerified lastLogin createdAt'
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Attach wallet balances
    try {
        const labIds = labs.map(l => l._id);
        const wallets = await Wallet.find({ lab: { $in: labIds } }).select('lab balance');
        const labIdToBalance = new Map(wallets.map(w => [w.lab.toString(), w.balance]));
        labs.forEach(l => {
            l = l.toObject ? Object.assign(l, {}) : l; // ensure plain object when needed
            l.walletBalance = labIdToBalance.get(l._id.toString()) || 0;
        });
    } catch (e) {
        // If wallet fetch fails, continue without blocking
        console.error('Failed to attach wallet balances:', e.message);
    }

    // Get total count for pagination
    const total = await Lab.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب المختبرات بنجاح', {
        labs,
        pagination
    });
});

// @desc    Get pending labs (Admin only)
// @route   GET /api/v1/labs/pending
// @access  Private/Admin
exports.getPendingLabs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Get pending user IDs
    const pendingUsers = await User.find({ status: 'pending', role: 'lab' }).distinct('_id');

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Get pending labs
    const labs = await Lab.find({ user: { $in: pendingUsers } })
        .populate({
            path: 'user',
            select: 'name email phone createdAt'
        })
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

    // Get total count
    const total = await Lab.countDocuments({ user: { $in: pendingUsers } });

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب المختبرات المعلقة بنجاح', {
        labs,
        pagination
    });
});

// @desc    Get single lab
// @route   GET /api/v1/labs/:id
// @access  Private/Admin or Lab Owner
exports.getLab = asyncHandler(async (req, res) => {
    const lab = await Lab.findById(req.params.id).populate({
        path: 'user',
        select: 'name email phone role status isEmailVerified lastLogin createdAt updatedAt'
    });

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    // Check if user is admin or lab owner
    if (req.user.role !== 'admin' && lab.user._id.toString() !== req.user.id) {
        return sendError(res, 'غير مصرح لك بالوصول إلى هذا المختبر', 403);
    }

    sendSuccess(res, 'تم جلب بيانات المختبر بنجاح', lab);
});

// @desc    Approve lab (Admin only)
// @route   PUT /api/v1/labs/:id/approve
// @access  Private/Admin
exports.approveLab = asyncHandler(async (req, res) => {
    const lab = await Lab.findById(req.params.id).populate('user');

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    if (lab.user.status === 'approved') {
        return sendError(res, 'المختبر معتمد بالفعل', 400);
    }

    // Update user status
    await User.findByIdAndUpdate(lab.user._id, {
        status: 'approved',
        rejectionReason: null
    });

    // Update lab verification
    lab.isVerified = true;
    lab.verifiedAt = new Date();
    await lab.save();

    // Send approval email
    try {
        await emailService.sendLabApprovedEmail(lab);
    } catch (error) {
        console.error('Failed to send approval email:', error);
    }

    sendSuccess(res, 'تم اعتماد المختبر بنجاح', {
        lab: {
            id: lab._id,
            labName: lab.labName,
            status: 'approved',
            verifiedAt: lab.verifiedAt
        }
    });
});

// @desc    Reject lab (Admin only)
// @route   PUT /api/v1/labs/:id/reject
// @access  Private/Admin
exports.rejectLab = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
        return sendError(res, 'يرجى إدخال سبب الرفض (على الأقل 10 أحرف)', 400);
    }

    const lab = await Lab.findById(req.params.id).populate('user');

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    if (lab.user.status === 'rejected') {
        return sendError(res, 'المختبر مرفوض بالفعل', 400);
    }

    // Update user status
    await User.findByIdAndUpdate(lab.user._id, {
        status: 'rejected',
        rejectionReason: reason.trim()
    });

    // Add rejection note to lab
    lab.notes.push({
        note: `تم رفض المختبر - السبب: ${reason}`,
        addedBy: req.user.id,
        addedAt: new Date()
    });
    await lab.save();

    // Send rejection email
    try {
        await emailService.sendLabRejectedEmail(lab, reason);
    } catch (error) {
        console.error('Failed to send rejection email:', error);
    }

    sendSuccess(res, 'تم رفض المختبر', {
        lab: {
            id: lab._id,
            labName: lab.labName,
            status: 'rejected',
            rejectionReason: reason
        }
    });
});

// @desc    Suspend lab (Admin only)
// @route   PUT /api/v1/labs/:id/suspend
// @access  Private/Admin
exports.suspendLab = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
        return sendError(res, 'يرجى إدخال سبب التعليق (على الأقل 10 أحرف)', 400);
    }

    const lab = await Lab.findById(req.params.id).populate('user');

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    if (lab.user.status === 'suspended') {
        return sendError(res, 'المختبر معلق بالفعل', 400);
    }

    // Update user status
    await User.findByIdAndUpdate(lab.user._id, {
        status: 'suspended'
    });

    // Add suspension note to lab
    lab.notes.push({
        note: `تم تعليق المختبر - السبب: ${reason}`,
        addedBy: req.user.id,
        addedAt: new Date()
    });
    await lab.save();

    sendSuccess(res, 'تم تعليق المختبر', {
        lab: {
            id: lab._id,
            labName: lab.labName,
            status: 'suspended',
            reason: reason
        }
    });
});

// @desc    Activate lab (Admin only)
// @route   PUT /api/v1/labs/:id/activate
// @access  Private/Admin
exports.activateLab = asyncHandler(async (req, res) => {
    const lab = await Lab.findById(req.params.id).populate('user');

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    if (lab.user.status === 'approved') {
        return sendError(res, 'المختبر نشط بالفعل', 400);
    }

    // Update user status
    await User.findByIdAndUpdate(lab.user._id, {
        status: 'approved'
    });

    // Add activation note to lab
    lab.notes.push({
        note: 'تم تفعيل المختبر',
        addedBy: req.user.id,
        addedAt: new Date()
    });
    await lab.save();

    sendSuccess(res, 'تم تفعيل المختبر', {
        lab: {
            id: lab._id,
            labName: lab.labName,
            status: 'approved'
        }
    });
});

// @desc    Update lab profile (Lab Owner only)
// @route   PUT /api/v1/labs/:id
// @access  Private/Lab Owner
exports.updateLab = asyncHandler(async (req, res) => {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    // Check if user owns this lab
    if (lab.user.toString() !== req.user.id) {
        return sendError(res, 'غير مصرح لك بتعديل هذا المختبر', 403);
    }

    // Fields that can be updated by lab owner
    const allowedFields = [
        'description',
        'workingHours',
        'contactPerson',
        'socialMedia',
        'bankAccount',
        'preferences'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = req.body[key];
        }
    });

    // Validate bank account IBAN if provided
    if (updateData.bankAccount && updateData.bankAccount.iban) {
        const ibanRegex = /^SA\d{22}$/;
        if (!ibanRegex.test(updateData.bankAccount.iban.replace(/\s/g, ''))) {
            return sendError(res, 'رقم IBAN غير صحيح', 400);
        }
    }

    const updatedLab = await Lab.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate({
        path: 'user',
        select: 'name email phone'
    });

    sendUpdated(res, 'تم تحديث بيانات المختبر بنجاح', updatedLab);
});

// @desc    Get lab statistics (Admin or Lab Owner)
// @route   GET /api/v1/labs/:id/statistics
// @access  Private/Admin or Lab Owner
exports.getLabStatistics = asyncHandler(async (req, res) => {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    // Check permissions
    if (req.user.role !== 'admin' && lab.user.toString() !== req.user.id) {
        return sendError(res, 'غير مصرح لك بالوصول إلى هذه الإحصائيات', 403);
    }

    // Get statistics from various models
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Exchange = require('../models/Exchange');
    const Wallet = require('../models/Wallet');

    const [
        totalProducts,
        activeProducts,
        totalOrders,
        completedOrders,
        totalExchanges,
        completedExchanges,
        wallet
    ] = await Promise.all([
        Product.countDocuments({ lab: lab._id }),
        Product.countDocuments({ lab: lab._id, status: 'active' }),
        Order.countDocuments({
            $or: [
                { 'buyer.lab': lab._id },
                { 'seller.lab': lab._id }
            ]
        }),
        Order.countDocuments({
            $or: [
                { 'buyer.lab': lab._id },
                { 'seller.lab': lab._id }
            ],
            status: 'completed'
        }),
        Exchange.countDocuments({
            $or: [
                { 'requester.lab': lab._id },
                { 'receiver.lab': lab._id }
            ]
        }),
        Exchange.countDocuments({
            $or: [
                { 'requester.lab': lab._id },
                { 'receiver.lab': lab._id }
            ],
            status: 'completed'
        }),
        Wallet.findOne({ lab: lab._id })
    ]);

    const statistics = {
        products: {
            total: totalProducts,
            active: activeProducts,
            inactive: totalProducts - activeProducts
        },
        orders: {
            total: totalOrders,
            completed: completedOrders,
            pending: totalOrders - completedOrders
        },
        exchanges: {
            total: totalExchanges,
            completed: completedExchanges,
            pending: totalExchanges - completedExchanges
        },
        wallet: {
            balance: wallet?.balance || 0,
            currency: wallet?.currency || 'SAR'
        }
    };

    sendSuccess(res, 'تم جلب الإحصائيات بنجاح', statistics);
});

// @desc    Add note to lab (Admin only)
// @route   POST /api/v1/labs/:id/notes
// @access  Private/Admin
exports.addLabNote = asyncHandler(async (req, res) => {
    const { note } = req.body;

    if (!note || note.trim().length < 5) {
        return sendError(res, 'يرجى إدخال ملاحظة صحيحة (على الأقل 5 أحرف)', 400);
    }

    const lab = await Lab.findById(req.params.id);

    if (!lab) {
        return sendError(res, 'المختبر غير موجود', 404);
    }

    lab.notes.push({
        note: note.trim(),
        addedBy: req.user.id,
        addedAt: new Date()
    });

    await lab.save();

    sendSuccess(res, 'تم إضافة الملاحظة بنجاح', {
        note: lab.notes[lab.notes.length - 1]
    });
});

// @desc    Get lab dashboard stats (Lab Owner only)
// @route   GET /api/v1/labs/my-dashboard
// @access  Private/Lab
exports.getMyDashboard = asyncHandler(async (req, res) => {
    // Get lab for current user
    const lab = await Lab.findOne({ user: req.user.id });

    if (!lab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Redirect to lab statistics
    req.params.id = lab._id;
    return exports.getLabStatistics(req, res);
});

// @desc    Get lab dashboard data
// @route   GET /api/v1/labs/my-dashboard
// @access  Private/Lab
exports.getMyDashboard = asyncHandler(async (req, res) => {
    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    const lab = await Lab.findOne({ user: req.user._id });
    if (!lab) {
        res.status(404);
        throw new Error('المختبر غير موجود');
    }

    // Get wallet balance
    const wallet = await Wallet.findOne({ lab: lab._id });
    const walletBalance = wallet ? wallet.balance : 0;

    // Get products stats
    const totalProducts = await Product.countDocuments({ lab: lab._id });
    const activeProducts = await Product.countDocuments({ lab: lab._id, status: 'active' });
    const pendingProducts = await Product.countDocuments({ lab: lab._id, status: 'pending' });

    // Get products by type
    const saleProducts = await Product.countDocuments({ lab: lab._id, type: 'sale' });
    const exchangeProducts = await Product.countDocuments({ lab: lab._id, type: 'exchange' });
    const assetProducts = await Product.countDocuments({ lab: lab._id, type: 'asset' });

    // Get orders where this lab is the seller
    const totalOrders = await Order.countDocuments({ 'seller.lab': lab._id });
    const pendingOrders = await Order.countDocuments({ 'seller.lab': lab._id, status: 'pending' });
    const completedOrders = await Order.countDocuments({ 'seller.lab': lab._id, status: 'completed' });
    const processingOrders = await Order.countDocuments({ 'seller.lab': lab._id, status: 'processing' });

    // Get exchange requests (both sent and received)
    const totalExchangeRequests = await ExchangeRequest.countDocuments({
        $or: [
            { requesterLab: lab._id },
            { 'targetProduct.ownerLab': lab._id }
        ]
    });

    const pendingExchangeRequests = await ExchangeRequest.countDocuments({
        $or: [
            { requesterLab: lab._id },
            { 'targetProduct.ownerLab': lab._id }
        ],
        status: { $in: ['pending', 'viewed'] }
    });

    const acceptedExchangeRequests = await ExchangeRequest.countDocuments({
        $or: [
            { requesterLab: lab._id },
            { 'targetProduct.ownerLab': lab._id }
        ],
        status: 'accepted'
    });



    // Get actual exchanges
    const totalExchanges = await Exchange.countDocuments({
        $or: [
            { 'requester.lab': lab._id },
            { 'receiver.lab': lab._id }
        ]
    });

    // Get recent orders
    const recentOrders = await Order.find({ 'seller.lab': lab._id })
        .populate('buyer.lab', 'labName')
        .sort('-createdAt')
        .limit(5)
        .select('orderNumber status createdAt totalAmount');

    // Get recent exchange requests
    const recentExchangeRequests = await ExchangeRequest.find({
        $or: [
            { requesterLab: lab._id },
            { 'targetProduct.ownerLab': lab._id }
        ]
    })
        .populate('requesterLab', 'labName')
        .populate('targetProduct.ownerLab', 'labName')
        .sort('-createdAt')
        .limit(5)
        .select('requestNumber status createdAt offerType');

    // Calculate monthly revenue (from completed orders)
    const monthlyRevenue = await Order.aggregate([
        {
            $match: {
                'seller.lab': lab._id,
                status: 'completed',
                createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' }
            }
        }
    ]);

    const dashboardData = {
        overview: {
            walletBalance,
            totalProducts,
            totalOrders,
            totalExchangeRequests,
            totalExchanges,
            monthlyRevenue: monthlyRevenue[0]?.total || 0,
            pendingOrders,
            activeProducts,
            pendingProducts
        },
        breakdown: {
            productsByType: {
                sale: saleProducts,
                exchange: exchangeProducts,
                asset: assetProducts
            },
            productsByStatus: {
                active: activeProducts,
                pending: pendingProducts,
                inactive: totalProducts - activeProducts - pendingProducts
            },
            ordersByStatus: {
                pending: pendingOrders,
                processing: processingOrders,
                completed: completedOrders,
                cancelled: totalOrders - pendingOrders - processingOrders - completedOrders
            },
            exchangeRequestsByStatus: {
                pending: pendingExchangeRequests,
                accepted: acceptedExchangeRequests,
                rejected: totalExchangeRequests - pendingExchangeRequests - acceptedExchangeRequests
            }
        },
        recentActivities: {
            orders: recentOrders,
            exchangeRequests: recentExchangeRequests
        },
        labInfo: {
            name: lab.labName,
            registrationNumber: lab.registrationNumber,
            city: lab.address?.city,
            totalRating: lab.statistics?.averageRating || 0,
            totalReviews: lab.statistics?.totalReviews || 0
        }
    };

    sendSuccess(res, 'تم جلب بيانات لوحة التحكم بنجاح', dashboardData);
});