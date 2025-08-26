const { body, param, query } = require('express-validator');

// Validation for creating exchange request
exports.createExchangeValidation = [
    body('receiverProductId')
        .notEmpty()
        .withMessage('منتج المستقبل مطلوب')
        .isMongoId()
        .withMessage('معرف منتج المستقبل غير صحيح'),
    body('requesterProductId')
        .notEmpty()
        .withMessage('منتجك المعروض للتبادل مطلوب')
        .isMongoId()
        .withMessage('معرف منتجك المعروض للتبادل غير صحيح'),
    body('requesterQuantity')
        .notEmpty()
        .withMessage('كمية منتجك المعروض للتبادل مطلوبة')
        .isInt({ min: 1 })
        .withMessage('كمية منتجك المعروض للتبادل يجب أن تكون رقم صحيح موجب'),
    body('receiverQuantity')
        .notEmpty()
        .withMessage('الكمية المطلوبة من منتج المستقبل مطلوبة')
        .isInt({ min: 1 })
        .withMessage('الكمية المطلوبة من منتج المستقبل يجب أن تكون رقم صحيح موجب'),
    body('message')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('الرسالة لا يمكن أن تتجاوز 1000 حرف')
        .trim(),
    body('proposedDeliveryDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ التسليم المقترح غير صحيح')
        .custom((value) => {
            if (value) {
                const proposedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (proposedDate < today) {
                    throw new Error('تاريخ التسليم المقترح يجب أن يكون في المستقبل');
                }
            }
            return true;
        })
];

// Validation for responding to exchange
exports.respondToExchangeValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف طلب التبادل غير صحيح'),
    body('action')
        .notEmpty()
        .withMessage('الإجراء مطلوب')
        .isIn(['accept', 'reject', 'counter'])
        .withMessage('الإجراء يجب أن يكون: accept, reject, أو counter'),
    body('message')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('الرسالة لا يمكن أن تتجاوز 1000 حرف')
        .trim(),
    body('counterOffer')
        .if(body('action').equals('counter'))
        .notEmpty()
        .withMessage('العرض المضاد مطلوب عند اختيار counter'),
    body('counterOffer.receiverQuantity')
        .if(body('action').equals('counter'))
        .optional()
        .isInt({ min: 1 })
        .withMessage('الكمية المضادة المطلوبة يجب أن تكون رقم صحيح موجب'),
    body('counterOffer.requesterQuantity')
        .if(body('action').equals('counter'))
        .optional()
        .isInt({ min: 1 })
        .withMessage('الكمية المضادة المعروضة يجب أن تكون رقم صحيح موجب'),
    body('counterOffer.message')
        .if(body('action').equals('counter'))
        .optional()
        .isLength({ max: 500 })
        .withMessage('رسالة العرض المضاد لا يمكن أن تتجاوز 500 حرف'),
    body('counterOffer.validUntil')
        .if(body('action').equals('counter'))
        .optional()
        .isISO8601()
        .withMessage('تاريخ انتهاء العرض المضاد غير صحيح')
        .custom((value) => {
            if (value) {
                const validUntil = new Date(value);
                const now = new Date();
                
                if (validUntil <= now) {
                    throw new Error('تاريخ انتهاء العرض المضاد يجب أن يكون في المستقبل');
                }
            }
            return true;
        })
];

// Validation for updating exchange status
exports.updateExchangeStatusValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف طلب التبادل غير صحيح'),
    body('status')
        .notEmpty()
        .withMessage('حالة التبادل مطلوبة')
        .isIn(['pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled'])
        .withMessage('حالة التبادل غير صحيحة'),
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الملاحظات لا يمكن أن تتجاوز 500 حرف')
        .trim()
];

// Validation for exchange query parameters
exports.exchangeQueryValidation = [
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
        .isIn(['pending', 'accepted', 'rejected', 'counter_offered', 'confirmed', 'in_progress', 'completed', 'cancelled'])
        .withMessage('حالة التبادل غير صحيحة'),
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
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'status'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc')
];

// Validation for exchange statistics
exports.exchangeStatisticsValidation = [
    query('period')
        .optional()
        .isIn(['today', 'week', 'month', 'year'])
        .withMessage('الفترة يجب أن تكون: today, week, month, أو year')
];

// Validation for exchange ID parameter
exports.exchangeIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف طلب التبادل غير صحيح')
];