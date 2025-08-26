const { body, param, query } = require('express-validator');

// Validation for adding funds to wallet
exports.addFundsValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المحفظة غير صحيح'),
    body('amount')
        .notEmpty()
        .withMessage('المبلغ مطلوب')
        .isFloat({ min: 0.01 })
        .withMessage('المبلغ يجب أن يكون أكبر من صفر'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف لا يمكن أن يتجاوز 500 حرف')
        .trim(),
    body('reference')
        .optional()
        .isLength({ max: 100 })
        .withMessage('المرجع لا يمكن أن يتجاوز 100 حرف')
        .trim()
];

// Validation for deducting funds from wallet
exports.deductFundsValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المحفظة غير صحيح'),
    body('amount')
        .notEmpty()
        .withMessage('المبلغ مطلوب')
        .isFloat({ min: 0.01 })
        .withMessage('المبلغ يجب أن يكون أكبر من صفر'),
    body('reason')
        .notEmpty()
        .withMessage('سبب الخصم مطلوب')
        .isLength({ min: 5, max: 200 })
        .withMessage('سبب الخصم يجب أن يكون بين 5 و 200 حرف')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف لا يمكن أن يتجاوز 500 حرف')
        .trim()
];

// Validation for transferring funds
exports.transferFundsValidation = [
    body('toLabId')
        .notEmpty()
        .withMessage('معرف المختبر المستقبل مطلوب')
        .isMongoId()
        .withMessage('معرف المختبر المستقبل غير صحيح'),
    body('amount')
        .notEmpty()
        .withMessage('المبلغ مطلوب')
        .isFloat({ min: 0.01 })
        .withMessage('المبلغ يجب أن يكون أكبر من صفر'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف لا يمكن أن يتجاوز 500 حرف')
        .trim()
];

// Validation for wallet query parameters
exports.walletQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 50'),
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('البحث يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    query('minBalance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأدنى للرصيد يجب أن يكون رقم موجب'),
    query('maxBalance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأعلى للرصيد يجب أن يكون رقم موجب')
        .custom((value, { req }) => {
            if (value && req.query.minBalance && parseFloat(value) < parseFloat(req.query.minBalance)) {
                throw new Error('الحد الأعلى للرصيد يجب أن يكون أكبر من الحد الأدنى');
            }
            return true;
        }),
    query('currency')
        .optional()
        .isIn(['SAR', 'USD', 'EUR'])
        .withMessage('العملة يجب أن تكون SAR, USD, أو EUR'),
    query('sortBy')
        .optional()
        .isIn(['balance', 'lastUpdated', 'createdAt'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc')
];

// Validation for transaction query parameters
exports.transactionQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 50'),
    query('type')
        .optional()
        .isIn(['deposit', 'withdrawal', 'transfer', 'order_payment', 'refund'])
        .withMessage('نوع المعاملة يجب أن يكون: deposit, withdrawal, transfer, order_payment, أو refund'),
    query('status')
        .optional()
        .isIn(['pending', 'completed', 'failed', 'cancelled'])
        .withMessage('حالة المعاملة يجب أن تكون: pending, completed, failed, أو cancelled'),
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
        .isIn(['createdAt', 'updatedAt', 'amount', 'status'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc')
];

// Validation for wallet statistics
exports.walletStatisticsValidation = [
    query('period')
        .optional()
        .isIn(['today', 'week', 'month', 'year'])
        .withMessage('الفترة يجب أن تكون: today, week, month, أو year')
];

// Validation for wallet ID parameter
exports.walletIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المحفظة غير صحيح')
];

// Validation for transaction ID parameter
exports.transactionIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المعاملة غير صحيح')
];