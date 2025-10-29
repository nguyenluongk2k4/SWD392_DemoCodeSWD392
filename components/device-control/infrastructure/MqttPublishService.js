// Device Control - Infrastructure - MQTT Publish Service
const MqttHandler = require('../../data-ingestion/infrastructure/MqttHandler');
const config = require('../../../shared-kernel/config');
const logger = require('../../../shared-kernel/utils/logger');

class MqttPublishService {
  publishControlCommand(deviceId, command) {
    try {
      const topic = config.mqtt.topics.deviceControl.replace('+', deviceId);
      
      const message = {
        deviceId,
        command,
        timestamp: new Date().toISOString(),
      };

      MqttHandler.publish(topic, message);
      
      logger.info(`Control command sent to ${deviceId}: ${command}`);
    } catch (error) {
      logger.error('Error publishing control command:', error);
      throw error;
    }
  }

  publishBatchCommands(commands) {
    try {
      commands.forEach(({ deviceId, command }) => {
        this.publishControlCommand(deviceId, command);
      });
    } catch (error) {
      logger.error('Error publishing batch commands:', error);
      throw error;
    }
  }
}

module.exports = new MqttPublishService();
