const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers['authorization'];

    // Check if header exists
    if (!authHeader) {
      return res.status(401).json({
        message: 'Access token missing'
      });
    }

    // Format: Bearer <token>
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Invalid token format'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          message: 'Invalid or expired token'
        });
      }

      // Attach user info to request
      req.user = decoded;

      // Proceed to next middleware / controller
      next();
    });

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      message: 'Authentication failed'
    });
  }
};

module.exports = authenticateToken;
