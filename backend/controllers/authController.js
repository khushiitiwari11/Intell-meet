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
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);

    // THE FIX: Set the cookie here!
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: true,      // Required for Render (HTTPS)
      sameSite: 'none',  // REQUIRED for Vercel to talk to Render
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({ 
      user: { id: user._id, name: user.name, email: user.email }, 
      accessToken 
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

    if (user && (await user.matchPassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);

      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 
      });

      res.json({ 
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }, 
        accessToken 
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("🔥 LOGIN ERROR:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};