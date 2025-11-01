// Shared Kernel - Event Bus Module (In-memory Event Emitter)
// Trong production, có thể thay bằng RabbitMQ hoặc Kafka
const EventEmitter = require('events');
const logger = require('../utils/logger');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Tăng số listener nếu cần
  }

  // Publish event
  publish(eventName, data) {
    logger.info(`📢 Event Published: ${eventName}`, { data });
    this.emit(eventName, data);
  }

  // Subscribe to event
  subscribe(eventName, handler) {
    logger.info(`👂 Subscribed to event: ${eventName}`);
    this.on(eventName, handler);
  }

  // Unsubscribe from event
  unsubscribe(eventName, handler) {
    logger.info(`🔇 Unsubscribed from event: ${eventName}`);
    this.off(eventName, handler);
  }
}

// Event names constants
const Events = {
  // Sensor & Data
  SENSOR_DATA_RECEIVED: 'sensor.data.received',
  SENSOR_DATA_PROCESSED: 'sensor.data.processed',
  
  // Thresholds
  THRESHOLD_EXCEEDED: 'threshold.exceeded',
  THRESHOLD_CREATED: 'threshold.created',
  THRESHOLD_UPDATED: 'threshold.updated',
  THRESHOLD_DELETED: 'threshold.deleted',
  
  // Devices
  DEVICE_CONTROLLED: 'device.controlled',
  DEVICE_STATUS_CHANGED: 'device.status.changed',
  
  // Alerts
  ALERT_CREATED: 'alert.created',
  ALERT_NOTIFIED: 'alert.notified',
  ALERT_ACKNOWLEDGED: 'alert.acknowledged',
  ALERT_RESOLVED: 'alert.resolved',
  
  // Users
  USER_LOGGED_IN: 'user.logged_in',
  USER_CREATED: 'user.created',
  
  // Incidents
  INCIDENT_REPORTED: 'incident.reported',
};

const eventBus = new EventBus();

module.exports = {
  eventBus,
  Events,
};
