// Automation Engine - Domain - Alert Entity
const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['threshold_exceeded', 'device_malfunction', 'system_error', 'manual'],
    index: true
  },
  
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Related entities
  sensorData: {
    sensorId: String,
    sensorType: String,
    value: Number,
    timestamp: Date
  },
  
  threshold: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Threshold'
  },
  
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Actuator'
  },
  
  // Alert content
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Notification status
  notifications: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'websocket']
    },
    recipient: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'delivered'],
      default: 'pending'
    },
    sentAt: Date,
    error: String
  }],
  
  // Alert status
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved', 'dismissed'],
    default: 'new',
    index: true
  },
  
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  acknowledgedAt: Date,
  
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  resolvedAt: Date,
  
  resolutionNotes: String,
  
  // Metadata
  farmZone: String,
  
  expiresAt: Date
  
}, {
  timestamps: true
});

// Indexes
AlertSchema.index({ type: 1, status: 1, createdAt: -1 });
AlertSchema.index({ severity: 1, status: 1 });
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
AlertSchema.methods.acknowledge = function(userId) {
  this.status = 'acknowledged';
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  return this.save();
};

AlertSchema.methods.resolve = function(userId, notes) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  this.resolutionNotes = notes;
  return this.save();
};

AlertSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  return this.save();
};

const Alert = mongoose.model('Alert', AlertSchema);

module.exports = Alert;
