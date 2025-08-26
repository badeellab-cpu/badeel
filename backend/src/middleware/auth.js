const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'غير مصرح لك بالوصول إلى هذا المورد'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'المستخدم غير موجود'
            });
        }

        // Check if user is active
        if (req.user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                error: 'تم تعليق حسابك، يرجى التواصل مع الإدارة'
            });
        }

        // Check if email is verified for labs
        if (req.user.role === 'lab' && !req.user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                error: 'يرجى تأكيد بريدك الإلكتروني أولاً'
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: 'غير مصرح لك بالوصول إلى هذا المورد'
        });
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `دور المستخدم (${req.user.role}) غير مصرح له بالوصول إلى هذا المورد`
            });
        }
        next();
    };
};

// Check if lab is approved
exports.checkLabApproval = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'lab' && req.user.status !== 'approved') {
        return res.status(403).json({
            success: false,
            error: 'يجب أن يتم اعتماد حسابك من قبل الإدارة أولاً'
        });
    }
    next();
});

// Optional authentication - doesn't fail if no token
exports.optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (err) {
            // Token is invalid, but we don't fail the request
            req.user = null;
        }
    }

    next();
});