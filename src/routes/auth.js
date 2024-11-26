// Import required dependencies
const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Create router instance
const router = express.Router();

// Rate limiting middleware for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// Rate limiting middleware for registration attempts
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration requests per windowMs
    message: 'Too many registration attempts from this IP, please try again after an hour'
});

// Input validation middleware
const validateRegister = [
    body('username')
        .isAlphanumeric().withMessage('Username must be alphanumeric')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[!@#$%^&*]/).withMessage('Password must contain a special character'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// POST /register: User registration
router.post('/register', registerLimiter, validateRegister, authController.register);

// POST /login: User authentication
router.post('/login', loginLimiter, [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
], authController.login);

// POST /logout: User logout
router.post('/logout', authMiddleware, (req, res) => {
    // Invalidate token logic here
    // This could involve blacklisting the token or removing it from a store
    res.status(200).json({ message: 'Logout successful' });
});

// GET /verify: Token verification
router.get('/verify', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'Token is valid' });
});

// Export router
module.exports = router;
