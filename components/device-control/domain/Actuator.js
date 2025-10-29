// Device Control - Domain - Actuator Entity
const mongoose = require('mongoose');

const actuatorSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['pump', 'fan', 'valve', 'light', 'heater', 'cooler'],
  },
  status: {
    type: String,
    enum: ['on', 'off', 'error'],
    default: 'off',
  },
  location: {
    zone: String,
    field: String,
  },
  isAutomatic: {
    type: Boolean,
    default: false,
  },
  lastControlled: {
    by: String,
    at: Date,
    action: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Actuator', actuatorSchema);
