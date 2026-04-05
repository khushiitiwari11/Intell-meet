const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Multer storage to point to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'intell_meet_avatars', // The folder name inside your Cloudinary account
    allowedFormats: ['jpeg', 'png', 'jpg'],
  },
});

const upload = multer({ storage: storage });

// @desc    Upload user avatar
// @route   POST /api/profile/upload-avatar
// @access  Private (requires token)
router.post('/upload-avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Find the currently logged-in user
    const user = await User.findById(req.user.id);
    
    // Update their avatar URL with the one returned from Cloudinary
    user.avatar = req.file.path; 
    await user.save();

    res.json({ message: 'Avatar updated successfully', avatarUrl: req.file.path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Avatar upload failed' });
  }
});

module.exports = router;