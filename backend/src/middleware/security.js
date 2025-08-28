const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Skip successful requests
        skipSuccessfulRequests: true,
        // Skip requests from localhost in development
        skip: (req) => {
            return process.env.NODE_ENV === 'development';
        }
    });
};

// General API rate limiting
exports.generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'تم تجاوز عدد الطلبات المسموح. يرجى المحاولة مرة أخرى بعد 15 دقيقة'
);

// Strict rate limiting for auth endpoints
exports.authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 requests per windowMs
    'تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة مرة أخرى بعد 15 دقيقة'
);

// File upload rate limiting
exports.uploadLimiter = createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // limit each IP to 10 uploads per hour
    'تم تجاوز عدد الملفات المرفوعة المسموح. يرجى المحاولة مرة أخرى بعد ساعة'
);

// Password reset rate limiting
exports.passwordResetLimiter = createRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // limit each IP to 3 password reset requests per hour
    'تم تجاوز عدد طلبات إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى بعد ساعة'
);

// Email verification rate limiting
exports.emailVerificationLimiter = createRateLimit(
    60 * 60 * 1000, // 1 hour
    5, // limit each IP to 5 email verification requests per hour
    'تم تجاوز عدد طلبات تأكيد البريد الإلكتروني. يرجى المحاولة مرة أخرى بعد ساعة'
);

// Helmet configuration for security headers
exports.securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for file uploads
    // Allow resources (like images from /uploads) to be embedded cross-origin (e.g., frontend on port 3000)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// MongoDB injection protection (manual implementation)
exports.mongoSanitize = (req, res, next) => {
    // Remove any keys that start with '$' or contain '.'
    const sanitize = (obj) => {
        if (obj && typeof obj === 'object') {
            for (let key in obj) {
                if (key.startsWith('$') || key.includes('.')) {
                    delete obj[key];
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            }
        }
    };
    
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    
    next();
};

// XSS protection (manual implementation)
exports.xssClean = (req, res, next) => {
    const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+=/gi,
        /<[^>]*>/g
    ];
    
    const cleanString = (str) => {
        if (typeof str === 'string') {
            xssPatterns.forEach(pattern => {
                str = str.replace(pattern, '');
            });
        }
        return str;
    };
    
    const cleanObject = (obj) => {
        if (obj && typeof obj === 'object') {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = cleanString(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    cleanObject(obj[key]);
                }
            }
        }
    };
    
    if (req.body) cleanObject(req.body);
    if (req.query) cleanObject(req.query);
    if (req.params) cleanObject(req.params);
    
    next();
};

// HTTP Parameter Pollution protection
exports.hppProtection = (req, res, next) => {
    const whitelist = [
        'sort',
        'fields',
        'page',
        'limit',
        'category',
        'type',
        'status',
        'condition',
        'tags'
    ];
    
    // Ensure query parameters are not arrays (except whitelisted ones)
    if (req.query) {
        for (let key in req.query) {
            if (Array.isArray(req.query[key]) && !whitelist.includes(key)) {
                req.query[key] = req.query[key][req.query[key].length - 1];
            }
        }
    }
    
    next();
};

// Custom security middleware
exports.securityMiddleware = (req, res, next) => {
    // Remove potentially dangerous headers
    delete req.headers['x-forwarded-host'];
    delete req.headers['x-forwarded-server'];
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Remove server signature
    res.removeHeader('X-Powered-By');
    
    next();
};

// API key validation middleware (if using API keys)
exports.validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    // Skip API key validation in development
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'مفتاح API مطلوب'
        });
    }
    
    // Validate API key against database or environment
    const validApiKey = process.env.API_KEY;
    if (apiKey !== validApiKey) {
        return res.status(401).json({
            success: false,
            error: 'مفتاح API غير صحيح'
        });
    }
    
    next();
};

// IP whitelist middleware (for admin operations)
exports.ipWhitelist = (whitelist = []) => {
    return (req, res, next) => {
        // Skip in development
        if (process.env.NODE_ENV === 'development') {
            return next();
        }
        
        const clientIp = req.ip || req.connection.remoteAddress;
        
        if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
            return res.status(403).json({
                success: false,
                error: 'غير مسموح لك بالوصول من هذا العنوان'
            });
        }
        
        next();
    };
};

// Request size limiting middleware
exports.requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length']);
        const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
        
        if (contentLength > maxSizeBytes) {
            return res.status(413).json({
                success: false,
                error: `حجم الطلب كبير جداً. الحد الأقصى ${maxSize}`
            });
        }
        
        next();
    };
};

// Suspicious activity detection
exports.suspiciousActivityDetector = (req, res, next) => {
    // Skip in development mode OR for localhost requests
    if (process.env.NODE_ENV === 'development' || 
        req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === 'localhost') {
        return next();
    }
    
    const suspiciousPatterns = [
        // SQL injection patterns
        /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
        // Script injection patterns
        /<script[^>]*>.*?<\/script>/i,
        // Path traversal patterns
        /\.\.(\/|\\)/,
        // Command injection patterns
        /[;&|`$]/
    ];
    
    const checkString = (str) => {
        return suspiciousPatterns.some(pattern => pattern.test(str));
    };
    
    // Check URL, query parameters, and body
    const urlSuspicious = checkString(req.url);
    const queryStringSuspicious = Object.values(req.query || {}).some(value => 
        typeof value === 'string' && checkString(value)
    );
    const bodySuspicious = req.body && typeof req.body === 'object' && 
        JSON.stringify(req.body).match(/[<>'"`;]/);
    
    if (urlSuspicious || queryStringSuspicious || bodySuspicious) {
        console.warn(`Suspicious activity detected from IP ${req.ip}: ${req.url}`);
        
        return res.status(400).json({
            success: false,
            error: 'تم اكتشاف نشاط مشبوه'
        });
    }
    
    next();
};

// CORS configuration
exports.corsOptions = {
    origin: function (origin, callback) {
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('غير مسموح بواسطة CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key'
    ]
};