const notFound = (req, res, next) => {
    const error = new Error(`غير موجود - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = notFound;