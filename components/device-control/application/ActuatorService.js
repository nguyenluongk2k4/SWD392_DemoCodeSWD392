// Device Control - Application - Actuator Service (UC03)
const ActuatorRepository = require('../infrastructure/ActuatorRepository');
const MqttPublishService = require('../infrastructure/MqttPublishService');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const logger = require('../../../shared-kernel/utils/logger');

class ActuatorService {
  async controlDevice(deviceId, command, controlledBy = 'user') {
    try {
      // Validate device exists
      const device = await ActuatorRepository.findById(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      // Validate command
      if (!['on', 'off'].includes(command)) {
        throw new Error('Invalid command. Use "on" or "off"');
      }

      // Check if device is in automatic mode
      if (device.isAutomatic && controlledBy === 'user') {
        logger.warn(`Device ${deviceId} is in automatic mode. Manual control may be overridden.`);
      }

      // Send MQTT command
      MqttPublishService.publishControlCommand(deviceId, command);

      // Update device status in database
      const updatedDevice = await ActuatorRepository.updateStatus(deviceId, command, controlledBy);

      // Publish event
      eventBus.publish(Events.DEVICE_CONTROLLED, {
        deviceId,
        command,
        controlledBy,
        timestamp: new Date(),
      });

      logger.info(`✅ Device ${deviceId} controlled: ${command} by ${controlledBy}`);

      return updatedDevice;
    } catch (error) {
      logger.error('Error controlling device:', error);
      throw error;
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const device = await ActuatorRepository.findById(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      return device;
    } catch (error) {
      logger.error('Error getting device status:', error);
      throw error;
    }
  }

  async getAllDevices(filters = {}) {
    try {
      return await ActuatorRepository.findAll(filters);
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  async registerDevice(deviceData) {
    try {
      const existingDevice = await ActuatorRepository.findById(deviceData.deviceId);
      if (existingDevice) {
        throw new Error('Device already registered');
      }

      const device = await ActuatorRepository.create(deviceData);
      logger.info(`Device registered: ${device.deviceId}`);
      
      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async updateDevice(deviceId, updateData) {
    try {
      const device = await ActuatorRepository.update(deviceId, updateData);
      if (!device) {
        throw new Error('Device not found');
      }
      
      logger.info(`Device updated: ${deviceId}`);
      return device;
    } catch (error) {
      logger.error('Error updating device:', error);
      throw error;
    }
  }

  async deleteDevice(deviceId) {
    try {
      const device = await ActuatorRepository.delete(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      
      logger.info(`Device deleted: ${deviceId}`);
      return device;
    } catch (error) {
      logger.error('Error deleting device:', error);
      throw error;
    }
  }

  async toggleAutomaticMode(deviceId, isAutomatic) {
    try {
      return await this.updateDevice(deviceId, { isAutomatic });
    } catch (error) {
      logger.error('Error toggling automatic mode:', error);
      throw error;
    }
  }
}

module.exports = new ActuatorService();
