const express = require('express');
const router = express.Router();
const {
    getMyWallet,
    getAllWallets,
    getWallet,
    addFunds,
    deductFunds,
    transferFunds,
    getTransactionHistory,
    getAllTransactions,
    getWalletStatistics,
    getTransaction
} = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
    addFundsValidation,
    deductFundsValidation,
    transferFundsValidation,
    walletQueryValidation,
    transactionQueryValidation,
    walletStatisticsValidation,
    walletIdValidation,
    transactionIdValidation
} = require('../validators/walletValidators');

// Protected routes
router.use(protect);

// Lab routes
router.get('/my-wallet', 
    authorize('lab'), 
    getMyWallet
);

router.post('/transfer', 
    authorize('lab'),
    transferFundsValidation,
    handleValidationErrors,
    transferFunds
);

router.get('/transactions', 
    authorize('lab'), 
    transactionQueryValidation, 
    handleValidationErrors, 
    getTransactionHistory
);

// Transaction routes
router.get('/transactions/:id', 
    transactionIdValidation, 
    handleValidationErrors, 
    getTransaction
);

// Admin routes
router.get('/', 
    authorize('admin'), 
    walletQueryValidation, 
    handleValidationErrors, 
    getAllWallets
);

router.get('/all-transactions', 
    authorize('admin'), 
    transactionQueryValidation, 
    handleValidationErrors, 
    getAllTransactions
);

router.get('/statistics', 
    authorize('admin'), 
    walletStatisticsValidation, 
    handleValidationErrors, 
    getWalletStatistics
);

router.get('/:id', 
    authorize('admin'), 
    walletIdValidation, 
    handleValidationErrors, 
    getWallet
);

router.post('/:id/add-funds', 
    authorize('admin'),
    addFundsValidation,
    handleValidationErrors,
    addFunds
);

router.post('/:id/deduct-funds', 
    authorize('admin'),
    deductFundsValidation,
    handleValidationErrors,
    deductFunds
);

module.exports = router;