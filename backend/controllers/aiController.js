const OpenAI = require('openai');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task'); // For F-06 Team & Project Management

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.processMeetingAI = async (req, res) => {
  try {
    const { meetingId, transcript } = req.body; //

    // 1. AI Analysis Call
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Industry standard for 2026
      messages: [
        {
          role: "system",
          content: `You are an AI Secretary for Zidio Development. 
          Analyze the meeting transcript to:
          1. Provide a concise summary (max 200 words).
          2. Extract action items as an array of objects: { task: string, owner: string, dueDate: string }.
          Return only valid JSON.`
        },
        { role: "user", content: transcript }
      ],
      response_format: { type: "json_object" }
    });

    // 2. Parse AI response
    const aiData = JSON.parse(completion.choices[0].message.content);

    // 3. Update the Meeting Record (F-05) 
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        summary: aiData.summary, 
        transcript: transcript,
        isProcessed: true 
      },
      { new: true }
    );

    // 4. Automatic Action Item Extraction (F-04/F-06)
    // Note: The '?.' prevents crashes if aiData.actionItems is undefined
    if (aiData.actionItems?.length > 0) {
      const taskPromises = aiData.actionItems.map(item => 
        Task.create({
          title: item.task,
          description: `Extracted from meeting: ${updatedMeeting.title}`,
          assignedToName: item.owner,
          meetingId: meetingId,
          status: 'Todo' // Default for Kanban board
        })
      );
      await Promise.all(taskPromises);
    }

    res.status(200).json({ 
      message: "AI Processing Complete", 
      summary: aiData.summary,
      taskCount: aiData.actionItems?.length || 0 
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Failed to generate AI insights" });
  }
};