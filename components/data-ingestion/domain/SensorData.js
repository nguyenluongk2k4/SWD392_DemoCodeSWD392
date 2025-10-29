// Data Ingestion - Domain - SensorData Entity
const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    index: true,
  },
  sensorType: {
    type: String,
    required: true,
    enum: ['temperature', 'humidity', 'soil_moisture', 'light', 'ph', 'nutrient'],
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  location: {
    zone: String,
    field: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  quality: {
    type: String,
    enum: ['good', 'warning', 'critical'],
    default: 'good',
  },
}, {
  timestamps: true,
  // Time-series collection optimization
  timeseries: {
    timeField: 'timestamp',
    metaField: 'sensorId',
    granularity: 'minutes',
  }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
