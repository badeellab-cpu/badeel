const asyncHandler = require('express-async-handler');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Lab = require('../models/Lab');
const { sendSuccess, sendError, sendCreated, sendUpdated } = require('../utils/apiResponse');
const { buildPagination, calculatePaginationMeta, parseQueryFilters, generateRandomString } = require('../utils/helpers');

// @desc    Get wallet information
// @route   GET /api/v1/wallets/my-wallet
// @access  Private/Lab
exports.getMyWallet = asyncHandler(async (req, res) => {
    // Get user's lab
    const lab = await Lab.findOne({ user: req.user.id });
    if (!lab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ lab: lab._id });
    if (!wallet) {
        wallet = await Wallet.create({
            lab: lab._id,
            user: req.user.id,
            balance: 0,
            currency: 'SAR'
        });
    }

    // Get recent transactions
    const recentTransactions = await Transaction.find({
        $or: [
            { 'from.lab': lab._id },
            { 'to.lab': lab._id }
        ]
    })
    .sort('-createdAt')
    .limit(5)
    .select('type amount currency status description createdAt from to');

    const walletData = {
        ...wallet.toObject(),
        recentTransactions
    };

    sendSuccess(res, 'تم جلب معلومات المحفظة بنجاح', walletData);
});

// @desc    Get all wallets (Admin only)
// @route   GET /api/v1/wallets
// @access  Private/Admin
exports.getAllWallets = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'balance',
        sortOrder = 'desc',
        minBalance,
        maxBalance,
        currency = 'SAR'
    } = req.query;

    // Build filters
    const filters = { currency };

    // Balance range filter
    if (minBalance || maxBalance) {
        filters.balance = {};
        if (minBalance) filters.balance.$gte = parseFloat(minBalance);
        if (maxBalance) filters.balance.$lte = parseFloat(maxBalance);
    }

    // Search functionality
    if (search) {
        const labs = await Lab.find({
            labName: { $regex: search, $options: 'i' }
        }).distinct('_id');
        filters.lab = { $in: labs };
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const wallets = await Wallet.find(filters)
        .populate('lab', 'labName address contactPerson')
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Get total count for pagination
    const total = await Wallet.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب المحافظ بنجاح', {
        wallets,
        pagination
    });
});

// @desc    Get wallet by ID (Admin only)
// @route   GET /api/v1/wallets/:id
// @access  Private/Admin
exports.getWallet = asyncHandler(async (req, res) => {
    const wallet = await Wallet.findById(req.params.id)
        .populate('lab', 'labName address contactPerson')
        .populate('user', 'name email phone');

    if (!wallet) {
        return sendError(res, 'المحفظة غير موجودة', 404);
    }

    // Get wallet transactions
    const transactions = await Transaction.find({
        $or: [
            { 'from.lab': wallet.lab._id },
            { 'to.lab': wallet.lab._id }
        ]
    })
    .sort('-createdAt')
    .limit(20)
    .populate('from.lab', 'labName')
    .populate('to.lab', 'labName');

    const walletData = {
        ...wallet.toObject(),
        transactions
    };

    sendSuccess(res, 'تم جلب المحفظة بنجاح', walletData);
});

// @desc    Add funds to wallet (Admin only)
// @route   POST /api/v1/wallets/:id/add-funds
// @access  Private/Admin
exports.addFunds = asyncHandler(async (req, res) => {
    const { amount, description, reference } = req.body;

    if (!amount || amount <= 0) {
        return sendError(res, 'المبلغ يجب أن يكون أكبر من صفر', 400);
    }

    const wallet = await Wallet.findById(req.params.id).populate('lab user');
    if (!wallet) {
        return sendError(res, 'المحفظة غير موجودة', 404);
    }

    // Create transaction record
    const transaction = await Transaction.create({
        type: 'deposit',
        amount: parseFloat(amount),
        currency: wallet.currency,
        from: {
            type: 'admin',
            user: req.user.id
        },
        to: {
            type: 'lab',
            lab: wallet.lab._id,
            user: wallet.user._id
        },
        reference: reference ? {
            type: 'admin_deposit',
            id: reference
        } : undefined,
        status: 'completed',
        description: description || `إيداع أموال في المحفظة`,
        metadata: {
            addedBy: req.user.id,
            addedAt: new Date()
        }
    });

    // Update wallet balance
    wallet.balance += parseFloat(amount);
    wallet.lastUpdated = new Date();
    wallet.transactions.push(transaction._id);
    await wallet.save();

    sendSuccess(res, 'تم إضافة الأموال بنجاح', {
        walletId: wallet._id,
        newBalance: wallet.balance,
        addedAmount: parseFloat(amount),
        transactionId: transaction._id
    });
});

