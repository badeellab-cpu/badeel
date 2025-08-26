const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Wallet = require('../models/Wallet');
const emailService = require('../utils/email');
const { sendSuccess, sendError, sendCreated } = require('../utils/apiResponse');

// @desc    Register lab
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const {
        // User fields
        name,
        email,
        password,
        phone,
        role = 'lab',
        // Lab fields
        labName,
        address,
        postalCode,
        registrationNumber,
        licenseNumber,
        description,
        specializations,
        contactPerson,
        // Admin creation flags
        adminCreated,
        autoApprove
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({
        $or: [{ email }, { phone }]
    });

    if (userExists) {
        return sendError(res, 'البريد الإلكتروني أو رقم الجوال مستخدم بالفعل', 400);
    }

    // Check if registration/license number exists
    const labExists = await Lab.findOne({
        $or: [{ registrationNumber }, { licenseNumber }]
    });

    if (labExists) {
        return sendError(res, 'رقم السجل التجاري أو رقم الترخيص مستخدم بالفعل', 400);
    }

    // Determine user status - auto-approve if created by admin
    const isAdminCreated = adminCreated === 'true';
    const shouldAutoApprove = autoApprove === 'true' && isAdminCreated;
    const userStatus = shouldAutoApprove ? 'approved' : 'pending';

    // Prepare address and files
    const files = req.files || {};
    const addressObj = {
        street: address,
        city: 'غير محدد',
        district: 'غير محدد',
        postalCode: postalCode
    };

    let user, lab;
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            // Create user
            [user] = await User.create([
                {
                    name,
                    email,
                    password,
                    phone,
                    role,
                    status: userStatus,
                    isEmailVerified: isAdminCreated
                }
            ], { session });

            // Build lab data
            const labData = {
                user: user._id,
                labName: labName || name,
                address: address,
                postalCode,
                registrationNumber,
                licenseNumber,
                description,
                specializations,
                contactPerson
            };

            if (files.registrationFile) {
                labData.registrationFile = files.registrationFile[0].path;
            }
            if (files.licenseFile) {
                labData.licenseFile = files.licenseFile[0].path;
            }
            if (files.additionalFiles) {
                labData.additionalFiles = files.additionalFiles.map(file => file.path);
            }

            // Create lab
            [lab] = await Lab.create([labData], { session });

            // Auto verify if needed
            if (shouldAutoApprove) {
                lab.isVerified = true;
                lab.verifiedAt = new Date();
                await lab.save({ session });
            }

            // Create wallet
            await Wallet.create([{ lab: lab._id }], { session });
        });
    } catch (err) {
        // If transactions are not supported (standalone MongoDB), fallback to manual creation with cleanup
        if (err?.message?.includes('Transaction numbers are only allowed')) {
            try {
                // Create user
                user = await User.create({
                    name,
                    email,
                    password,
                    phone,
                    role,
                    status: userStatus,
                    isEmailVerified: isAdminCreated
                });

                // Build lab data
                const labData = {
                    user: user._id,
                    labName: labName || name,
                    address: address,
                    postalCode,
                    registrationNumber,
                    licenseNumber,
                    description,
                    specializations,
                    contactPerson
                };
                if (files.registrationFile) labData.registrationFile = files.registrationFile[0].path;
                if (files.licenseFile) labData.licenseFile = files.licenseFile[0].path;
                if (files.additionalFiles) labData.additionalFiles = files.additionalFiles.map(f => f.path);

                lab = await Lab.create(labData);

                if (shouldAutoApprove) {
                    lab.isVerified = true;
                    lab.verifiedAt = new Date();
                    await lab.save();
                }

                await Wallet.createForLab(lab._id);
            } catch (fallbackErr) {
                // Cleanup any partial creations
                if (lab?._id) await Lab.deleteOne({ _id: lab._id });
                if (user?._id) await User.deleteOne({ _id: user._id });

                if (fallbackErr?.code === 11000) {
                    return sendError(res, 'البيانات المدخلة موجودة مسبقاً', 400);
                }
                return sendError(res, fallbackErr?.message || 'تعذر إنشاء المختبر، يرجى التحقق من البيانات', 400);
            } finally {
                await session.endSession();
            }
        } else {
            await session.endSession();
            if (err?.code === 11000) {
                return sendError(res, 'البيانات المدخلة موجودة مسبقاً', 400);
            }
            return sendError(res, err?.message || 'تعذر إنشاء المختبر، يرجى التحقق من البيانات', 400);
        }
    }
    await session.endSession();

    // Send emails based on creation type
    if (isAdminCreated) {
        // Send welcome email for admin-created accounts
        try {
            // Temporarily disable email sending
            // await emailService.sendLabApprovedEmail(lab);
            console.log('Email sending disabled for development');
        } catch (error) {
            console.error('Email sending failed:', error);
        }

        sendCreated(res, 'تم إنشاء المختبر بنجاح وتم اعتماده تلقائياً', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            },
            lab: {
                id: lab._id,
                labName: lab.labName,
                isVerified: lab.isVerified
            }
        });
    } else {
        // Regular registration flow
        // Optionally generate email verification token (disabled for now)
        // const verifyToken = user.getEmailVerificationToken();
        // await user.save();

        // Send verification email
        try {
            // Temporarily disable email sending
            // await emailService.sendWelcomeEmail(user, verifyToken);
            console.log('Email sending disabled for development');
        } catch (error) {
            console.error('Email sending failed:', error);
        }

        sendCreated(res, 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعة الطلب وإعلامك بالنتيجة عبر البريد الإلكتروني', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return sendError(res, 'يرجى إدخال البريد الإلكتروني وكلمة المرور', 400);
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return sendError(res, 'بيانات الدخول غير صحيحة', 401);
    }

    // Check if account is locked
    if (user.isLocked()) {
        return sendError(res, 'تم قفل الحساب مؤقتاً بسبب محاولات دخول فاشلة متعددة', 423);
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
        await user.incLoginAttempts();
        return sendError(res, 'بيانات الدخول غير صحيحة', 401);
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Check user status
    if (user.status === 'pending') {
        return sendError(res, 'حسابك قيد المراجعة. سيتم إعلامك عند الموافقة عليه', 403);
    }

    if (user.status === 'rejected') {
        const rejectionMessage = user.rejectionReason 
            ? `تم رفض حسابك. السبب: ${user.rejectionReason}`
            : 'تم رفض حسابك. يرجى التواصل مع الإدارة';
        return sendError(res, rejectionMessage, 403);
    }

    if (user.status === 'suspended') {
        return sendError(res, 'تم تعليق حسابك. يرجى التواصل مع الإدارة', 403);
    }

    // Check email verification for labs
    if (user.role === 'lab' && !user.isEmailVerified) {
        return sendError(res, 'يرجى تأكيد بريدك الإلكتروني أولاً', 403);
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Get lab details if user is a lab
    let labDetails = null;
    if (user.role === 'lab') {
        labDetails = await Lab.findOne({ user: user._id });
    }

    sendTokenResponse(user, 200, res, labDetails);
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    sendSuccess(res, 'تم تسجيل الخروج بنجاح');
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    let labDetails = null;
    if (user.role === 'lab') {
        labDetails = await Lab.findOne({ user: user._id });
    }

    sendSuccess(res, 'تم جلب بيانات المستخدم بنجاح', {
        user,
        lab: labDetails
    });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    sendSuccess(res, 'تم تحديث البيانات بنجاح', user);
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return sendError(res, 'كلمة المرور الحالية غير صحيحة', 401);
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return sendError(res, 'لا يوجد مستخدم بهذا البريد الإلكتروني', 404);
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    try {
        await emailService.sendPasswordResetEmail(user, resetToken);
        sendSuccess(res, 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    } catch (err) {
        console.error(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return sendError(res, 'حدث خطأ في إرسال البريد الإلكتروني', 500);
    }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return sendError(res, 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية', 400);
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/v1/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const emailVerificationToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken,
        emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
        return sendError(res, 'رابط التحقق غير صالح أو منتهي الصلاحية', 400);
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    sendSuccess(res, 'تم تأكيد البريد الإلكتروني بنجاح');
});

// @desc    Resend verification email
// @route   POST /api/v1/auth/resendverification
// @access  Private
exports.resendVerificationEmail = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
        return sendError(res, 'البريد الإلكتروني مُحقق بالفعل', 400);
    }

    // Generate new verification token
    const verifyToken = user.getEmailVerificationToken();
    await user.save();

    try {
        await emailService.sendWelcomeEmail(user, verifyToken);
        sendSuccess(res, 'تم إرسال رابط التحقق إلى بريدك الإلكتروني');
    } catch (err) {
        console.error(err);
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        return sendError(res, 'حدث خطأ في إرسال البريد الإلكتروني', 500);
    }
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, labDetails = null) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                isEmailVerified: user.isEmailVerified
            },
            lab: labDetails
        });
};