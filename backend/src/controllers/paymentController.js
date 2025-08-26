const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Lab = require('../models/Lab');
const config = require('../config/config');
const emailService = require('../utils/email');

// @desc    Create payment intent for order
// @route   POST /api/payments/create-payment
// @access  Private
exports.createPayment = asyncHandler(async (req, res) => {
    const {
        items,
        shippingAddress,
        customerInfo,
        paymentMethod,
        orderNotes,
        couponCode
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('لا توجد منتجات في السلة');
    }

    // Calculate total and validate stock
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
        const product = await Product.findById(item.productId)
            .populate('lab', 'labName user');
        
        if (!product) {
            res.status(400);
            throw new Error(`المنتج ${item.productId} غير موجود`);
        }

        if (product.quantity < item.quantity) {
            res.status(400);
            throw new Error(`الكمية المتوفرة من ${product.name} هي ${product.quantity} فقط`);
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
            product: product._id,
            lab: product.lab?._id,
            quantity: item.quantity,
            price: product.price,
            total: itemTotal,
            productName: product.name,
            productImage: (product.images && product.images[0] && (product.images[0].url || product.images[0])) || undefined
        });
    }

    // Calculate shipping
    const shippingFee = subtotal >= 500 ? 0 : 30;
    
    // Apply coupon if provided
    let discount = 0;
    if (couponCode) {
        // TODO: Implement coupon validation
        // For now, we'll use a simple discount
        if (couponCode === 'WELCOME10') {
            discount = subtotal * 0.1; // 10% discount
        }
    }

    // Calculate tax (VAT 15%)
    const taxAmount = (subtotal - discount + shippingFee) * (config.payment.taxRate / 100);
    
    // Calculate final total
    const totalAmount = subtotal - discount + shippingFee + taxAmount;

    // Check if user is lab
    if (req.user.role !== 'lab') {
        res.status(403);
        throw new Error('هذه الخدمة متاحة للمختبرات فقط');
    }

    // Resolve buyer and seller info required by schema
    const buyerLab = await Lab.findOne({ user: req.user._id });
    if (!buyerLab) {
        res.status(400);
        throw new Error('لا يوجد مختبر مرتبط بالمستخدم الحالي');
    }

    // Use first item's lab as seller (assumes items belong to same seller)
    const firstItemLabId = orderItems[0].lab;
    const sellerLab = await Lab.findById(firstItemLabId).populate('user', '_id');
    if (!sellerLab) {
        res.status(400);
        throw new Error('المختبر البائع غير موجود');
    }

    // Generate order number before validation
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const generatedOrderNumber = `ORD-${year}${month}${day}-${random}`;

    // Create order in database with pending status
    const order = await Order.create({
        orderNumber: generatedOrderNumber,
        buyer: {
            user: req.user._id,
            lab: buyerLab._id
        },
        seller: {
            user: sellerLab.user?._id || sellerLab.user,
            lab: sellerLab._id
        },
        items: orderItems,
        shippingAddress: {
            fullName: customerInfo.firstName + ' ' + customerInfo.lastName,
            phone: customerInfo.phone,
            email: customerInfo.email,
            address: shippingAddress.address,
            city: shippingAddress.city,
            region: shippingAddress.region,
            postalCode: shippingAddress.postalCode,
            additionalInfo: shippingAddress.additionalInfo
        },
        payment: {
            method: paymentMethod === 'cod' ? 'cod' : 'card',
            status: 'pending',
            amount: totalAmount,
            currency: 'SAR'
        },
        subtotal,
        discount,
        shippingFee,
        taxAmount,
        totalAmount,
        notes: orderNotes,
        status: 'pending'
    });

    // Create payment with Moyasar
    try {
        let paymentResponse;
        
        if (paymentMethod === 'card') {
            // Prepare client-side Moyasar initialization data
            const moyasarPayment = {
                amount: Math.round(totalAmount * 100), // Convert to halalas
                currency: 'SAR',
                description: `طلب رقم ${order.orderNumber}`
            };

            // Store the order ID in payment metadata for webhook handling
            order.payment.metadata = {
                orderId: order._id.toString()
            };
            await order.save();

            // Return payment data for frontend to complete
            res.status(200).json({
                success: true,
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount
                },
                payment: {
                    amount: moyasarPayment.amount,
                    currency: moyasarPayment.currency,
                    description: moyasarPayment.description,
                    publishable_api_key: config.payment.moyasar.publicKey,
                    metadata: {
                        order_id: order._id.toString()
                    }
                }
            });
        } else if (paymentMethod === 'cod') {
            // Cash on delivery - confirm order directly
            order.payment.status = 'cod';
            order.status = 'confirmed';
            await order.save();

            // Update product quantities
            for (const item of orderItems) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { quantity: -item.quantity } }
                );
            }

            // Send confirmation email
            await emailService.sendEmail({
                email: customerInfo.email,
                subject: 'تأكيد الطلب - منصة بديل',
                message: `
                    <h2>تم تأكيد طلبك بنجاح!</h2>
                    <p>رقم الطلب: ${order.orderNumber}</p>
                    <p>المبلغ الإجمالي: ${order.totalAmount} ريال</p>
                    <p>طريقة الدفع: الدفع عند الاستلام</p>
                    <p>سيتم التواصل معك قريباً لتأكيد التوصيل.</p>
                `
            });

            res.status(200).json({
                success: true,
                order: order
            });
        }
    } catch (error) {
        // Delete order if payment creation fails
        await Order.findByIdAndDelete(order._id);
        
        res.status(500);
        throw new Error('فشل في إنشاء عملية الدفع: ' + error.message);
    }
});

