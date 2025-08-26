const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategoryTree,
    getCategory,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    getFeaturedCategories,
    getCategoryStatistics,
    reorderCategories
} = require('../controllers/categoryController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
    createCategoryValidation,
    updateCategoryValidation,
    categoryQueryValidation,
    categoryIdValidation,
    categorySlugValidation,
    reorderCategoriesValidation,
    featuredCategoriesValidation
} = require('../validators/categoryValidators');

// Public routes
router.get('/', 
    categoryQueryValidation, 
    handleValidationErrors, 
    getCategories
);

router.get('/tree', getCategoryTree);

router.get('/featured', 
    featuredCategoriesValidation, 
    handleValidationErrors, 
    getFeaturedCategories
);

router.get('/slug/:slug', 
    categorySlugValidation, 
    categoryQueryValidation, 
    handleValidationErrors, 
    getCategoryBySlug
);

router.get('/:id', 
    categoryIdValidation, 
    categoryQueryValidation, 
    handleValidationErrors, 
    getCategory
);

// Protected routes (Admin only)
router.use(protect, authorize('admin'));

router.post('/', 
    createCategoryValidation, 
    handleValidationErrors, 
    createCategory
);

router.put('/:id', 
    updateCategoryValidation, 
    handleValidationErrors, 
    updateCategory
);

router.delete('/:id', 
    categoryIdValidation, 
    handleValidationErrors, 
    deleteCategory
);

router.put('/:id/toggle-status', 
    categoryIdValidation, 
    handleValidationErrors, 
    toggleCategoryStatus
);

router.get('/:id/statistics', 
    categoryIdValidation, 
    handleValidationErrors, 
    getCategoryStatistics
);

router.put('/reorder', 
    reorderCategoriesValidation, 
    handleValidationErrors, 
    reorderCategories
);

module.exports = router;