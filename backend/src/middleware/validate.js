const { validationResult } = require('express-validator');

// Validation error handler
exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));

        return res.status(400).json({
            success: false,
            error: 'بيانات غير صحيحة',
            errors: extractedErrors
        });
    }
    
    next();
};

// Custom validators
exports.customValidators = {
    // Saudi phone number validator
    isSaudiPhone: (value) => {
        const saudiPhoneRegex = /^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
        return saudiPhoneRegex.test(value);
    },

    // Saudi commercial registration validator
    isCommercialRegistration: (value) => {
        // Simple check for now - can be enhanced
        return /^\d{10}$/.test(value);
    },

    // Password strength validator
    isStrongPassword: (value) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(value);
    },

    // Arabic text validator
    isArabicText: (value) => {
        // Allow Arabic letters, numbers, spaces, and common punctuation
        const arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\s0-9.,!?()-]+$/;
        return arabicRegex.test(value);
    },

    // File extension validator
    hasValidExtension: (filename, extensions) => {
        const ext = filename.split('.').pop().toLowerCase();
        return extensions.includes(ext);
    }
};

// Sanitization helpers
exports.sanitizers = {
    // Sanitize Saudi phone number
    sanitizeSaudiPhone: (value) => {
        // Remove country code if present
        let phone = value.replace(/^\+966/, '');
        phone = phone.replace(/^966/, '');
        
        // Add 0 if not present
        if (!phone.startsWith('0')) {
            phone = '0' + phone;
        }
        
        // Remove any non-numeric characters
        return phone.replace(/\D/g, '');
    },

    // Sanitize Arabic text
    sanitizeArabicText: (value) => {
        // Remove any potentially harmful characters while preserving Arabic text
        return value.trim().replace(/<[^>]*>?/gm, '');
    }
};