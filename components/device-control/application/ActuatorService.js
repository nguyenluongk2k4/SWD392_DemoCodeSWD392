// Device Control - Application - Actuator Service (UC03)
const ActuatorRepository = require('../infrastructure/ActuatorRepository');
const MqttPublishService = require('../infrastructure/MqttPublishService');
const { getGrpcClient } = require('../infrastructure/GrpcClient');
const config = require('../../../shared-kernel/config');
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

      // Resolve toggle into explicit on/off action for downstream services
      let resolvedAction = operation.action;
      if (operation.action === 'toggle') {
        const currentStatus = (device.status || '').toLowerCase();
        resolvedAction = currentStatus === 'on' ? 'off' : 'on';
        logger.info(`Toggle requested for ${device.deviceId}. Switching from ${currentStatus || 'unknown'} to ${resolvedAction}.`);
      }

      // Check if device is in automatic mode
      if (device.mode === 'auto' && operation.requestedBy === 'user') {
        logger.warn(`Device ${device.deviceId} is in automatic mode. Manual control may be overridden.`);
      }

      // Send MQTT command when enabled
      try {
        MqttPublishService.publishControlCommand(device.deviceId, resolvedAction);
      } catch (mqttError) {
        logger.warn(`MQTT publish failed for ${device.deviceId}: ${mqttError.message}`);
      }

      // Attempt gRPC control when enabled
      let grpcResponse = null;
      if (config.grpc?.enabled) {
        const addressFromTarget = typeof target === 'object' && target ? target.address : undefined;
        const addressFromConfig = config.grpc.actuators?.[device.deviceId];
        const grpcAddress = addressFromTarget || device.address || addressFromConfig || config.grpc.actuatorAddress;

        try {
          const grpcClient = await getGrpcClient();
          const grpcAction = resolvedAction === 'on' ? 'TURN_ON' : 'TURN_OFF';
          grpcResponse = await grpcClient.controlActuator(device.deviceId, grpcAction, grpcAddress);
          logger.info(`gRPC control success for ${device.deviceId} at ${grpcAddress}: ${grpcAction}`);
        } catch (grpcError) {
          logger.error(`gRPC control failed for ${device.deviceId}: ${grpcError.message}`);
        }
      }

      // Update device status in database
      const updatedDevice = await ActuatorRepository.updateStatus(
        { deviceId: device.deviceId, actuatorId: device._id },
        resolvedAction,
        operation.requestedBy
      );

      // Publish event
      eventBus.publish(Events.DEVICE_CONTROLLED, {
        deviceId: device.deviceId,
        command: resolvedAction,
        controlledBy: operation.requestedBy,
        triggeredBy: operation.triggeredBy,
        grpcResponse,
        timestamp: new Date(),
      });

      logger.info(`✅ Device ${device.deviceId} controlled: ${resolvedAction} by ${operation.requestedBy}`);

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

  async getDeviceById(deviceId) {
    try {
      return await ActuatorRepository.findById(deviceId);
    } catch (error) {
      logger.error('Error getting device by ID:', error);
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

  /**
   * Update actuator status (used after gRPC control)
   * @param {string} deviceId - Device ID
   * @param {object} statusData - Status data to update (status, lastCommand, updatedAt)
   * @returns {Promise<object>} Updated device
   */
  async updateActuatorStatus(deviceId, statusData) {
    try {
      const device = await ActuatorRepository.findById(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      // Update device with new status
      const updatedDevice = await ActuatorRepository.updateStatus(
        { deviceId, actuatorId: device._id },
        statusData.status,
        'grpc',
        statusData
      );

      // Publish event for status update
      eventBus.publish(Events.ACTUATOR_STATUS_CHANGED, {
        deviceId,
        status: statusData.status,
        lastCommand: statusData.lastCommand,
        controlMethod: 'grpc',
        timestamp: new Date()
      });

      logger.info(`Actuator ${deviceId} status updated to ${statusData.status}`);
      return updatedDevice;
    } catch (error) {
      logger.error(`Error updating actuator status: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ActuatorService();
