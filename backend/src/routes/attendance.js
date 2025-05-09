const express = require('express');
const router = express.Router();
const { auth, isAdmin, isDriver } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Clock in
router.post('/clock-in', auth, isDriver, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      driver: req.user._id,
      date: { $gte: today }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }

    const attendance = new Attendance({
      driver: req.user._id,
      clockIn: {
        time: new Date(),
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      }
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Clock out
router.post('/clock-out', auth, isDriver, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      driver: req.user._id,
      date: { $gte: today },
      'clockOut.time': { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No active clock-in found' });
    }

    attendance.clockOut = {
      time: new Date(),
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    };

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start break
router.post('/break/start', auth, isDriver, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      driver: req.user._id,
      date: { $gte: today },
      breakStart: { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No active attendance found' });
    }

    attendance.breakStart = new Date();
    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// End break
router.post('/break/end', auth, isDriver, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      driver: req.user._id,
      date: { $gte: today },
      breakStart: { $exists: true },
      breakEnd: { $exists: false }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No active break found' });
    }

    attendance.breakEnd = new Date();
    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get driver's attendance history
router.get('/history', auth, isDriver, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { driver: req.user._id };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of the day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      
      // If end date is today, include all records up to now
      const now = new Date();
      if (end.getDate() === now.getDate() && 
          end.getMonth() === now.getMonth() && 
          end.getFullYear() === now.getFullYear()) {
        end.setTime(now.getTime());
      }
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('driver', 'name email');

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all attendance records
router.get('/admin/records', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, driverId } = req.query;
    const query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of the day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      
      // If end date is today, include all records up to now
      const now = new Date();
      if (end.getDate() === now.getDate() && 
          end.getMonth() === now.getMonth() && 
          end.getFullYear() === now.getFullYear()) {
        end.setTime(now.getTime());
      }
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    if (driverId) {
      query.driver = driverId;
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('driver', 'name email area department');

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching admin attendance records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get overtime report
router.get('/admin/overtime', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { overtimeHours: { $gt: 0 } };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const overtimeRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('driver', 'name email area department');

    res.json(overtimeRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DEV ONLY: Delete today's attendance for the logged-in driver
router.delete('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Attendance.deleteOne({
      driver: req.user._id,
      date: { $gte: today }
    });
    res.json({ message: "Today's attendance deleted" });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get active drivers with locations
router.get('/admin/active-drivers', auth, isAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeAttendance = await Attendance.find({
      date: { $gte: today },
      'clockIn.time': { $exists: true },
      'clockOut.time': { $exists: false }
    }).populate('driver', 'name email');

    const activeDrivers = activeAttendance.map(record => ({
      _id: record.driver._id,
      name: record.driver.name,
      breakStart: record.breakStart,
      breakEnd: record.breakEnd,
      lastLocation: record.clockIn.location ? {
        latitude: record.clockIn.location.coordinates[1],
        longitude: record.clockIn.location.coordinates[0],
        accuracy: record.clockIn.location.accuracy || 0,
        altitude: record.clockIn.location.altitude || 0,
        altitudeAccuracy: record.clockIn.location.altitudeAccuracy || 0,
        heading: record.clockIn.location.heading || 0,
        speed: record.clockIn.location.speed || 0,
        timestamp: record.clockIn.time
      } : null
    }));

    res.json(activeDrivers);
  } catch (error) {
    console.error('Error fetching active drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 