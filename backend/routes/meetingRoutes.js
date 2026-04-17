const express = require('express');
const { createMeeting, getUserMeetings } = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All meeting routes require authentication
router.use(protect); 

router.post('/', createMeeting);
router.get('/', getUserMeetings);

module.exports = router;
// POST /api/meetings/:id/summary
router.post('/:id/summary', protect, async (req, res) => {
  try {
    const { chatLogs } = req.body;
    
    // 🚀 FUTURE AI HOOK HERE 
    // For now, we simulate the AI processing the chat logs:
    const mockAiSummary = `Meeting covered ${chatLogs.length} messages. Key action items discussed.`;

    // You would update your Meeting model here to save the summary
    
    res.status(200).json({ summary: mockAiSummary });
  } catch (error) {
    console.error("AI Summary Error:", error);
    res.status(500).json({ message: "Failed to generate summary" });
  }
});