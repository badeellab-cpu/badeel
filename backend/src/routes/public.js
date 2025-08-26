const express = require('express');
const router = express.Router();

// Placeholder - will be implemented
router.get('/', (req, res) => {
    res.json({ message: 'Public route' });
});

module.exports = router;