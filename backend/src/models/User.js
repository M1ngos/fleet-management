const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['driver', 'admin'],
    required: true
  },
  // Driver specific fields
  area: {
    type: String,
    required: function() { return this.role === 'driver'; }
  },
  department: {
    type: String,
    required: function() { return this.role === 'driver'; }
  },
  schedule: {
    start: {
      type: String,
      default: '08:00',
      required: function() { return this.role === 'driver'; }
    },
    end: {
      type: String,
      default: '17:00',
      required: function() { return this.role === 'driver'; }
    }
  },
  breakDuration: {
    type: Number,
    default: 60, // in minutes
    required: function() { return this.role === 'driver'; }
  },
  adminContact: {
    type: String,
    required: function() { return this.role === 'driver'; }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 