const { body, param, query } = require('express-validator');

// Validation for creating product
exports.createProductValidation = [
    body('name')
        .notEmpty()
        .withMessage('اسم المنتج مطلوب')
        .isLength({ min: 3, max: 200 })
        .withMessage('اسم المنتج يجب أن يكون بين 3 و 200 حرف')
        .trim(),
    body('description')
        .notEmpty()
        .withMessage('وصف المنتج مطلوب')
        .isLength({ min: 10, max: 2000 })
        .withMessage('وصف المنتج يجب أن يكون بين 10 و 2000 حرف')
        .trim(),
    body('type')
        .notEmpty()
        .withMessage('نوع المنتج مطلوب')
        .isIn(['sale', 'exchange', 'asset'])
        .withMessage('نوع المنتج يجب أن يكون: sale, exchange, أو asset'),
    body('category')
        .notEmpty()
        .withMessage('فئة المنتج مطلوبة')
        .isMongoId()
        .withMessage('معرف الفئة غير صحيح'),
    body('price')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('السعر يجب أن يكون رقم موجب'),
    body('currency')
        .optional()
        .isIn(['SAR', 'USD', 'EUR'])
        .withMessage('العملة يجب أن تكون SAR, USD, أو EUR'),
    body('quantity')
        .notEmpty()
        .withMessage('الكمية مطلوبة')
        .isInt({ min: 1 })
        .withMessage('الكمية يجب أن تكون رقم صحيح موجب'),
    body('unit')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('وحدة القياس يجب أن تكون بين 1 و 50 حرف'),
    body('sku')
        .optional()
        .isLength({ max: 100 })
        .withMessage('رمز المنتج لا يمكن أن يتجاوز 100 حرف'),
    body('barcode')
        .optional()
        .isLength({ max: 50 })
        .withMessage('الباركود لا يمكن أن يتجاوز 50 حرف'),
    body('specifications')
        .optional()
        .isArray()
        .withMessage('المواصفات يجب أن تكون مصفوفة'),
    body('specifications.*.name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم المواصفة يجب أن يكون بين 2 و 100 حرف'),
    body('specifications.*.value')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('قيمة المواصفة يجب أن تكون بين 1 و 200 حرف'),
    body('condition')
        .optional()
        .isIn(['new', 'like_new', 'like-new', 'good', 'fair', 'poor'])
        .withMessage('حالة المنتج يجب أن تكون: new, like_new, like-new, good, fair, أو poor'),
    body('brand')
        .optional()
        .isLength({ max: 100 })
        .withMessage('العلامة التجارية لا يمكن أن تتجاوز 100 حرف'),
    body('model')
        .optional()
        .isLength({ max: 100 })
        .withMessage('الموديل لا يمكن أن يتجاوز 100 حرف'),
    body('manufacturerCountry')
        .optional()
        .isLength({ max: 100 })
        .withMessage('بلد الصنع لا يمكن أن يتجاوز 100 حرف'),
    body('manufacturingDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ الصنع غير صحيح'),
    body('expiryDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ انتهاء الصلاحية غير صحيح')
        .custom((value, { req }) => {
            if (value && req.body.manufacturingDate) {
                const manufacturingDate = new Date(req.body.manufacturingDate);
                const expiryDate = new Date(value);
                if (expiryDate <= manufacturingDate) {
                    throw new Error('تاريخ انتهاء الصلاحية يجب أن يكون بعد تاريخ الصنع');
                }
            }
            return true;
        }),
    body('warranty.available')
        .optional()
        .isBoolean()
        .withMessage('حالة الضمان يجب أن تكون true أو false'),
    body('warranty.duration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('مدة الضمان يجب أن تكون رقم موجب'),
    body('warranty.type')
        .optional()
        .isIn(['manufacturer', 'seller', 'extended'])
        .withMessage('نوع الضمان يجب أن يكون: manufacturer, seller, أو extended'),

    body('exchangePreferences.acceptedCategories')
        .optional()
        .isArray()
        .withMessage('الفئات المقبولة للتبادل يجب أن تكون مصفوفة'),
    body('exchangePreferences.acceptedConditions')
        .optional()
        .isArray()
        .withMessage('الحالات المقبولة للتبادل يجب أن تكون مصفوفة'),
    body('exchangePreferences.preferredBrands')
        .optional()
        .isArray()
        .withMessage('العلامات التجارية المفضلة يجب أن تكون مصفوفة'),
    body('exchangePreferences.autoAccept')
        .optional()
        .isBoolean()
        .withMessage('القبول التلقائي يجب أن يكون true أو false'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('العلامات يجب أن تكون مصفوفة'),
    body('tags.*')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('العلامة يجب أن تكون بين 2 و 50 حرف')
];

// Custom validation for type-specific requirements
exports.validateProductType = [
    body().custom((value, { req }) => {
        const { type, price, exchangePreferences } = req.body;
        
        if (type === 'sale') {
            if (!price || price <= 0) {
                throw new Error('السعر مطلوب ويجب أن يكون أكبر من 0 للمنتجات المعروضة للبيع');
            }
        }
        
        // Exchange products don't require categories to be specified initially
        // Lab can accept any exchange offers later
        if (type === 'exchange') {
            // Optional validation - can be added later
        }
        
        return true;
    })
];

// Validation for updating product
exports.updateProductValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('description')
        .optional()
        .isLength({ min: 10, max: 2000 })
        .withMessage('وصف المنتج يجب أن يكون بين 10 و 2000 حرف')
        .trim(),
    body('price')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('السعر يجب أن يكون رقم موجب'),
    body('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('الكمية يجب أن تكون رقم صحيح موجب أو صفر'),
    body('specifications')
        .optional()
        .isArray()
        .withMessage('المواصفات يجب أن تكون مصفوفة'),
    body('condition')
        .optional()
        .isIn(['new', 'like_new', 'like-new', 'good', 'fair', 'poor'])
        .withMessage('حالة المنتج يجب أن تكون: new, like_new, like-new, good, fair, أو poor'),
    body('warranty.available')
        .optional()
        .isBoolean()
        .withMessage('حالة الضمان يجب أن تكون true أو false'),

    body('exchangePreferences')
        .optional()
        .custom((val) => {
            if (typeof val === 'string') {
                try { JSON.parse(val); return true; } catch { return false; }
            }
            return typeof val === 'object';
        })
        .withMessage('تفضيلات التبادل يجب أن تكون كائن'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('العلامات يجب أن تكون مصفوفة')
];

// Validation for product approval/rejection
exports.approveRejectProductValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('reason')
        .optional()
        .isLength({ min: 10, max: 500 })
        .withMessage('السبب يجب أن يكون بين 10 و 500 حرف')
        .trim()
];

// Validation for rejecting product (reason is required)
exports.rejectProductValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('reason')
        .notEmpty()
        .withMessage('سبب الرفض مطلوب')
        .isLength({ min: 10, max: 500 })
        .withMessage('سبب الرفض يجب أن يكون بين 10 و 500 حرف')
        .trim()
];

// Validation for product query parameters
exports.productQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 50'),
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('البحث يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    query('category')
        .optional()
        .isMongoId()
        .withMessage('معرف الفئة غير صحيح'),
    query('type')
        .optional()
        .isIn(['sale', 'exchange', 'asset'])
        .withMessage('نوع المنتج يجب أن يكون: sale, exchange, أو asset'),
    query('condition')
        .optional()
        .isIn(['new', 'like_new', 'good', 'fair', 'poor'])
        .withMessage('حالة المنتج يجب أن تكون: new, like_new, good, fair, أو poor'),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأدنى للسعر يجب أن يكون رقم موجب'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأعلى للسعر يجب أن يكون رقم موجب')
        .custom((value, { req }) => {
            if (value && req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
                throw new Error('الحد الأعلى للسعر يجب أن يكون أكبر من الحد الأدنى');
            }
            return true;
        }),
    query('location')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('الموقع يجب أن يكون بين 2 و 100 حرف'),
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'price', 'rating', 'popular', 'name'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc'),
    query('lab')
        .optional()
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح'),
    query('status')
        .optional()
        .isIn(['active', 'inactive', 'pending', 'suspended', 'all'])
        .withMessage('حالة المنتج غير صحيحة'),
    query('approvalStatus')
        .optional()
        .isIn(['pending', 'approved', 'rejected', 'all'])
        .withMessage('حالة الموافقة غير صحيحة')
];

// Validation for product ID parameter
exports.productIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح')
];

// Validation for product slug parameter
exports.productSlugValidation = [
    param('slug')
        .notEmpty()
        .withMessage('رابط المنتج مطلوب')
        .isLength({ min: 2, max: 200 })
        .withMessage('رابط المنتج يجب أن يكون بين 2 و 200 حرف')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('رابط المنتج غير صحيح')
];

// Validation for trending products
exports.trendingProductsValidation = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('عدد المنتجات الرائجة يجب أن يكون بين 1 و 20')
];