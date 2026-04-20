const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate both Access and Refresh Tokens
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

// @desc    Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Create user
    const user = await User.create({ name, email, password });
    const tokens = generateTokens(user._id);
    
    res.status(201).json({ 
      user: { id: user._id, name: user.name, email: user.email }, 
      ...tokens 
    });
 } catch (error) {
    console.error("🔥 REGISTRATION ERROR DETAILS:", error); 
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get tokens
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Verify user exists and password matches
    if (user && (await user.matchPassword(password))) {
      const tokens = generateTokens(user._id);
      res.json({ 
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }, 
        ...tokens 
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};
res.cookie('token', token, {
  httpOnly: true,
  secure: true,      // Must be true for HTTPS (Render/Vercel)
  sameSite: 'none',  // Must be 'none' for cross-site cookies
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});