const express = require('express');
const router = express.Router();
const {
    createPayment,
    confirmPayment,
    handleWebhook,
    getPaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Create payment
router.post('/create-payment', protect, createPayment);

// Confirm payment after Moyasar callback
router.post('/confirm', protect, confirmPayment);

// Handle Moyasar webhook (no auth required, verified by signature)
router.post('/webhook', handleWebhook);

// Get payment status
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;
