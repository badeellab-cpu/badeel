const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    approveProduct,
    rejectProduct,
    getMyProducts,
    getTrendingProducts,
    toggleFavorite,
    getProductStatistics
} = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { uploadProductImages } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/security');
const {
    createProductValidation,
    validateProductType,
    updateProductValidation,
    approveRejectProductValidation,
    rejectProductValidation,
    productQueryValidation,
    productIdValidation,
    productSlugValidation,
    trendingProductsValidation
} = require('../validators/productValidators');

// Public routes
router.get('/', 
    productQueryValidation, 
    handleValidationErrors, 
    optionalAuth,
    getProducts
);

router.get('/trending', 
    trendingProductsValidation, 
    handleValidationErrors, 
    getTrendingProducts
);

router.get('/slug/:slug', 
    productSlugValidation, 
    handleValidationErrors, 
    optionalAuth,
    getProductBySlug
);

// Place lab "my-products" route before ":id" to avoid being shadowed
router.get('/my-products', 
    protect,
    authorize('lab'), 
    productQueryValidation, 
    handleValidationErrors, 
    getMyProducts
);

router.get('/:id', 
    productIdValidation, 
    handleValidationErrors, 
    optionalAuth,
    getProduct
);

// Protected routes for the rest
router.use(protect);

router.post('/', 
    authorize('lab', 'admin'),
    uploadLimiter,
    uploadProductImages,
    createProductValidation,
    validateProductType,
    handleValidationErrors,
    createProduct
);

router.put('/:id', 
    authorize('lab', 'admin'),
    uploadLimiter,
    uploadProductImages,
    updateProductValidation,
    handleValidationErrors,
    updateProduct
);

router.delete('/:id', 
    productIdValidation, 
    handleValidationErrors, 
    deleteProduct
);

// Product interactions
router.post('/:id/favorite', 
    productIdValidation, 
    handleValidationErrors, 
    toggleFavorite
);

router.get('/:id/statistics', 
    productIdValidation, 
    handleValidationErrors, 
    getProductStatistics
);

// Admin routes
router.put('/:id/approve', 
    authorize('admin'),
    approveRejectProductValidation,
    handleValidationErrors,
    approveProduct
);

router.put('/:id/reject', 
    authorize('admin'),
    rejectProductValidation,
    handleValidationErrors,
    rejectProduct
);

module.exports = router;