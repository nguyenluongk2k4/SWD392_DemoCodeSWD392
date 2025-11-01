// Database Schema Definitions for Smart Agriculture System
// This file defines Mongoose schemas for all collections

const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    match: [/^[+]?[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Role Schema
const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'farmer', 'manager'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    enum: [
      'user.read', 'user.write', 'user.delete',
      'device.read', 'device.write', 'device.control',
      'sensor.read', 'threshold.read', 'threshold.write',
      'alert.read', 'alert.write', 'alert.acknowledge',
      'report.read', 'system.admin'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Sensor Data Schema (Time Series)
const sensorDataSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    index: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Sensor ID must be alphanumeric with dashes/underscores']
  },
  sensorType: {
    type: String,
    required: true,
    enum: ['temperature', 'humidity', 'soil-moisture', 'light', 'ph', 'co2'],
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['°C', '%', 'lux', 'pH', 'ppm']
  },
  farmId: {
    type: String,
    index: true
  },
  zoneId: {
    type: String,
    index: true
  },
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    altitude: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  quality: {
    type: String,
    enum: ['good', 'warning', 'error'],
    default: 'good'
  },
  metadata: {
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    signalStrength: {
      type: Number,
      min: 0,
      max: 100
    },
    calibrationDate: Date
  }
}, {
  timestamps: true
});

// Time Series configuration for MongoDB 5.0+
sensorDataSchema.index({ sensorId: 1, timestamp: -1 });
sensorDataSchema.index({ sensorType: 1, timestamp: -1 });
sensorDataSchema.index({ farmId: 1, zoneId: 1, timestamp: -1 });

// Actuator Schema
const actuatorSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Device ID must be alphanumeric with dashes/underscores']
  },
  deviceType: {
    type: String,
    required: true,
    enum: ['pump', 'fan', 'valve', 'light', 'heater', 'cooler']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['on', 'off', 'error', 'maintenance'],
    default: 'off'
  },
  mode: {
    type: String,
    required: true,
    enum: ['auto', 'manual', 'scheduled'],
    default: 'manual'
  },
  farmId: {
    type: String,
    index: true
  },
  zoneId: {
    type: String,
    index: true
  },
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  capabilities: [{
    type: String,
    enum: ['on/off', 'dimming', 'speed-control', 'positioning']
  }],
  lastCommand: {
    action: String,
    timestamp: Date,
    source: {
      type: String,
      enum: ['manual', 'auto', 'scheduled']
    }
  },
  maintenanceSchedule: {
    lastMaintenance: Date,
    nextMaintenance: Date,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly']
    }
  }
}, {
  timestamps: true
});

// Threshold Schema
const thresholdSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  sensorType: {
    type: String,
    required: true,
    enum: ['temperature', 'humidity', 'soil-moisture', 'light', 'ph', 'co2'],
    index: true
  },
  minValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  farmId: {
    type: String,
    index: true
  },
  zoneId: {
    type: String,
    index: true
  },
  action: {
    type: {
      type: String,
      required: true,
      enum: ['device', 'alert', 'both']
    },
    deviceId: String,
    deviceAction: {
      type: String,
      enum: ['on', 'off', 'toggle']
    },
    alertType: {
      type: String,
      enum: ['email', 'sms', 'push', 'all']
    },
    recipients: [String],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  violationCount: {
    type: Number,
    default: 0
  },
  lastViolation: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Alert Schema
const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['threshold', 'device', 'system', 'maintenance'],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    index: true
  },
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'acknowledged', 'resolved', 'dismissed'],
    default: 'new',
    index: true
  },
  sensorData: {
    sensorId: String,
    sensorType: String,
    value: Number,
    timestamp: Date
  },
  threshold: {
    thresholdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Threshold' },
    thresholdName: String,
    expectedRange: {
      min: Number,
      max: Number
    }
  },
  device: {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Actuator' },
    deviceType: String,
    action: String
  },
  farmId: {
    type: String,
    index: true
  },
  zoneId: {
    type: String,
    index: true
  },
  notifications: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    recipient: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    error: String
  }],
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date
}, {
  timestamps: true
});

// Indexes for Alert collection
alertSchema.index({ type: 1, status: 1, createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ farmId: 1, zoneId: 1, createdAt: -1 });

// TTL index for auto-expiring old alerts (30 days)
alertSchema.index({ createdAt: 1 }, {
  expireAfterSeconds: 30 * 24 * 60 * 60,
  partialFilterExpression: { status: 'resolved' }
});

// Export schemas
module.exports = {
  User: mongoose.model('User', userSchema),
  Role: mongoose.model('Role', roleSchema),
  SensorData: mongoose.model('SensorData', sensorDataSchema),
  Actuator: mongoose.model('Actuator', actuatorSchema),
  Threshold: mongoose.model('Threshold', thresholdSchema),
  Alert: mongoose.model('Alert', alertSchema),

  // Raw schemas for reference
  schemas: {
    userSchema,
    roleSchema,
    sensorDataSchema,
    actuatorSchema,
    thresholdSchema,
    alertSchema
  }
};