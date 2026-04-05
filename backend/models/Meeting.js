const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduledAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['scheduled', 'active', 'completed'], default: 'scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);