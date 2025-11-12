// Shared Kernel - Configuration Module
require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  
  database: {
    enabled: process.env.ENABLE_DATABASE === 'true' || false,
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_agriculture',
    name: process.env.DB_NAME || 'smart_agriculture',
    options: {
      // Modern MongoDB driver doesn't need these options
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  mqtt: {
    enabled: process.env.ENABLE_MQTT === 'true' || false,
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    clientId: process.env.MQTT_CLIENT_ID || 'smart_agriculture_server',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    topics: {
  sensorData: process.env.MQTT_TOPIC_SENSOR_DATA || 'sensors/#',
      deviceControl: process.env.MQTT_TOPIC_DEVICE_CONTROL || 'devices/+/control',
      deviceStatus: process.env.MQTT_TOPIC_DEVICE_STATUS || 'devices/+/status',
    }
  },
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Smart Agriculture <noreply@smartagri.com>',
  },
  
  websocket: {
    port: process.env.WS_PORT || 3001,
  },

  grpc: {
    enabled: process.env.ENABLE_GRPC === 'true' || true,
    actuatorAddress: process.env.GRPC_ACTUATOR_ADDRESS || '0.0.0.0:50051',
    actuators: {
      'pump-main-zone-123': process.env.GRPC_PUMP_ADDRESS || '0.0.0.0:50051',
      'fan-zone-A': process.env.GRPC_FAN_ADDRESS || '0.0.0.0:50051',
    }
  },
  
  alerts: {
    enableEmail: process.env.ENABLE_EMAIL_ALERTS === 'true',
    enableSMS: process.env.ENABLE_SMS_ALERTS === 'true',
    enablePush: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
  },

  automation: {
    workerEnabled: process.env.AUTOMATION_WORKER_ENABLED !== 'false',
    workerIntervalMs: parseInt(process.env.AUTOMATION_WORKER_INTERVAL_MS, 10) || 30000,
    maxAttempts: parseInt(process.env.AUTOMATION_WORKER_MAX_ATTEMPTS, 10) || 3,
    retryDelayMs: parseInt(process.env.AUTOMATION_WORKER_RETRY_MS, 10) || 60000,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  }
};

module.exports = config;
