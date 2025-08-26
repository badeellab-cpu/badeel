// Standardized API response helper

class ApiResponse {
    constructor(success, message, data = null, statusCode = 200) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
    }

    static success(message = 'تمت العملية بنجاح', data = null, statusCode = 200) {
        return new ApiResponse(true, message, data, statusCode);
    }

    static error(message = 'حدث خطأ', data = null, statusCode = 400) {
        return new ApiResponse(false, message, data, statusCode);
    }

    static created(message = 'تم الإنشاء بنجاح', data = null) {
        return new ApiResponse(true, message, data, 201);
    }

    static updated(message = 'تم التحديث بنجاح', data = null) {
        return new ApiResponse(true, message, data, 200);
    }

    static deleted(message = 'تم الحذف بنجاح', data = null) {
        return new ApiResponse(true, message, data, 200);
    }

    static unauthorized(message = 'غير مصرح') {
        return new ApiResponse(false, message, null, 401);
    }

    static forbidden(message = 'ممنوع') {
        return new ApiResponse(false, message, null, 403);
    }

    static notFound(message = 'غير موجود') {
        return new ApiResponse(false, message, null, 404);
    }

    static validationError(errors) {
        return new ApiResponse(false, 'خطأ في التحقق من البيانات', { errors }, 422);
    }

    static serverError(message = 'خطأ في الخادم') {
        return new ApiResponse(false, message, null, 500);
    }

    send(res) {
        return res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            data: this.data,
            timestamp: this.timestamp
        });
    }
}

// Helper functions for common responses
const sendSuccess = (res, message, data, statusCode = 200) => {
    return ApiResponse.success(message, data, statusCode).send(res);
};

const sendError = (res, message, statusCode = 400, data = null) => {
    return ApiResponse.error(message, data, statusCode).send(res);
};

const sendCreated = (res, message, data) => {
    return ApiResponse.created(message, data).send(res);
};

const sendUpdated = (res, message, data) => {
    return ApiResponse.updated(message, data).send(res);
};

const sendDeleted = (res, message) => {
    return ApiResponse.deleted(message).send(res);
};

const sendUnauthorized = (res, message = 'غير مصرح') => {
    return ApiResponse.unauthorized(message).send(res);
};

const sendForbidden = (res, message = 'ممنوع') => {
    return ApiResponse.forbidden(message).send(res);
};

const sendNotFound = (res, message = 'غير موجود') => {
    return ApiResponse.notFound(message).send(res);
};

const sendValidationError = (res, errors) => {
    return ApiResponse.validationError(errors).send(res);
};

const sendServerError = (res, message = 'خطأ في الخادم') => {
    return ApiResponse.serverError(message).send(res);
};

module.exports = {
    ApiResponse,
    sendSuccess,
    sendError,
    sendCreated,
    sendUpdated,
    sendDeleted,
    sendUnauthorized,
    sendForbidden,
    sendNotFound,
    sendValidationError,
    sendServerError
};