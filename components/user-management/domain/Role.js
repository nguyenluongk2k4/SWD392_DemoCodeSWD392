// User Management - Domain - Role Entity
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'manager', 'operator', 'viewer'],
  },
  description: {
    type: String,
  },
  permissions: [{
    type: String,
    enum: [
      'view_dashboard',
      'view_sensors',
      'control_devices',
      'manage_users',
      'manage_roles',
      'manage_thresholds',
      'view_reports',
      'report_incidents',
    ],
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Role', roleSchema);
