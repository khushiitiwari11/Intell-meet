const express = require('express');
const { createMeeting, getUserMeetings } = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All meeting routes require authentication
router.use(protect); 

router.post('/', createMeeting);
router.get('/', getUserMeetings);

module.exports = router;