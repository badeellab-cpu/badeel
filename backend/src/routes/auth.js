const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    register,
    login,
    logout,
    getMe,
    updateDetails,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadLabFiles } = require('../middleware/upload');
const { handleValidationErrors, customValidators } = require('../middleware/validate');
const { authLimiter, passwordResetLimiter, emailVerificationLimiter, uploadLimiter } = require('../middleware/security');

// Validation rules
const registerValidation = [
    body('name')
        .notEmpty().withMessage('الاسم مطلوب')
        .isLength({ min: 3, max: 100 }).withMessage('الاسم يجب أن يكون بين 3 و 100 حرف'),
    body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .custom(customValidators.isStrongPassword).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص'),
    body('phone')
        .notEmpty().withMessage('رقم الجوال مطلوب')
        .custom(customValidators.isSaudiPhone).withMessage('رقم الجوال يجب أن يكون رقم سعودي صحيح'),
    body('labName')
        .notEmpty().withMessage('اسم المختبر مطلوب')
        .isLength({ min: 3, max: 200 }).withMessage('اسم المختبر يجب أن يكون بين 3 و 200 حرف'),
    body('address')
        .notEmpty().withMessage('العنوان مطلوب'),
    body('postalCode')
        .notEmpty().withMessage('الرمز البريدي مطلوب')
        .matches(/^\d{5}$/).withMessage('الرمز البريدي يجب أن يكون 5 أرقام'),
    body('registrationNumber')
        .notEmpty().withMessage('رقم السجل التجاري مطلوب')
        .matches(/^\d{10}$/).withMessage('رقم السجل التجاري يجب أن يكون 10 أرقام'),
    body('licenseNumber')
        .notEmpty().withMessage('رقم ترخيص وزارة الصحة مطلوب')
];

const loginValidation = [
    body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
];

const updatePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
    body('newPassword')
        .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
        .isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .custom(customValidators.isStrongPassword).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص')
        .custom((value, { req }) => value !== req.body.currentPassword).withMessage('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية')
];

const forgotPasswordValidation = [
    body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail()
];

const resetPasswordValidation = [
    body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
];

// Routes with security middleware
router.post('/register', uploadLimiter, uploadLabFiles, registerValidation, handleValidationErrors, register);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePasswordValidation, handleValidationErrors, updatePassword);
router.post('/forgotpassword', passwordResetLimiter, forgotPasswordValidation, handleValidationErrors, forgotPassword);
router.put('/resetpassword/:resettoken', passwordResetLimiter, resetPasswordValidation, handleValidationErrors, resetPassword);
router.get('/verifyemail/:token', verifyEmail);
router.post('/resendverification', emailVerificationLimiter, protect, resendVerificationEmail);

module.exports = router;