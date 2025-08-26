const asyncHandler = require('express-async-handler');
const ExchangeRequest = require('../models/ExchangeRequest');
const Exchange = require('../models/Exchange');
const Product = require('../models/Product');
const Lab = require('../models/Lab');
const emailService = require('../utils/email');

// @desc    Create exchange request
// @route   POST /api/v1/exchange-requests
// @access  Private (Lab users only)
exports.createExchangeRequest = asyncHandler(async (req, res) => {
    const {
        targetProductId,
        requestedQuantity,
        offerType,
        offeredProductId,
        offeredQuantity,
        customOffer,
        message
    } = req.body;

    // Check if user is lab
    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    // Get requester lab
    const requesterLab = await Lab.findOne({ user: req.user._id });
    if (!requesterLab) {
        res.status(400);
        throw new Error('لا يوجد مختبر مرتبط بحسابك');
    }

    // Get target product
    const targetProduct = await Product.findById(targetProductId)
        .populate('lab', '_id labName user');
    
    if (!targetProduct) {
        res.status(404);
        throw new Error('المنتج المطلوب غير موجود');
    }

    if (targetProduct.type !== 'exchange') {
        res.status(400);
        throw new Error('هذا المنتج غير متاح للتبادل');
    }

    if (targetProduct.lab._id.toString() === requesterLab._id.toString()) {
        res.status(400);
        throw new Error('لا يمكنك طلب تبادل منتج من مختبرك');
    }

    if (requestedQuantity > targetProduct.quantity) {
        res.status(400);
        throw new Error(`الكمية المتوفرة هي ${targetProduct.quantity} فقط`);
    }

    // Validate offer based on type
    let offeredProduct = null;
    if (offerType === 'existing_product') {
        if (!offeredProductId || !offeredQuantity) {
            res.status(400);
            throw new Error('يجب تحديد المنتج المعروض والكمية');
        }

        offeredProduct = await Product.findById(offeredProductId);
        if (!offeredProduct) {
            res.status(404);
            throw new Error('المنتج المعروض غير موجود');
        }

        if (offeredProduct.lab.toString() !== requesterLab._id.toString()) {
            res.status(400);
            throw new Error('المنتج المعروض ليس من مختبرك');
        }

        if (offeredProduct.type !== 'exchange') {
            res.status(400);
            throw new Error('المنتج المعروض غير متاح للتبادل');
        }

        if (offeredQuantity > offeredProduct.quantity) {
            res.status(400);
            throw new Error(`الكمية المتوفرة من المنتج المعروض هي ${offeredProduct.quantity} فقط`);
        }
    } else if (offerType === 'custom_offer') {
        if (!customOffer || !customOffer.name || !customOffer.description) {
            res.status(400);
            throw new Error('يجب تقديم تفاصيل العرض المخصص');
        }
        // Default quantity to 1 if not provided
        if (!customOffer.quantity || customOffer.quantity < 1) {
            customOffer.quantity = 1;
        }
    }

    // Create exchange request
    const exchangeRequest = await ExchangeRequest.create({
        requesterLab: requesterLab._id,
        targetProduct: {
            product: targetProduct._id,
            ownerLab: targetProduct.lab._id,
            requestedQuantity
        },
        offerType,
        offeredProduct: offerType === 'existing_product' ? {
            product: offeredProduct._id,
            quantity: offeredQuantity
        } : undefined,
        customOffer: offerType === 'custom_offer' ? customOffer : undefined,
        message,
        metadata: {
            source: 'web',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }
    });

    // Populate for response
    await exchangeRequest.populate([
        {
            path: 'requesterLab',
            select: 'labName address'
        },
        {
            path: 'targetProduct.product',
            select: 'name images price'
        },
        {
            path: 'targetProduct.ownerLab',
            select: 'labName'
        },
        {
            path: 'offeredProduct.product',
            select: 'name images price'
        }
    ]);

    // Send notification email to target lab
    const targetLabUser = await Lab.findById(targetProduct.lab._id)
        .populate('user', 'email firstName lastName');
    
    try {
      if (targetLabUser && targetLabUser.user.email) {
        await emailService.sendEmail({
            email: targetLabUser.user.email,
            subject: 'طلب تبادل جديد - منصة بديل',
            message: `
                <h2>طلب تبادل جديد!</h2>
                <p>تلقيت طلب تبادل جديد من مختبر ${requesterLab.labName}</p>
                <p><strong>المنتج المطلوب:</strong> ${targetProduct.name}</p>
                <p><strong>الكمية المطلوبة:</strong> ${requestedQuantity}</p>
                <p><strong>رقم الطلب:</strong> ${exchangeRequest.requestNumber}</p>
                <p>يرجى تسجيل الدخول لمراجعة الطلب والرد عليه.</p>
            `
        });
      }
    } catch (e) {
      console.log('Email skipped/failure (createExchangeRequest):', e?.message);
    }

    res.status(201).json({
        success: true,
        data: exchangeRequest
    });
});

