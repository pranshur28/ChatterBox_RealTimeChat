// Error handling middleware

// This middleware function handles different types of errors and formats them
// appropriately based on the environment (development or production).

module.exports = (err, req, res, next) => {
  // Set default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'AuthenticationError') {
    statusCode = 401;
    message = 'Authentication Error';
  } else if (err.name === 'DatabaseError') {
    statusCode = 500;
    message = 'Database Error';
  }

  // Format error response based on environment
  if (process.env.NODE_ENV === 'development') {
    // In development, include stack trace for debugging
    return res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
    });
  } else {
    // In production, exclude stack trace to avoid leaking sensitive information
    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
};
