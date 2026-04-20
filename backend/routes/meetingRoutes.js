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
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/meetings/:id/summary
router.post('/:id/summary', protect, async (req, res) => {
  try {
    const { chatLogs } = req.body;
    
    // Initialize the real Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Give the AI a prompt
    const prompt = `You are an AI assistant for a meeting platform called IntellMeet. 
    Here are the chat logs from a recent meeting: ${chatLogs.length > 0 ? chatLogs : "No chat logs available, it was a vocal meeting."}. 
    Please provide a short, professional 3-sentence summary of the meeting and list any potential action items.`;

    const result = await model.generateContent(prompt);
    const aiSummary = result.response.text();
    
    res.status(200).json({ summary: aiSummary });
  } catch (error) {
    console.error("AI Summary Error:", error);
    res.status(500).json({ message: "Failed to generate summary" });
  }
});