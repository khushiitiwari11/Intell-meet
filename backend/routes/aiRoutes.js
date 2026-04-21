const express = require('express');
const router = express.Router();
const multer = require('multer');
const { OpenAI } = require('openai');
const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI();

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });
    // This string is what we'll pass to Day 16's AI route [cite: 45]
    res.json({ transcript: transcription.text });
  } catch (error) {
    res.status(500).json({ error: "Transcription failed" });
  }
});