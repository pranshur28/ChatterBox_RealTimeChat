const express = require('express');
const router = express.Router();
const { register, login, refreshToken, forgotPassword, resetPassword } = require('../controllers/authController');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Refresh token route
router.post('/refresh-token', refreshToken);

// Forgot password route
router.post('/forgot-password', forgotPassword);

// Reset password route
router.post('/reset-password', resetPassword);

module.exports = router;