// @desc    Confirm payment after Moyasar callback
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = asyncHandler(async (req, res) => {
    const { orderId, paymentId } = req.body;

    if (!orderId) {
        res.status(400);
        throw new Error('معرف الطلب مطلوب');
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error('الطلب غير موجود');
    }

    // If no paymentId provided, just return current order status
    if (!paymentId) {
        res.status(200).json({
            success: true,
            order: order,
            message: 'حالة الطلب الحالية'
        });
        return;
    }

    // Verify payment with Moyasar
    try {
        const response = await axios.get(
            `${config.payment.moyasar.apiUrl}/payments/${paymentId}`,
            {
                auth: {
                    username: config.payment.moyasar.secretKey,
                    password: ''
                }
            }
        );

        const payment = response.data;

        // Verify payment amount matches order amount (with small tolerance for rounding)
        const expectedAmount = Math.round(order.totalAmount * 100);
        if (Math.abs(payment.amount - expectedAmount) > 1) {
            console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${payment.amount}`);
            res.status(400);
            throw new Error('مبلغ الدفع غير متطابق');
        }

        // Update order based on payment status
        if (payment.status === 'paid') {
            order.payment.status = 'paid';
            order.payment.transactionId = payment.id;
            order.payment.paidAt = new Date();
            order.status = 'confirmed';

            // Update product quantities
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { quantity: -item.quantity } }
                );
            }

            await order.save();

            // Send confirmation email
            try {
                await emailService.sendEmail({
                email: order.shippingAddress.email,
                subject: 'تأكيد الطلب - منصة بديل',
                message: `
                    <h2>تم تأكيد طلبك بنجاح!</h2>
                    <p>رقم الطلب: ${order.orderNumber}</p>
                    <p>المبلغ المدفوع: ${order.totalAmount} ريال</p>
                    <p>سيتم شحن طلبك قريباً.</p>
                `
                });
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }

            res.status(200).json({
                success: true,
                order: order
            });
        } else if (payment.status === 'failed') {
            order.payment.status = 'failed';
            order.status = 'cancelled';
            await order.save();

            res.status(400).json({
                success: false,
                message: 'فشلت عملية الدفع'
            });
        } else {
            // Payment still pending
            res.status(200).json({
                success: true,
                message: 'عملية الدفع قيد المعالجة',
                order: order
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500);
        throw new Error('فشل في التحقق من عملية الدفع');
    }
});

// @desc    Handle Moyasar webhook
// @route   POST /api/payments/webhook
// @access  Public (but verified by webhook secret)
exports.handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-moyasar-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', config.payment.moyasar.webhookSecret)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        res.status(401);
        throw new Error('Invalid webhook signature');
    }

    const { type, data } = req.body;

    if (type === 'payment_paid') {
        // Try to find order by payment ID first
        let order = await Order.findOne({
            'payment.transactionId': data.id
        });

        // If not found by transactionId, try by metadata
        if (!order && data.metadata && data.metadata.order_id) {
            order = await Order.findById(data.metadata.order_id);
            if (order) {
                // Update transaction ID
                order.payment.transactionId = data.id;
            }
        }

        if (order && order.payment.status !== 'paid') {
            order.payment.status = 'paid';
            order.payment.paidAt = new Date();
            order.status = 'confirmed';

            // Update product quantities if not already done
            if (!order.payment.quantitiesUpdated) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { quantity: -item.quantity } }
                    );
                }
                order.payment.quantitiesUpdated = true;
            }

            await order.save();

            // Send confirmation email
            try {
                await emailService.sendEmail({
                    email: order.shippingAddress.email,
                    subject: 'تأكيد الطلب - منصة بديل',
                    message: `
                        <h2>تم تأكيد طلبك بنجاح!</h2>
                        <p>رقم الطلب: ${order.orderNumber}</p>
                        <p>المبلغ المدفوع: ${order.totalAmount} ريال</p>
                        <p>سيتم شحن طلبك قريباً.</p>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }
        }
    } else if (type === 'payment_failed') {
        // Handle failed payment
        const order = await Order.findOne({
            'payment.transactionId': data.id
        });

        if (order && order.payment.status === 'pending') {
            order.payment.status = 'failed';
            order.status = 'cancelled';
            await order.save();
        }
    }

    res.status(200).json({ received: true });
});

// @desc    Get payment status
// @route   GET /api/payments/status/:orderId
// @access  Private
exports.getPaymentStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
        res.status(404);
        throw new Error('الطلب غير موجود');
    }

    // Check if requester is involved in the order (buyer or seller) or admin
    if (req.user.role !== 'admin') {
        const userLab = await Lab.findOne({ user: req.user._id });
        const isBuyer = userLab && order.buyer?.lab?.toString?.() === userLab._id.toString();
        const isSeller = userLab && order.seller?.lab?.toString?.() === userLab._id.toString();
        if (!isBuyer && !isSeller) {
            res.status(403);
            throw new Error('غير مصرح لك بالوصول لهذا الطلب');
        }
    }

    res.status(200).json({
        success: true,
        payment: {
            status: order.payment.status,
            method: order.payment.method,
            amount: order.payment.amount,
            transactionId: order.payment.transactionId,
            paidAt: order.payment.paidAt
        },
        orderStatus: order.status
    });
});
