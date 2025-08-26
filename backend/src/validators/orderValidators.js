const { body, param, query } = require('express-validator');

// Validation for creating order
exports.createOrderValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('يجب إضافة منتج واحد على الأقل للطلب'),
    body('items.*.product')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('الكمية يجب أن تكون رقم صحيح موجب'),
    body('shippingAddress')
        .optional()
        .isObject()
        .withMessage('عنوان الشحن يجب أن يكون كائن'),
    body('shippingAddress.street')
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage('الشارع يجب أن يكون بين 5 و 200 حرف'),
    body('shippingAddress.city')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('المدينة يجب أن تكون بين 2 و 100 حرف'),
    body('shippingAddress.region')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('المنطقة يجب أن تكون بين 2 و 100 حرف'),
    body('shippingAddress.postalCode')
        .optional()
        .matches(/^\d{5}$/)
        .withMessage('الرمز البريدي يجب أن يكون 5 أرقام'),
    body('paymentMethod')
        .optional()
        .isIn(['wallet', 'bank_transfer', 'cash_on_delivery'])
        .withMessage('طريقة الدفع يجب أن تكون: wallet, bank_transfer, أو cash_on_delivery'),
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الملاحظات لا يمكن أن تتجاوز 500 حرف')
        .trim()
];

// Validation for updating order status
exports.updateOrderStatusValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف الطلب غير صحيح'),
    body('status')
        .notEmpty()
        .withMessage('حالة الطلب مطلوبة')
        .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        .withMessage('حالة الطلب غير صحيحة'),
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الملاحظات لا يمكن أن تتجاوز 500 حرف')
        .trim()
];

// Validation for cancelling order
exports.cancelOrderValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف الطلب غير صحيح'),
    body('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('سبب الإلغاء لا يمكن أن يتجاوز 500 حرف')
        .trim()
];

// Validation for order query parameters
exports.orderQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 50'),
    query('status')
        .optional()
        .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        .withMessage('حالة الطلب غير صحيحة'),
    query('paymentStatus')
        .optional()
        .isIn(['pending', 'paid', 'completed', 'refunded', 'failed'])
        .withMessage('حالة الدفع غير صحيحة'),
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('البحث يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البداية غير صحيح'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية غير صحيح')
        .custom((value, { req }) => {
            if (value && req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                const endDate = new Date(value);
                if (endDate <= startDate) {
                    throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
                }
            }
            return true;
        }),
    query('minAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأدنى للمبلغ يجب أن يكون رقم موجب'),
    query('maxAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأعلى للمبلغ يجب أن يكون رقم موجب')
        .custom((value, { req }) => {
            if (value && req.query.minAmount && parseFloat(value) < parseFloat(req.query.minAmount)) {
                throw new Error('الحد الأعلى للمبلغ يجب أن يكون أكبر من الحد الأدنى');
            }
            return true;
        }),
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'totalAmount', 'status'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc')
];

// Validation for order statistics
exports.orderStatisticsValidation = [
    query('period')
        .optional()
        .isIn(['today', 'week', 'month', 'year'])
        .withMessage('الفترة يجب أن تكون: today, week, month, أو year')
];

// Validation for order ID parameter
exports.orderIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف الطلب غير صحيح')
];