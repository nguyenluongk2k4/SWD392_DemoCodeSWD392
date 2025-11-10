// API Configuration
// Central configuration for all API endpoints

const API_CONFIG = {
  // Backend API base URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  
  // Frontend URL
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // Users & Roles
    USERS: '/api/users',
    ROLES: '/api/roles',
    
    // Devices
    DEVICES: '/api/devices',
    
    // Thresholds
    THRESHOLDS: '/api/thresholds',
    
    // Alerts
    ALERTS: '/api/alerts',
    ALERTS_ACTIVE: '/api/alerts/active',
    ALERTS_STATS: '/api/alerts/stats',
    VERIFY_EMAIL: '/api/alerts/verify-email',
    
    // Farms
    FARMS: '/api/farms',
    
    // Zones
    ZONES: '/api/zones',
    
    // Sensor Types
    SENSOR_TYPES: '/api/sensor-types',
    
    // Demo & Debug
    DEMO_SENSOR_DATA: '/api/demo/sensor-data',
    DEBUG_SEED_DATA: '/api/debug/seed-data',
  },
  
  // Helper methods
  getUrl(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  },
  
  getFarmZonesUrl(farmId) {
    return `${this.BASE_URL}/api/farms/${farmId}/zones`;
  },
  
  getThresholdUrl(thresholdId) {
    return `${this.BASE_URL}/api/thresholds/${thresholdId}`;
  },
  
  getAlertUrl(alertId) {
    return `${this.BASE_URL}/api/alerts/${alertId}`;
  },

  getUserUrl(userId) {
    return `${this.BASE_URL}/api/users/${userId}`;
  },

  getRoleUrl(roleId) {
    return `${this.BASE_URL}/api/roles/${roleId}`;
  }
};

export default API_CONFIG;
