const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User'); // Assuming User model is used to fetch user details

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Attach user to request object
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Expired token' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to protect routes
const protect = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }
  next();
};

module.exports = {
  verifyToken,
  protect,
};
