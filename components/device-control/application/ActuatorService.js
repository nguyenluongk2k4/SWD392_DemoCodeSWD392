// Device Control - Application - Actuator Service (UC03)
const ActuatorRepository = require('../infrastructure/ActuatorRepository');
const MqttPublishService = require('../infrastructure/MqttPublishService');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const logger = require('../../../shared-kernel/utils/logger');

class ActuatorService {
  async controlDevice(target, command, controlledBy = 'user') {
    try {
      // Validate device exists
      const operation = {
        deviceId: typeof target === 'string' ? target : target?.deviceId,
        actuatorId: typeof target === 'object' && target ? target.actuatorId : undefined,
        action: typeof target === 'object' && target ? target.action || command : command,
        requestedBy: typeof target === 'object' && target && target.mode === 'auto' ? 'system' : controlledBy,
        triggeredBy: typeof target === 'object' && target ? target.triggeredBy : undefined,
        mode: typeof target === 'object' && target && target.mode ? target.mode : undefined
      };

      if (!operation.deviceId && !operation.actuatorId) {
        throw new Error('Device reference is required');
      }

      const device = operation.actuatorId
        ? await ActuatorRepository.findByObjectId(operation.actuatorId)
        : await ActuatorRepository.findById(operation.deviceId);

      if (!device) {
        throw new Error('Device not found');
      }

      // Validate command
      if (!['on', 'off', 'toggle'].includes(operation.action)) {
        throw new Error('Invalid command. Use "on", "off" or "toggle"');
      }

      // Check if device is in automatic mode
      if (device.mode === 'auto' && operation.requestedBy === 'user') {
        logger.warn(`Device ${device.deviceId} is in automatic mode. Manual control may be overridden.`);
      }

      // Send MQTT command
      MqttPublishService.publishControlCommand(device.deviceId, operation.action);

      // Update device status in database
      const updatedDevice = await ActuatorRepository.updateStatus(
        { deviceId: device.deviceId, actuatorId: device._id },
        operation.action,
        operation.requestedBy
      );

      // Publish event
      eventBus.publish(Events.DEVICE_CONTROLLED, {
        deviceId: device.deviceId,
        command: operation.action,
        controlledBy: operation.requestedBy,
        triggeredBy: operation.triggeredBy,
        timestamp: new Date(),
      });

      logger.info(`✅ Device ${device.deviceId} controlled: ${operation.action} by ${operation.requestedBy}`);

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

      const payload = { ...deviceData };
      if (payload.isAutomatic !== undefined && !payload.mode) {
        payload.mode = payload.isAutomatic ? 'auto' : 'manual';
        delete payload.isAutomatic;
      }

      const device = await ActuatorRepository.create(payload);
      logger.info(`Device registered: ${device.deviceId}`);
      
      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  async updateDevice(deviceId, updateData) {
    try {
      const payload = { ...updateData };
      if (payload.isAutomatic !== undefined) {
        payload.mode = payload.isAutomatic ? 'auto' : 'manual';
        delete payload.isAutomatic;
      }

      const device = await ActuatorRepository.update(deviceId, payload);
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
      const mode = isAutomatic ? 'auto' : 'manual';
      return await this.updateDevice(deviceId, { mode });
    } catch (error) {
      logger.error('Error toggling automatic mode:', error);
      throw error;
    }
  }
}

module.exports = new ActuatorService();
