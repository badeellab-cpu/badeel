const { body, param, query } = require('express-validator');

// Validation for creating category (multi-language fields)
exports.createCategoryValidation = [
    body('name.ar')
        .notEmpty()
        .withMessage('اسم الفئة بالعربية مطلوب')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم الفئة بالعربية يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    body('name.en')
        .notEmpty()
        .withMessage('اسم الفئة بالإنجليزية مطلوب')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم الفئة بالإنجليزية يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    body('description.ar')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف بالعربية لا يمكن أن يتجاوز 500 حرف')
        .trim(),
    body('description.en')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف بالإنجليزية لا يمكن أن يتجاوز 500 حرف')
        .trim(),
    body('parent')
        .optional()
        .custom((value) => {
            if (value === null || value === '') return true;
            if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) return true;
            throw new Error('معرف الفئة الأب غير صحيح');
        }),
    body('image')
        .optional()
        .isURL()
        .withMessage('رابط الصورة غير صحيح'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('ترتيب الفئة يجب أن يكون رقم موجب'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('حالة التفعيل يجب أن تكون true أو false'),
    body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('حالة الإبراز يجب أن تكون true أو false'),
    body('attributes')
        .optional()
        .isArray()
        .withMessage('خصائص الفئة يجب أن تكون مصفوفة'),
    body('attributes.*.name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('اسم الخاصية يجب أن يكون بين 2 و 50 حرف'),
    body('attributes.*.type')
        .optional()
        .isIn(['text', 'number', 'select', 'multiselect', 'boolean', 'date'])
        .withMessage('نوع الخاصية غير صحيح'),
    body('attributes.*.required')
        .optional()
        .isBoolean()
        .withMessage('حالة الإلزام للخاصية يجب أن تكون true أو false'),
    body('seo.title')
        .optional()
        .isLength({ max: 60 })
        .withMessage('عنوان SEO لا يمكن أن يتجاوز 60 حرف'),
    body('seo.description')
        .optional()
        .isLength({ max: 160 })
        .withMessage('وصف SEO لا يمكن أن يتجاوز 160 حرف'),
    body('seo.keywords')
        .optional()
        .isArray()
        .withMessage('كلمات SEO المفتاحية يجب أن تكون مصفوفة')
];

// Validation for updating category (multi-language fields)
exports.updateCategoryValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف الفئة غير صحيح'),
    body('name.ar')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم الفئة بالعربية يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    body('name.en')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم الفئة بالإنجليزية يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    body('description.ar')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف بالعربية لا يمكن أن يتجاوز 500 حرف')
        .trim(),
    body('description.en')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف بالإنجليزية لا يمكن أن يتجاوز 500 حرف')
        .trim(),
    body('parent')
        .optional()
        .custom((value) => {
            if (value === null || value === '') return true;
            if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) return true;
            throw new Error('معرف الفئة الأب غير صحيح');
        }),
    body('image')
        .optional()
        .custom((value) => {
            if (value === null || value === '') return true;
            if (typeof value === 'string' && value.match(/^https?:\/\/.+/)) return true;
            throw new Error('رابط الصورة غير صحيح');
        }),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('ترتيب الفئة يجب أن يكون رقم موجب'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('حالة التفعيل يجب أن تكون true أو false'),
    body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('حالة الإبراز يجب أن تكون true أو false'),
    body('attributes')
        .optional()
        .isArray()
        .withMessage('خصائص الفئة يجب أن تكون مصفوفة'),
    body('seo.title')
        .optional()
        .isLength({ max: 60 })
        .withMessage('عنوان SEO لا يمكن أن يتجاوز 60 حرف'),
    body('seo.description')
        .optional()
        .isLength({ max: 160 })
        .withMessage('وصف SEO لا يمكن أن يتجاوز 160 حرف')
];

// Validation for category query parameters
exports.categoryQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 100'),
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('البحث يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    query('parent')
        .optional()
        .custom((value) => {
            if (value === 'null' || value === '') return true;
            if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) return true;
            throw new Error('معرف الفئة الأب غير صحيح');
        }),
    query('isActive')
        .optional()
        .isIn(['true', 'false', 'all', 'undefined', ''])
        .withMessage('حالة التفعيل يجب أن تكون true أو false'),
    query('isFeatured')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('حالة الإبراز يجب أن تكون true أو false'),
    query('sortBy')
        .optional()
        .isIn(['name', 'order', 'createdAt', 'updatedAt'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc'),
    query('includeProducts')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('تضمين المنتجات يجب أن يكون true أو false'),
    query('productLimit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('عدد المنتجات يجب أن يكون بين 1 و 50')
];

// Validation for category ID parameter
exports.categoryIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف الفئة غير صحيح')
];

// Validation for category slug parameter
exports.categorySlugValidation = [
    param('slug')
        .notEmpty()
        .withMessage('رابط الفئة مطلوب')
        .isLength({ min: 2, max: 100 })
        .withMessage('رابط الفئة يجب أن يكون بين 2 و 100 حرف')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('رابط الفئة غير صحيح')
];

// Validation for reordering categories
exports.reorderCategoriesValidation = [
    body('categoryOrders')
        .isArray({ min: 1 })
        .withMessage('يرجى تقديم مصفوفة من ترتيب الفئات'),
    body('categoryOrders.*.id')
        .isMongoId()
        .withMessage('معرف الفئة غير صحيح'),
    body('categoryOrders.*.order')
        .isInt({ min: 0 })
        .withMessage('ترتيب الفئة يجب أن يكون رقم موجب')
];

// Validation for featured categories
exports.featuredCategoriesValidation = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('عدد الفئات المميزة يجب أن يكون بين 1 و 20')
];