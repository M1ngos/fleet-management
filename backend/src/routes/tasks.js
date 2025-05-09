const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { auth, isAdmin } = require('../middleware/auth');

// Validation middleware
const validateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('assignedTo').isMongoId().withMessage('Valid assignee is required')
];

// Get my tasks (tasks created by the user)
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user.id })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assigned tasks (tasks assigned to the user)
router.get('/assigned', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the task
    if (req.user.role !== 'admin' && 
        task.createdBy._id.toString() !== req.user.id && 
        task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task (admin only)
router.post('/', auth, isAdmin, validateTask, async (req, res) => {
  try {
    console.log('Received task creation request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const task = new Task({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      assignedTo: req.body.assignedTo,
      createdBy: req.user.id
    });

    console.log('Creating task:', task);
    await task.save();
    await task.populate('createdBy', 'name email');
    await task.populate('assignedTo', 'name email');

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task (admin only)
router.put('/:id', auth, isAdmin, validateTask, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.remove();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.patch('/:id/status', auth, [
  body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to update status
    if (req.user.role !== 'admin' && 
        task.createdBy.toString() !== req.user.id && 
        task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.status = req.body.status;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 