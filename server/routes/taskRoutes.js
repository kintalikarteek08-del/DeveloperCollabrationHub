const express = require('express');
const router = express.Router();
const {
  getProjectTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  addTaskComment,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.get('/project/:projectId', protect, getProjectTasks);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.patch('/:id/status', protect, updateTaskStatus);
router.post('/:id/comments', protect, addTaskComment);
router.delete('/:id', protect, deleteTask);

module.exports = router;
