const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Cookies first (Primary secure method for React Web App)
    if (req.cookies?.token) {
      token = req.cookies.token;
    } 
    // 2. Fallback to Headers (Useful for Postman testing or external APIs)
    else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Reject immediately if no token is found
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    // 3. Verify the token cryptographically
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Fetch the user and attach to the request object
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    next(); // Move to the requested route
    
  } catch (error) {
    // 5. Catch specific errors (like an expired token) so the frontend can handle it gracefully
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Your session has expired. Please log in again.', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: 'Invalid or corrupted authentication token.' });
  }
};

module.exports = { protect };