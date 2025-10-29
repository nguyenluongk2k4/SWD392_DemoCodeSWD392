// Automation Engine - Domain - Threshold Entity
const mongoose = require('mongoose');

const ThresholdSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  sensorType: {
    type: String,
    required: true,
    enum: ['temperature', 'humidity', 'light', 'soilMoisture', 'soilPH'],
    index: true
  },
  
  // Location context
  farmZone: {
    type: String,
    default: 'default'
  },
  
  // Threshold values
  minValue: {
    type: Number,
    required: true
  },
  
  maxValue: {
    type: Number,
    required: true
  },
  
  // Action to take when threshold is violated
  action: {
    type: {
      type: String,
      enum: ['control_device', 'send_alert', 'both'],
      default: 'both'
    },
    deviceId: String,
    deviceAction: {
      type: String,
      enum: ['on', 'off', 'toggle']
    },
    alertType: {
      type: String,
      enum: ['email', 'sms', 'push', 'all'],
      default: 'email'
    },
    recipients: [String]
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  description: String
  
}, {
  timestamps: true
});

// Indexes
ThresholdSchema.index({ sensorType: 1, isActive: 1 });
ThresholdSchema.index({ farmZone: 1, isActive: 1 });

// Methods
ThresholdSchema.methods.isViolated = function(value) {
  return value < this.minValue || value > this.maxValue;
};

ThresholdSchema.methods.getViolationType = function(value) {
  if (value < this.minValue) return 'below_min';
  if (value > this.maxValue) return 'above_max';
  return null;
};

const Threshold = mongoose.model('Threshold', ThresholdSchema);

module.exports = Threshold;
