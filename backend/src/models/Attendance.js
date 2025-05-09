const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  clockIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  clockOut: {
    time: {
      type: Date
    },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    }
  },
  breakStart: {
    type: Date
  },
  breakEnd: {
    type: Date
  },
  totalHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
attendanceSchema.index({ 'clockIn.location': '2dsphere' });
attendanceSchema.index({ 'clockOut.location': '2dsphere' });

// Calculate total and overtime hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut) {
    const totalMinutes = (this.clockOut.time - this.clockIn.time) / (1000 * 60);
    const breakMinutes = this.breakStart && this.breakEnd ? 
      (this.breakEnd - this.breakStart) / (1000 * 60) : 0;
    
    this.totalHours = (totalMinutes - breakMinutes) / 60;
    
    // Calculate overtime (assuming 8 hours is standard)
    const standardHours = 8;
    this.overtimeHours = Math.max(0, this.totalHours - standardHours);
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 