const Meeting = require('../models/Meeting');

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
exports.createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledAt } = req.body;
    
    const meeting = await Meeting.create({
      title,
      description,
      host: req.user.id, // Attached by authMiddleware
      scheduledAt: scheduledAt || Date.now()
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create meeting' });
  }
};

// @desc    Get all meetings for the logged-in user
// @route   GET /api/meetings
// @access  Private
exports.getUserMeetings = async (req, res) => {
  try {
    // Fetch meetings where user is host OR participant
    const meetings = await Meeting.find({
      $or: [{ host: req.user.id }, { participants: req.user.id }]
    })
    .populate('host', 'name email avatar')
    .sort({ scheduledAt: -1 });

    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch meetings' });
  }
};