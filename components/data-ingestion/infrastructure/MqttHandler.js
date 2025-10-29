// Data Ingestion - Infrastructure - MQTT Handler
const mqtt = require('mqtt');
const config = require('../../../shared-kernel/config');
const logger = require('../../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');

class MqttHandler {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    try {
      // Skip MQTT if disabled
      if (!config.mqtt.enabled) {
        logger.info('📡 MQTT is disabled - Running in demo mode');
        return;
      }

      const options = {
        clientId: config.mqtt.clientId,
        clean: true,
        reconnectPeriod: 5000,
      };

      if (config.mqtt.username) {
        options.username = config.mqtt.username;
        options.password = config.mqtt.password;
      }

      this.client = mqtt.connect(config.mqtt.brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('✅ MQTT Connected to broker');
        
        // Subscribe to sensor data topic
        this.subscribe(config.mqtt.topics.sensorData);
        
        // Subscribe to device status topic
        this.subscribe(config.mqtt.topics.deviceStatus);
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error) => {
        logger.error('MQTT Error:', error);
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        logger.warn('MQTT Client offline');
      });

      this.client.on('reconnect', () => {
        logger.info('MQTT Reconnecting...');
      });

    } catch (error) {
      logger.error('Error connecting to MQTT broker:', error);
      throw error;
    }
  }

  subscribe(topic) {
    if (!this.client) {
      throw new Error('MQTT client not initialized');
    }

    this.client.subscribe(topic, (err) => {
      if (err) {
        logger.error(`Error subscribing to ${topic}:`, err);
      } else {
        logger.info(`📡 Subscribed to MQTT topic: ${topic}`);
      }
    });
  }

  publish(topic, message) {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`Error publishing to ${topic}:`, err);
      } else {
        logger.info(`📤 Published to MQTT topic: ${topic}`);
      }
    });
  }

  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      logger.info(`📥 MQTT Message received on ${topic}:`, payload);

      // Determine message type and publish event
      if (topic.includes('sensors')) {
        eventBus.publish(Events.SENSOR_DATA_RECEIVED, {
          topic,
          data: payload,
          timestamp: new Date(),
        });
      } else if (topic.includes('devices')) {
        eventBus.publish(Events.DEVICE_CONTROLLED, {
          topic,
          data: payload,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error handling MQTT message:', error);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      logger.info('MQTT Disconnected');
    }
  }

  getClient() {
    return this.client;
  }
}

module.exports = new MqttHandler();
