const express = require('express');
const router = express.Router();
const { getSearchHistory, addSearchHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware'); // Import the protection middleware

// Apply the 'protect' middleware to both routes
router.route('/').get(protect, getSearchHistory).post(protect, addSearchHistory);

module.exports = router;