// @desc    Deduct funds from wallet (Admin only)
// @route   POST /api/v1/wallets/:id/deduct-funds
// @access  Private/Admin
exports.deductFunds = asyncHandler(async (req, res) => {
    const { amount, description, reason } = req.body;

    if (!amount || amount <= 0) {
        return sendError(res, 'المبلغ يجب أن يكون أكبر من صفر', 400);
    }

    if (!reason) {
        return sendError(res, 'سبب الخصم مطلوب', 400);
    }

    const wallet = await Wallet.findById(req.params.id).populate('lab user');
    if (!wallet) {
        return sendError(res, 'المحفظة غير موجودة', 404);
    }

    if (wallet.balance < amount) {
        return sendError(res, 'الرصيد غير كافي', 400);
    }

    // Create transaction record
    const transaction = await Transaction.create({
        type: 'withdrawal',
        amount: parseFloat(amount),
        currency: wallet.currency,
        from: {
            type: 'lab',
            lab: wallet.lab._id,
            user: wallet.user._id
        },
        to: {
            type: 'admin',
            user: req.user.id
        },
        status: 'completed',
        description: description || `خصم من المحفظة - ${reason}`,
        metadata: {
            reason,
            deductedBy: req.user.id,
            deductedAt: new Date()
        }
    });

    // Update wallet balance
    wallet.balance -= parseFloat(amount);
    wallet.lastUpdated = new Date();
    wallet.transactions.push(transaction._id);
    await wallet.save();

    sendSuccess(res, 'تم خصم الأموال بنجاح', {
        walletId: wallet._id,
        newBalance: wallet.balance,
        deductedAmount: parseFloat(amount),
        reason,
        transactionId: transaction._id
    });
});

// @desc    Transfer funds between wallets
// @route   POST /api/v1/wallets/transfer
// @access  Private/Lab
exports.transferFunds = asyncHandler(async (req, res) => {
    const { toLabId, amount, description } = req.body;

    if (!amount || amount <= 0) {
        return sendError(res, 'المبلغ يجب أن يكون أكبر من صفر', 400);
    }

    // Get sender's lab
    const senderLab = await Lab.findOne({ user: req.user.id });
    if (!senderLab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Get receiver lab
    const receiverLab = await Lab.findById(toLabId).populate('user');
    if (!receiverLab) {
        return sendError(res, 'المختبر المستقبل غير موجود', 404);
    }

    if (senderLab._id.toString() === receiverLab._id.toString()) {
        return sendError(res, 'لا يمكن التحويل لنفس المختبر', 400);
    }

    // Get wallets
    const [senderWallet, receiverWallet] = await Promise.all([
        Wallet.findOne({ lab: senderLab._id }),
        Wallet.findOne({ lab: receiverLab._id })
    ]);

    if (!senderWallet) {
        return sendError(res, 'محفظتك غير موجودة', 404);
    }

    if (senderWallet.balance < amount) {
        return sendError(res, 'الرصيد غير كافي', 400);
    }

    // Create or find receiver wallet
    let receiverWalletDoc = receiverWallet;
    if (!receiverWalletDoc) {
        receiverWalletDoc = await Wallet.create({
            lab: receiverLab._id,
            user: receiverLab.user._id,
            balance: 0,
            currency: 'SAR'
        });
    }

    // Create transaction record
    const transaction = await Transaction.create({
        type: 'transfer',
        amount: parseFloat(amount),
        currency: 'SAR',
        from: {
            type: 'lab',
            lab: senderLab._id,
            user: req.user.id
        },
        to: {
            type: 'lab',
            lab: receiverLab._id,
            user: receiverLab.user._id
        },
        status: 'completed',
        description: description || `تحويل إلى ${receiverLab.labName}`,
        metadata: {
            senderLabName: senderLab.labName,
            receiverLabName: receiverLab.labName
        }
    });

    // Update wallets
    await Promise.all([
        Wallet.findOneAndUpdate(
            { lab: senderLab._id },
            { 
                $inc: { balance: -parseFloat(amount) },
                $push: { transactions: transaction._id },
                lastUpdated: new Date()
            }
        ),
        Wallet.findOneAndUpdate(
            { lab: receiverLab._id },
            { 
                $inc: { balance: parseFloat(amount) },
                $push: { transactions: transaction._id },
                lastUpdated: new Date()
            }
        )
    ]);

    sendSuccess(res, 'تم التحويل بنجاح', {
        transactionId: transaction._id,
        amount: parseFloat(amount),
        from: senderLab.labName,
        to: receiverLab.labName,
        newBalance: senderWallet.balance - parseFloat(amount)
    });
});

// @desc    Get transaction history
// @route   GET /api/v1/wallets/transactions
// @access  Private/Lab
exports.getTransactionHistory = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Get user's lab
    const lab = await Lab.findOne({ user: req.user.id });
    if (!lab) {
        return sendError(res, 'لم يتم العثور على مختبر مرتبط بحسابك', 404);
    }

    // Build filters
    const filters = {
        $or: [
            { 'from.lab': lab._id },
            { 'to.lab': lab._id }
        ]
    };

    if (type) filters.type = type;
    if (status) filters.status = status;

    // Date range filter
    if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const transactions = await Transaction.find(filters)
        .populate('from.lab', 'labName')
        .populate('to.lab', 'labName')
        .populate('from.user', 'name')
        .populate('to.user', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Get total count for pagination
    const total = await Transaction.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب تاريخ المعاملات بنجاح', {
        transactions,
        pagination
    });
});

