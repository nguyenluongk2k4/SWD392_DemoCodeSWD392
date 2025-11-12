// Database Schema Definitions for Smart Agriculture System
// This file defines Mongoose schemas for all collections

const mongoose = require('mongoose');

// Helper avoids OverwriteModelError during watch-mode reloads
const getModel = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);

// Farm Schema (3NF: Master data for farms)
const farmSchema = new mongoose.Schema({
  farmId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Farm ID must be alphanumeric with dashes/underscores']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
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
    altitude: Number,
    address: String
  },
  area: {
    type: Number, // in hectares
    min: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Zone Schema (3NF: Zones within farms)
const zoneSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Zone ID must be alphanumeric with dashes/underscores']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
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
  area: {
    type: Number, // in square meters
    min: 0
  },
  cropType: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// SensorType Schema (3NF: Master data for sensor types)
const sensorTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['temperature', 'humidity', 'soil-moisture', 'light', 'ph', 'co2'],
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['°C', '%', 'lux', 'pH', 'ppm']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  minValue: {
    type: Number
  },
  maxValue: {
    type: Number
  },
  precision: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Sensor Schema (3NF: Master data for sensors)
const sensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Sensor ID must be alphanumeric with dashes/underscores']
  },
  sensorType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorType',
    required: true,
    index: true
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    index: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
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
    altitude: Number,
    description: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'active'
  },
  installationDate: {
    type: Date,
    default: Date.now
  },
  lastCalibration: Date,
  metadata: {
    manufacturer: String,
    model: String,
    firmwareVersion: String,
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    signalStrength: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ActuatorType Schema (3NF: Master data for actuator types)
const actuatorTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['pump', 'fan', 'valve', 'light', 'heater', 'cooler'],
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  capabilities: [{
    type: String,
    enum: ['on/off', 'dimming', 'speed-control', 'positioning']
  }],
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  powerConsumption: {
    type: Number, // in watts
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

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

// Sensor Data Schema (Time Series) - Now references Sensor
const sensorDataSchema = new mongoose.Schema({
  sensor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensor',
    required: true,
    index: true
  },
  sensorType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorType',
    index: true
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    index: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  quality: {
    type: String,
    enum: ['good', 'warning', 'critical', 'error'],
    default: 'good'
  },
  sourceTopic: {
    type: String,
    trim: true
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed
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
    }
  }
}, {
  timestamps: true
});

// Time Series configuration for MongoDB 5.0+
sensorDataSchema.index({ sensor: 1, timestamp: -1 });

