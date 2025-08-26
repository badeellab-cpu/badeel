module.exports = {
    // Server Configuration
    server: {
        port: process.env.PORT || 5000,
        env: process.env.NODE_ENV || 'development',
        apiVersion: process.env.API_VERSION || 'v1'
    },

    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/badeel_platform',
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expire: process.env.JWT_EXPIRE || '30d',
        cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 30
    },

    // Email Configuration
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM || 'Badeel Platform <noreply@badeel.com>',
        secure: false
    },

    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 10 * 1024 * 1024, // 10MB
        uploadPath: process.env.FILE_UPLOAD_PATH || './uploads',
        allowedImageTypes: /jpeg|jpg|png|webp/,
        allowedDocTypes: /pdf|doc|docx/,
        allowedFileTypes: /jpeg|jpg|png|webp|pdf|doc|docx|xls|xlsx/
    },

    // Security Configuration
    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret'
    },

    // Frontend Configuration
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        passwordResetUrl: '/reset-password',
        emailVerificationUrl: '/verify-email'
    },

    // Admin Configuration
    admin: {
        defaultEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@badeel.com',
        defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456'
    },

    // Payment Configuration
    payment: {
        currency: 'SAR',
        taxRate: 15, // 15% VAT in Saudi Arabia
        platformFeePercentage: 2.5, // Platform commission
        minimumWithdrawal: 100,
        maximumWithdrawal: 50000,
        // Moyasar Configuration
        moyasar: {
            publicKey: process.env.MOYASAR_PUBLIC_KEY || 'pk_test_jMJ9G9hod66VrmMqBjPv5GQxZX5d6LW8MKerNuYh',
            secretKey: process.env.MOYASAR_SECRET_KEY || 'sk_test_Nog5Vyz4ovEjv1dU95Qw4tpdGdp6bk2jCmzDciZA',
            apiUrl: process.env.MOYASAR_API_URL || 'https://api.moyasar.com/v1',
            webhookSecret: process.env.MOYASAR_WEBHOOK_SECRET || 'your-webhook-secret'
        }
    },

    // Business Rules
    business: {
        exchangeRequestExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
        orderCancellationWindow: 24 * 60 * 60 * 1000, // 24 hours
        refundPeriod: 30, // days
        productApprovalRequired: true,
        labApprovalRequired: true
    },

    // AWS Configuration (for future use)
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'me-south-1',
        s3Bucket: process.env.AWS_S3_BUCKET
    },

    // SMS Configuration (for future use)
    sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        accountSid: process.env.SMS_ACCOUNT_SID,
        authToken: process.env.SMS_AUTH_TOKEN,
        fromNumber: process.env.SMS_FROM_NUMBER
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log'
    }
};