// @desc    Get all transactions (Admin only)
// @route   GET /api/v1/wallets/all-transactions
// @access  Private/Admin
exports.getAllTransactions = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        type,
        status,
        search,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minAmount,
        maxAmount
    } = req.query;

    // Build filters
    const filters = {};
    
    if (type) filters.type = type;
    if (status) filters.status = status;

    // Amount range filter
    if (minAmount || maxAmount) {
        filters.amount = {};
        if (minAmount) filters.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filters.amount.$lte = parseFloat(maxAmount);
    }

    // Date range filter
    if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
        filters.$or = [
            { description: { $regex: search, $options: 'i' } },
            { 'metadata.reference': { $regex: search, $options: 'i' } }
        ];
    }

    // Build pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const transactions = await Transaction.find(filters)
        .populate('from.lab', 'labName')
        .populate('to.lab', 'labName')
        .populate('from.user', 'name email')
        .populate('to.user', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Get total count for pagination
    const total = await Transaction.countDocuments(filters);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    sendSuccess(res, 'تم جلب جميع المعاملات بنجاح', {
        transactions,
        pagination
    });
});

// @desc    Get wallet statistics
// @route   GET /api/v1/wallets/statistics
// @access  Private/Admin
exports.getWalletStatistics = asyncHandler(async (req, res) => {
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
        totalWallets,
        totalBalance,
        totalDeposits,
        totalWithdrawals,
        totalTransfers,
        recentTransactions
    ] = await Promise.all([
        Wallet.countDocuments(),
        Wallet.aggregate([
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]),
        Transaction.aggregate([
            { $match: { type: 'deposit', createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Transaction.aggregate([
            { $match: { type: 'withdrawal', createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Transaction.aggregate([
            { $match: { type: 'transfer', createdAt: { $gte: startDate } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Transaction.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    const statistics = {
        period,
        wallets: {
            total: totalWallets,
            totalBalance: totalBalance[0]?.total || 0,
            currency: 'SAR'
        },
        transactions: {
            total: recentTransactions,
            deposits: {
                count: totalDeposits[0]?.count || 0,
                amount: totalDeposits[0]?.total || 0
            },
            withdrawals: {
                count: totalWithdrawals[0]?.count || 0,
                amount: totalWithdrawals[0]?.total || 0
            },
            transfers: {
                count: totalTransfers[0]?.count || 0,
                amount: totalTransfers[0]?.total || 0
            }
        }
    };

    sendSuccess(res, 'تم جلب إحصائيات المحافظ بنجاح', statistics);
});

// @desc    Get single transaction
// @route   GET /api/v1/wallets/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id)
        .populate('from.lab', 'labName address contactPerson')
        .populate('to.lab', 'labName address contactPerson')
        .populate('from.user', 'name email phone')
        .populate('to.user', 'name email phone');

    if (!transaction) {
        return sendError(res, 'المعاملة غير موجودة', 404);
    }

    // Check permissions (admin or involved in transaction)
    if (req.user.role !== 'admin') {
        const userLab = await Lab.findOne({ user: req.user.id });
        const isInvolved = 
            (transaction.from.lab && transaction.from.lab._id.toString() === userLab?._id.toString()) ||
            (transaction.to.lab && transaction.to.lab._id.toString() === userLab?._id.toString()) ||
            (transaction.from.user && transaction.from.user._id.toString() === req.user.id) ||
            (transaction.to.user && transaction.to.user._id.toString() === req.user.id);

        if (!isInvolved) {
            return sendError(res, 'غير مصرح لك بعرض هذه المعاملة', 403);
        }
    }

    sendSuccess(res, 'تم جلب المعاملة بنجاح', transaction);
});