// Actuator Schema - Now references ActuatorType, Farm, Zone
const actuatorSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Device ID must be alphanumeric with dashes/underscores']
  },
  actuatorType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActuatorType',
    required: true,
    index: true
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
    index: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    match: [/^[0-9.:a-zA-Z-]+$/, 'Invalid gRPC address format'],
    default: '0.0.0.0:50051',
    comment: 'gRPC server address (host:port) for this actuator'
  },
  status: {
    type: String,
    required: true,
    enum: ['on', 'off', 'error', 'maintenance', 'ON', 'OFF'],
    default: 'off'
  },
  mode: {
    type: String,
    required: true,
    enum: ['auto', 'manual', 'scheduled', 'AUTO', 'MANUAL', 'SCHEDULED'],
    default: 'manual'
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
  lastCommand: {
    action: String,
    timestamp: Date,
    source: {
      type: String,
      enum: ['manual', 'auto', 'scheduled', 'grpc']
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

// Threshold Schema - Now references SensorType, Farm, Zone
const thresholdSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  sensorType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorType',
    required: true,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    index: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    index: true
  },
  action: {
    type: {
      type: String,
      required: true,
      enum: ['device', 'alert', 'both']
    },
    actuator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Actuator'
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

thresholdSchema.index({ sensorType: 1, farmId: 1, zoneId: 1, isActive: 1 });

thresholdSchema.methods.isViolated = function(value) {
  return value < this.minValue || value > this.maxValue;
};

thresholdSchema.methods.getViolationType = function(value) {
  if (value < this.minValue) return 'below_min';
  if (value > this.maxValue) return 'above_max';
  return null;
};

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
    enum: ['new', 'notified', 'notification_failed', 'action_executed', 'action_failed', 'acknowledged', 'resolved', 'dismissed'],
    default: 'new',
    index: true
  },
  sensorData: {
    sensorDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorData' },
    sensor: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
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
    actuatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Actuator' },
    deviceType: String,
    action: String
  },
  automation: {
    correlationId: {
      type: String,
      index: true
    },
    taskIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AutomationTask'
      }
    ],
    requestedAction: String,
    lastTaskStatus: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed']
    },
    lastExecutedAt: Date,
    lastError: String
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
    index: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true,
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
    error: String,
    messageId: String,
    metadata: mongoose.Schema.Types.Mixed
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
  resolvedAt: Date,
  resolutionNotes: String,
  history: {
    type: [
      {
        event: {
          type: String,
          required: true
        },
        status: String,
        channel: String,
        recipient: String,
        detail: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

// Automation Task Schema - queue for deferred actuator execution
const automationTaskSchema = new mongoose.Schema({
  alert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    required: false
  },
  threshold: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Threshold',
    required: false
  },
  actuator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Actuator',
    required: false
  },
  correlationId: {
    type: String,
    index: true
  },
  deviceId: {
    type: String,
    required: false,
    index: true
  },
  action: {
    type: String,
    enum: ['on', 'off', 'toggle'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: Date,
  error: String,
  result: mongoose.Schema.Types.Mixed,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  scheduledAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

automationTaskSchema.index({ status: 1, scheduledAt: 1 });
automationTaskSchema.index({ correlationId: 1 });
// Indexes for Alert collection
alertSchema.index({ type: 1, status: 1, createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ farmId: 1, zoneId: 1, createdAt: -1 });

// TTL index for auto-expiring old alerts (30 days)
alertSchema.index({ createdAt: 1 }, {
  expireAfterSeconds: 30 * 24 * 60 * 60,
  partialFilterExpression: { status: 'resolved' }
});

alertSchema.methods.acknowledge = function(userId) {
  this.status = 'acknowledged';
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  this.history = this.history || [];
  this.history.push({
    event: 'acknowledged',
    status: this.status,
    detail: userId ? `Acknowledged by ${userId.toString()}` : 'Acknowledged',
    createdAt: new Date()
  });
  return this.save();
};

alertSchema.methods.resolve = function(userId, notes) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  if (notes) {
    this.message = `${this.message}\nResolution: ${notes}`;
  }
  this.history = this.history || [];
  this.history.push({
    event: 'resolved',
    status: this.status,
    detail: notes ? notes.toString() : 'Resolved',
    createdAt: new Date()
  });
  return this.save();
};

alertSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  this.history = this.history || [];
  this.history.push({
    event: 'dismissed',
    status: this.status,
    createdAt: new Date()
  });
  return this.save();
};

// Export schemas
module.exports = {
  Farm: getModel('Farm', farmSchema),
  Zone: getModel('Zone', zoneSchema),
  SensorType: getModel('SensorType', sensorTypeSchema),
  Sensor: getModel('Sensor', sensorSchema),
  ActuatorType: getModel('ActuatorType', actuatorTypeSchema),
  User: getModel('User', userSchema),
  Role: getModel('Role', roleSchema),
  SensorData: getModel('SensorData', sensorDataSchema),
  Actuator: getModel('Actuator', actuatorSchema),
  Threshold: getModel('Threshold', thresholdSchema),
  Alert: getModel('Alert', alertSchema),
  AutomationTask: getModel('AutomationTask', automationTaskSchema),

  // Raw schemas for reference
  schemas: {
    farmSchema,
    zoneSchema,
    sensorTypeSchema,
    sensorSchema,
    actuatorTypeSchema,
    userSchema,
    roleSchema,
    sensorDataSchema,
    actuatorSchema,
    thresholdSchema,
    alertSchema,
    automationTaskSchema
  }
};