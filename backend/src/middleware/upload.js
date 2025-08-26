const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Create storage engine
const createStorage = (folder) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, `uploads/${folder}`);
        },
        filename: function (req, file, cb) {
            // Generate unique filename
            const uniqueSuffix = crypto.randomBytes(16).toString('hex');
            const ext = path.extname(file.originalname);
            const filename = `${uniqueSuffix}${ext}`;
            cb(null, filename);
        }
    });
};

// Check file type
const checkFileType = (file, cb, allowedTypes) => {
    const filetypes = allowedTypes;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('نوع الملف غير مسموح'));
    }
};

// Lab registration files upload
exports.uploadLabFiles = multer({
    storage: createStorage('labs'),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 10 * 1024 * 1024, // 10MB
        files: 5
    },
    fileFilter: function (req, file, cb) {
        // Allow images and PDFs
        checkFileType(file, cb, /jpeg|jpg|png|pdf/);
    }
}).fields([
    { name: 'registrationFile', maxCount: 1 },
    { name: 'licenseFile', maxCount: 1 },
    { name: 'additionalFiles', maxCount: 3 }
]);

// Product images upload
exports.uploadProductImages = multer({
    storage: createStorage('products'),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10
    },
    fileFilter: function (req, file, cb) {
        // Allow only images
        checkFileType(file, cb, /jpeg|jpg|png|webp/);
    }
}).array('images', 10);

// Single image upload (for profile pictures, etc.)
exports.uploadSingleImage = multer({
    storage: createStorage('temp'),
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb, /jpeg|jpg|png/);
    }
}).single('image');

// Excel/CSV upload for bulk operations
exports.uploadSpreadsheet = multer({
    storage: createStorage('temp'),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb, /xlsx|xls|csv/);
    }
}).single('file');

// General file upload
exports.uploadFile = multer({
    storage: createStorage('temp'),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 10 * 1024 * 1024 // 10MB
    }
}).single('file');

// Error handling middleware for multer
exports.handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'حجم الملف كبير جداً'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'عدد الملفات كبير جداً'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'حقل الملف غير متوقع'
            });
        }
    }
    next(err);
};