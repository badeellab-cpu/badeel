const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getMyOrders,
    getOrdersAsSeller,
    getOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderStatistics
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
    createOrderValidation,
    updateOrderStatusValidation,
    cancelOrderValidation,
    orderQueryValidation,
    orderStatisticsValidation,
    orderIdValidation
} = require('../validators/orderValidators');

// Protected routes
router.use(protect);

// Lab routes
router.get('/my-orders', 
    authorize('lab'), 
    orderQueryValidation, 
    handleValidationErrors, 
    getMyOrders
);

router.get('/as-seller', 
    authorize('lab'), 
    orderQueryValidation, 
    handleValidationErrors, 
    getOrdersAsSeller
);

router.post('/', 
    authorize('lab'),
    createOrderValidation,
    handleValidationErrors,
    createOrder
);

router.put('/:id/cancel', 
    cancelOrderValidation,
    handleValidationErrors,
    cancelOrder
);

// Order management routes
router.get('/:id', 
    orderIdValidation, 
    handleValidationErrors, 
    getOrder
);

router.put('/:id/status', 
    updateOrderStatusValidation,
    handleValidationErrors,
    updateOrderStatus
);

// Admin routes
router.get('/', 
    authorize('admin'), 
    orderQueryValidation, 
    handleValidationErrors, 
    getAllOrders
);

router.get('/statistics', 
    authorize('admin'), 
    orderStatisticsValidation, 
    handleValidationErrors, 
    getOrderStatistics
);

module.exports = router;