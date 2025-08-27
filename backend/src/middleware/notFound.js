const notFound = (req, res, next) => {
    // Skip favicon.ico requests to avoid flooding logs
    if (req.originalUrl === '/favicon.ico') {
        return res.status(204).end();
    }
    
    const error = new Error(`غير موجود - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = notFound;