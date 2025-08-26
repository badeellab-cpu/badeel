const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSystemAnalytics,
    getRevenueAnalytics,
    getUserAnalytics,
    getSystemHealth,
    getConfirmedOrders,
    updateOrderShipping,
    updateExchangeDelivery,
    updateAcceptedExchangeRequestShipping
} = require('../controllers/adminController');
const { getProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { query } = require('express-validator');

// Validation for analytics queries
const analyticsQueryValidation = [
    query('period')
        .optional()
        .isIn(['today', 'week', 'month', 'year'])
        .withMessage('الفترة يجب أن تكون: today, week, month, أو year'),
    query('granularity')
        .optional()
        .isIn(['hour', 'day', 'week', 'month'])
        .withMessage('الدقة يجب أن تكون: hour, day, week, أو month')
];

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// Dashboard and statistics routes
router.get('/dashboard', 
    analyticsQueryValidation, 
    handleValidationErrors, 
    getDashboardStats
);

router.get('/analytics', 
    analyticsQueryValidation, 
    handleValidationErrors, 
    getSystemAnalytics
);

router.get('/revenue-analytics', 
    analyticsQueryValidation, 
    handleValidationErrors, 
    getRevenueAnalytics
);

router.get('/user-analytics', 
    analyticsQueryValidation, 
    handleValidationErrors, 
    getUserAnalytics
);

router.get('/system-health', 
    getSystemHealth
);

// Products management route (admin can see all products)
router.get('/products', getProducts);

// Confirmed orders management routes
router.get('/confirmed-orders', 
    analyticsQueryValidation, 
    handleValidationErrors, 
    getConfirmedOrders
);

router.put('/orders/:id/shipping', updateOrderShipping);
router.put('/exchanges/:id/delivery', updateExchangeDelivery);
router.put('/exchange-requests/:id/shipping', updateAcceptedExchangeRequestShipping);

module.exports = router;