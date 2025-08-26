const express = require('express');
const router = express.Router();
const {
    advancedSearch,
    getSearchSuggestions,
    getPopularSearches
} = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { query } = require('express-validator');

// Validation for search queries
const searchValidation = [
    query('q')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('البحث يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم موجب'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('عدد العناصر في الصفحة يجب أن يكون بين 1 و 50'),
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
        .withMessage('حالة المنتج غير صحيحة'),
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
    query('brand')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('العلامة التجارية يجب أن تكون بين 2 و 50 حرف'),
    query('model')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('الموديل يجب أن يكون بين 2 و 50 حرف'),
    query('location')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('الموقع يجب أن يكون بين 2 و 50 حرف'),
    query('lab')
        .optional()
        .isMongoId()
        .withMessage('معرف المختبر غير صحيح'),
    query('sortBy')
        .optional()
        .isIn(['relevance', 'price', 'rating', 'newest', 'oldest', 'popular', 'name'])
        .withMessage('ترتيب غير صحيح'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc'),
    query('includeInactive')
        .optional()
        .isBoolean()
        .withMessage('تضمين المنتجات غير النشطة يجب أن يكون true أو false')
];

// Validation for suggestions
const suggestionsValidation = [
    query('q')
        .notEmpty()
        .withMessage('البحث مطلوب')
        .isLength({ min: 2, max: 100 })
        .withMessage('البحث يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('عدد الاقتراحات يجب أن يكون بين 1 و 20')
];

// Validation for popular searches
const popularSearchesValidation = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('عدد البحثات الشائعة يجب أن يكون بين 1 و 20')
];

// Routes
router.get('/', 
    optionalAuth,
    searchValidation, 
    handleValidationErrors, 
    advancedSearch
);

router.get('/suggestions', 
    suggestionsValidation, 
    handleValidationErrors, 
    getSearchSuggestions
);

router.get('/popular', 
    popularSearchesValidation, 
    handleValidationErrors, 
    getPopularSearches
);

module.exports = router;