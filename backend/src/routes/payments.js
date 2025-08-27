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

// Confirm payment after Moyasar callback (no auth needed - verified by payment ID)
router.post('/confirm', confirmPayment);

// Handle Moyasar webhook (no auth required, verified by signature)
router.post('/webhook', handleWebhook);
router.get('/webhook', handleWebhook); // Some webhooks send GET requests

// Get payment status
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;
