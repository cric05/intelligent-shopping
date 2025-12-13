const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser,
  directPasswordReset // Import our new function
} = require('../controllers/authController');

// Define the API Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- NEW ROUTE FOR YOUR CUSTOM FLOW ---
router.post('/direct-reset', directPasswordReset);

module.exports = router;