// @desc    Get exchange requests for lab (sent and received)
// @route   GET /api/v1/exchange-requests
// @access  Private (Lab users only)
exports.getExchangeRequests = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        type, // 'sent' or 'received'
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Get lab
    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    const lab = await Lab.findOne({ user: req.user._id });
    if (!lab) {
        res.status(400);
        throw new Error('لا يوجد مختبر مرتبط بحسابك');
    }

    // Build filters
    const filters = {};
    
    if (type === 'sent') {
        filters.requesterLab = lab._id;
    } else if (type === 'received') {
        filters['targetProduct.ownerLab'] = lab._id;
    } else {
        // Both sent and received
        filters.$or = [
            { requesterLab: lab._id },
            { 'targetProduct.ownerLab': lab._id }
        ];
    }

    if (status) {
        filters.status = status;
    }

    // Build pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get requests
    const requests = await ExchangeRequest.find(filters)
        .populate([
            {
                path: 'requesterLab',
                select: 'labName address'
            },
            {
                path: 'targetProduct.product',
                select: 'name images price description'
            },
            {
                path: 'targetProduct.ownerLab',
                select: 'labName'
            },
            {
                path: 'offeredProduct.product',
                select: 'name images price description'
            }
        ])
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Get total count
    const total = await ExchangeRequest.countDocuments(filters);

    res.status(200).json({
        success: true,
        data: requests,
        pagination: {
            page: parseInt(page),
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    });
});

// @desc    Get single exchange request
// @route   GET /api/v1/exchange-requests/:id
// @access  Private (Lab users only)
exports.getExchangeRequest = asyncHandler(async (req, res) => {
    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    const lab = await Lab.findOne({ user: req.user._id });
    if (!lab) {
        res.status(400);
        throw new Error('لا يوجد مختبر مرتبط بحسابك');
    }

    const request = await ExchangeRequest.findById(req.params.id)
        .populate([
            {
                path: 'requesterLab',
                select: 'labName address contactPerson'
            },
            {
                path: 'targetProduct.product',
                select: 'name images price description specifications condition brand model'
            },
            {
                path: 'targetProduct.ownerLab',
                select: 'labName address contactPerson'
            },
            {
                path: 'offeredProduct.product',
                select: 'name images price description specifications condition brand model'
            }
        ]);

    if (!request) {
        res.status(404);
        throw new Error('طلب التبادل غير موجود');
    }

    // Check if user has access to this request
    const hasAccess = request.requesterLab._id.toString() === lab._id.toString() ||
                      request.targetProduct.ownerLab._id.toString() === lab._id.toString();

    if (!hasAccess) {
        res.status(403);
        throw new Error('غير مصرح لك بالوصول لهذا الطلب');
    }

    // Mark as viewed if it's the receiver viewing for the first time
    if (request.targetProduct.ownerLab._id.toString() === lab._id.toString() &&
        request.status === 'pending') {
        request.status = 'viewed';
        await request.save();
    }

    const isReceiver = request.targetProduct.ownerLab._id.toString() === lab._id.toString();
    const canRespond = request.canBeRespondedTo(lab._id);



    res.status(200).json({
        success: true,
        data: {
            ...request.toObject(),
            isReceiver,
            canRespond
        }
    });
});

