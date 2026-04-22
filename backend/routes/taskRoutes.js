const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // The MongoDB model we made earlier!

// 1. GET all tasks for the Kanban Board
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// 2. UPDATE a task's status (Triggered when you drop a card)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Find the task by ID and update its status
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true } // Returns the updated document
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update task', error: err.message });
  }
});

// 3. CREATE a new task (For your "Add Task" button later)
router.post('/', async (req, res) => {
  try {
    const newTask = new Task({
      title: req.body.title,
      description: req.body.description,
      assignedToName: req.body.assignedToName,
      status: req.body.status || 'Todo',
      meetingId: req.body.meetingId // Links the task to a specific meeting
    });
    
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create task', error: err.message });
  }
});

module.exports = router;