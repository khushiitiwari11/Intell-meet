const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  assignedToName: { 
    type: String,
    required: true
  },
  status: { 
    type: String, 
    enum: ['Todo', 'In Progress', 'Done'], 
    default: 'Todo' 
  },
  meetingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Meeting',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);