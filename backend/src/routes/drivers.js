const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');

// Get all drivers
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .select('-password')
      .sort({ name: 1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get driver by ID
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.id,
      role: 'driver'
    }).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update driver
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, area, department, schedule, breakDuration, adminContact } = req.body;

    const driver = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'driver' },
      {
        name,
        email,
        area,
        department,
        schedule,
        breakDuration,
        adminContact
      },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete driver
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const driver = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'driver'
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 