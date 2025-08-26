const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    if (process.env.NODE_ENV === 'development') {
        console.log(err.stack);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'المورد غير موجود';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} مستخدم بالفعل`;
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'رمز المصادقة غير صالح';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'انتهت صلاحية رمز المصادقة';
        error = { message, statusCode: 401 };
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'حجم الملف كبير جداً';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        const message = 'عدد الملفات كبير جداً';
        error = { message, statusCode: 400 };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'حقل الملف غير متوقع';
        error = { message, statusCode: 400 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'خطأ في الخادم',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;