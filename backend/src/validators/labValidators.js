const { body, param, query } = require('express-validator');
const { customValidators } = require('../middleware/validate');

// Validation for approving/rejecting labs
exports.labActionValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح'),
    body('reason')
        .optional()
        .isLength({ min: 10, max: 500 })
        .withMessage('السبب يجب أن يكون بين 10 و 500 حرف')
        .trim()
];

// Validation for rejecting lab (reason is required)
exports.rejectLabValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح'),
    body('reason')
        .notEmpty()
        .withMessage('سبب الرفض مطلوب')
        .isLength({ min: 10, max: 500 })
        .withMessage('سبب الرفض يجب أن يكون بين 10 و 500 حرف')
        .trim()
];

// Validation for suspending lab
exports.suspendLabValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح'),
    body('reason')
        .notEmpty()
        .withMessage('سبب التعليق مطلوب')
        .isLength({ min: 10, max: 500 })
        .withMessage('سبب التعليق يجب أن يكون بين 10 و 500 حرف')
        .trim()
];

// Validation for updating lab profile
exports.updateLabValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('الوصف لا يمكن أن يتجاوز 1000 حرف')
        .trim(),
    body('workingHours')
        .optional()
        .isObject()
        .withMessage('ساعات العمل يجب أن تكون كائن'),
    body('workingHours.*.open')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('وقت الفتح يجب أن يكون بتنسيق HH:MM'),
    body('workingHours.*.close')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('وقت الإغلاق يجب أن يكون بتنسيق HH:MM'),
    body('workingHours.*.isOpen')
        .optional()
        .isBoolean()
        .withMessage('حالة الفتح يجب أن تكون true أو false'),
    body('contactPerson.name')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('اسم الشخص المسؤول يجب أن يكون بين 3 و 100 حرف')
        .trim(),
    body('contactPerson.position')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('المنصب يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    body('contactPerson.phone')
        .optional()
        .custom(customValidators.isSaudiPhone)
        .withMessage('رقم جوال الشخص المسؤول يجب أن يكون رقم سعودي صحيح'),
    body('contactPerson.email')
        .optional()
        .isEmail()
        .withMessage('بريد الشخص المسؤول غير صحيح')
        .normalizeEmail(),
    body('socialMedia.website')
        .optional()
        .isURL()
        .withMessage('رابط الموقع غير صحيح'),
    body('socialMedia.facebook')
        .optional()
        .isURL()
        .withMessage('رابط فيسبوك غير صحيح'),
    body('socialMedia.twitter')
        .optional()
        .isURL()
        .withMessage('رابط تويتر غير صحيح'),
    body('socialMedia.instagram')
        .optional()
        .isURL()
        .withMessage('رابط إنستغرام غير صحيح'),
    body('socialMedia.linkedin')
        .optional()
        .isURL()
        .withMessage('رابط لينكد إن غير صحيح'),
    body('bankAccount.bankName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم البنك يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    body('bankAccount.accountName')
        .optional()
        .isLength({ min: 5, max: 100 })
        .withMessage('اسم صاحب الحساب يجب أن يكون بين 5 و 100 حرف')
        .trim(),
    body('bankAccount.iban')
        .optional()
        .matches(/^SA\d{22}$/)
        .withMessage('رقم IBAN يجب أن يكون سعودي صحيح (SA + 22 رقم)'),
    body('bankAccount.accountNumber')
        .optional()
        .isLength({ min: 8, max: 20 })
        .withMessage('رقم الحساب يجب أن يكون بين 8 و 20 رقم')
        .isNumeric()
        .withMessage('رقم الحساب يجب أن يحتوي على أرقام فقط'),
    body('preferences.autoApproveExchanges')
        .optional()
        .isBoolean()
        .withMessage('الموافقة التلقائية على التبادلات يجب أن تكون true أو false'),
    body('preferences.minimumOrderAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأدنى لقيمة الطلب يجب أن يكون رقم موجب'),
    body('preferences.deliveryAvailable')
        .optional()
        .isBoolean()
        .withMessage('توفر التوصيل يجب أن يكون true أو false'),
    body('preferences.deliveryFee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('رسوم التوصيل يجب أن تكون رقم موجب'),
    body('preferences.freeDeliveryThreshold')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('حد التوصيل المجاني يجب أن يكون رقم موجب')
];

// Validation for adding lab note
exports.addLabNoteValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح'),
    body('note')
        .notEmpty()
        .withMessage('الملاحظة مطلوبة')
        .isLength({ min: 5, max: 1000 })
        .withMessage('الملاحظة يجب أن تكون بين 5 و 1000 حرف')
        .trim()
];

// Validation for lab query parameters
exports.labQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 100'),
    query('status')
        .optional()
        .isIn(['pending', 'approved', 'rejected', 'suspended'])
        .withMessage('حالة المختبر يجب أن تكون: pending, approved, rejected, أو suspended'),
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('البحث يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'labName', 'registrationNumber'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc')
];

// Validation for lab ID parameter
exports.labIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح')
];