// @desc    Respond to exchange request
// @route   PUT /api/v1/exchange-requests/:id/respond
// @access  Private (Lab users only)
exports.respondToExchangeRequest = asyncHandler(async (req, res) => {
    const { action, rejectionReason, counterOffer } = req.body;

    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    const lab = await Lab.findOne({ user: req.user._id });
    if (!lab) {
        res.status(400);
        throw new Error('لا يوجد مختبر مرتبط بحسابك');
    }

    const request = await ExchangeRequest.findById(req.params.id)
        .populate([
            { path: 'requesterLab', select: 'labName user' },
            { path: 'targetProduct.product' },
            { path: 'offeredProduct.product' }
        ]);

    if (!request) {
        res.status(404);
        throw new Error('طلب التبادل غير موجود');
    }

    // Check if user can respond to this request
    if (!request.canBeRespondedTo(lab._id)) {
        res.status(403);
        throw new Error('غير مصرح لك بالرد على هذا الطلب');
    }

    if (action === 'accept') {
        // Check if this is a custom offer or existing product
        if (request.offerType === 'custom_offer') {
            // For custom offers, we can't create a full Exchange yet
            // We need to create a placeholder or handle it differently
            request.status = 'accepted';
            request.notes = 'تم قبول العرض المخصص - يتطلب متابعة يدوية';
            
            // TODO: Create notification system for custom offer acceptance
            console.log('Custom offer accepted - manual follow-up required');
        } else if (request.offerType === 'existing_product' && request.offeredProduct?.product) {
            // تحقق من توفر الكميات في لحظة القبول ثم خصمها فوراً
            const [offeredDoc, targetDoc] = await Promise.all([
                Product.findById(request.offeredProduct.product._id || request.offeredProduct.product),
                Product.findById(request.targetProduct.product._id || request.targetProduct.product)
            ]);

            if (!offeredDoc || !targetDoc) {
                res.status(400);
                throw new Error('أحد المنتجات غير موجود');
            }

            const offeredQty = request.offeredProduct.quantity || 1;
            const targetQty = request.targetProduct.requestedQuantity;

            if (offeredDoc.quantity < offeredQty) {
                res.status(400);
                throw new Error('الكمية المتاحة من منتجك غير كافية');
            }
            if (targetDoc.quantity < targetQty) {
                res.status(400);
                throw new Error('الكمية المتاحة من المنتج المطلوب غير كافية');
            }

            // خصم المخزون فور القبول
            await Promise.all([
                Product.findByIdAndUpdate(offeredDoc._id, { $inc: { quantity: -offeredQty } }),
                Product.findByIdAndUpdate(targetDoc._id, { $inc: { quantity: -targetQty } })
            ]);

            // إنشاء عملية التبادل بحالة مقبولة
            const exchange = await Exchange.create({
                requester: {
                    user: request.requesterLab.user,
                    lab: request.requesterLab._id
                },
                receiver: {
                    user: lab.user,
                    lab: lab._id
                },
                requesterProduct: {
                    product: offeredDoc._id,
                    quantity: offeredQty
                },
                receiverProduct: {
                    product: targetDoc._id,
                    quantity: targetQty
                },
                status: 'accepted',
                acceptedAt: new Date()
            });

            // تحديث عدادات التبادل فقط
            await Promise.all([
                Product.findByIdAndUpdate(offeredDoc._id, {
                    $inc: { 'metadata.exchangedCount': 1 },
                    'metadata.lastExchangedAt': new Date()
                }),
                Product.findByIdAndUpdate(targetDoc._id, {
                    $inc: { 'metadata.exchangedCount': 1 },
                    'metadata.lastExchangedAt': new Date()
                })
            ]);

            request.status = 'accepted';
            request.exchangeId = exchange._id;
        } else {
            res.status(400);
            throw new Error('نوع العرض غير صالح أو بيانات المنتج المعروض مفقودة');
        }

        // Send notification to requester
        const requesterUser = await Lab.findById(request.requesterLab._id)
            .populate('user', 'email firstName lastName');
        
        try {
          if (requesterUser && requesterUser.user.email) {
            await emailService.sendEmail({
                email: requesterUser.user.email,
                subject: 'تم قبول طلب التبادل - منصة بديل',
                message: `
                    <h2>تم قبول طلب التبادل!</h2>
                    <p>تم قبول طلب التبادل رقم ${request.requestNumber}</p>
                    <p>رقم التبادل الجديد: ${exchange.exchangeNumber}</p>
                    <p>يرجى تسجيل الدخول لمتابعة إجراءات التبادل.</p>
                `
            });
          }
        } catch (e) {
          console.log('Email skipped/failure (respondToExchangeRequest):', e?.message);
        }

    } else if (action === 'reject') {
        if (!rejectionReason) {
            res.status(400);
            throw new Error('يجب تقديم سبب الرفض');
        }
        request.status = 'rejected';
        request.rejectionReason = rejectionReason;

    } else if (action === 'counter_offer') {
        if (!counterOffer || !counterOffer.message) {
            res.status(400);
            throw new Error('يجب تقديم تفاصيل العرض المضاد');
        }
        request.status = 'counter_offer';
        request.counterOffer = counterOffer;
    }

    await request.save();

    res.status(200).json({
        success: true,
        data: request
    });
});

// @desc    Withdraw exchange request
// @route   PUT /api/v1/exchange-requests/:id/withdraw
// @access  Private (Lab users only)
exports.withdrawExchangeRequest = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    const lab = await Lab.findOne({ user: req.user._id });
    if (!lab) {
        res.status(400);
        throw new Error('لا يوجد مختبر مرتبط بحسابك');
    }

    const request = await ExchangeRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('طلب التبادل غير موجود');
    }

    // Check if user can withdraw this request
    if (!request.canBeWithdrawn(lab._id)) {
        res.status(403);
        throw new Error('لا يمكنك سحب هذا الطلب');
    }

    request.status = 'withdrawn';
    request.withdrawnAt = new Date();
    request.withdrawalReason = reason;

    await request.save();

    res.status(200).json({
        success: true,
        message: 'تم سحب طلب التبادل بنجاح'
    });
});

// @desc    Get exchange request statistics for lab
// @route   GET /api/v1/exchange-requests/stats
// @access  Private (Lab users only)
exports.getExchangeRequestStats = asyncHandler(async (req, res) => {
    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    const lab = await Lab.findOne({ user: req.user._id });
    if (!lab) {
        res.status(400);
        throw new Error('لا يوجد مختبر مرتبط بحسابك');
    }

    const stats = await ExchangeRequest.getLabStatistics(lab._id);

    res.status(200).json({
        success: true,
        data: stats
    });
});
