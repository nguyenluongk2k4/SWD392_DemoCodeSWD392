// User Management - Domain - Role Entity
const mongoose = require('mongoose');

const ROLE_NAMES = ['admin', 'manager', 'operator', 'viewer'];
const ROLE_PERMISSIONS = [
  'view_dashboard',
  'view_sensors',
  'control_devices',
  'manage_users',
  'manage_roles',
  'manage_thresholds',
  'view_reports',
  'report_incidents',
];

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ROLE_NAMES,
  },
  description: {
    type: String,
  },
  permissions: [{
    type: String,
    enum: ROLE_PERMISSIONS,
  }],
}, {
  timestamps: true,
});

const Role = mongoose.model('Role', roleSchema);

// Expose enums so application services can validate without duplicating strings
Role.ROLE_NAMES = ROLE_NAMES;
Role.PERMISSIONS = ROLE_PERMISSIONS;

module.exports = Role;
