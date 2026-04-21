const express = require('express');
const router = express.Router();
const { getTasks, updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTasks);
router.put('/:id/status', protect, updateTaskStatus);

module.exports = router;