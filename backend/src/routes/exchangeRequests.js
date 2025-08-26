const express = require('express');
const router = express.Router();
const {
    createExchangeRequest,
    getExchangeRequests,
    getExchangeRequest,
    respondToExchangeRequest,
    withdrawExchangeRequest,
    getExchangeRequestStats
} = require('../controllers/exchangeRequestController');
const { protect } = require('../middleware/auth');

// All routes are protected and require lab user
router.use(protect);

// Exchange request routes
router.route('/')
    .get(getExchangeRequests)
    .post(createExchangeRequest);

router.get('/stats', getExchangeRequestStats);

router.route('/:id')
    .get(getExchangeRequest);

router.put('/:id/respond', respondToExchangeRequest);
router.put('/:id/withdraw', withdrawExchangeRequest);

module.exports = router;
