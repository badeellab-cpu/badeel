const express = require('express');
const router = express.Router();
const {
    getAllExchanges,
    getMyExchangeRequests,
    getExchangesOnMyProducts,
    getExchange,
    createExchangeRequest,
    respondToExchange,
    updateExchangeStatus,
    getExchangeStatistics
} = require('../controllers/exchangeController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
    createExchangeValidation,
    respondToExchangeValidation,
    updateExchangeStatusValidation,
    exchangeQueryValidation,
    exchangeStatisticsValidation,
    exchangeIdValidation
} = require('../validators/exchangeValidators');

// Protected routes
router.use(protect);

// Lab routes
router.get('/my-requests', 
    authorize('lab'), 
    exchangeQueryValidation, 
    handleValidationErrors, 
    getMyExchangeRequests
);

router.get('/on-my-products', 
    authorize('lab'), 
    exchangeQueryValidation, 
    handleValidationErrors, 
    getExchangesOnMyProducts
);

router.post('/', 
    authorize('lab'),
    createExchangeValidation,
    handleValidationErrors,
    createExchangeRequest
);

router.put('/:id/respond', 
    authorize('lab'),
    respondToExchangeValidation,
    handleValidationErrors,
    respondToExchange
);

// Exchange management routes
router.get('/:id', 
    exchangeIdValidation, 
    handleValidationErrors, 
    getExchange
);

router.put('/:id/status', 
    updateExchangeStatusValidation,
    handleValidationErrors,
    updateExchangeStatus
);

// Admin routes
router.get('/', 
    authorize('admin'), 
    exchangeQueryValidation, 
    handleValidationErrors, 
    getAllExchanges
);

router.get('/statistics', 
    authorize('admin'), 
    exchangeStatisticsValidation, 
    handleValidationErrors, 
    getExchangeStatistics
);

module.exports = router;