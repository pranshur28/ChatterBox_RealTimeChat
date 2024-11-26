const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validator = require('validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
    try {
        // Validate input
        const { username, email, password } = req.body;
        console.log('Registration attempt:', { username, email });

        if (!username || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!validator.isEmail(email)) {
            console.log('Invalid email format');
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
            console.log('Invalid password format');
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include a number and a special character' });
        }
        if (!/^[a-zA-Z0-9]+$/.test(username) || username.length < 3) {
            console.log('Invalid username format');
            return res.status(400).json({ message: 'Username must be alphanumeric and at least 3 characters long' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        console.log('Existing user:', !!existingUser);
        
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Create new user
        const newUser = new User({
            username,
            email,
            password // Password will be hashed by the pre-save middleware
        });

        console.log('Saving new user...');
        await newUser.save();
        console.log('User saved successfully');

        // Generate tokens
        const accessToken = generateAccessToken(newUser._id);
        const refreshToken = generateRefreshToken(newUser._id);

        // Return success response with tokens
        res.status(201).json({ 
            message: 'User registered successfully', 
            accessToken, 
            refreshToken,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        // Validate input
        const { email, password } = req.body;
        console.log('Login attempt:', { email });

        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }
        if (!validator.isEmail(email)) {
            console.log('Invalid email format');
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Find user
        const user = await User.findOne({ email });
        console.log('User found:', !!user);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Update last_login
        user.last_login = new Date();
        await user.save();

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = generateAccessToken(decoded.userId);
        res.status(200).json({ accessToken });
    } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token', error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save reset token to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // Return the reset URL to the client
        res.status(200).json({ 
            message: 'Password reset link generated successfully', 
            resetUrl 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Validate password
        if (!password || password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include a number and a special character' });
        }

        // Find user by reset token and check if token is expired
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password (no need to hash here as it's handled by the pre-save middleware)
        user.password = password;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    forgotPassword,
    resetPassword
};
