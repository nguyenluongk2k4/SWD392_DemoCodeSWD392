// Device Control - Infrastructure - Actuator Repository
const Actuator = require('../domain/Actuator');
const logger = require('../../../shared-kernel/utils/logger');

class ActuatorRepository {
  async create(actuatorData) {
    try {
      const actuator = new Actuator(actuatorData);
      await actuator.save();
      return actuator;
    } catch (error) {
      logger.error('Error creating actuator:', error);
      throw error;
    }
  }

  async findById(deviceId) {
    try {
      return await Actuator.findOne({ deviceId });
    } catch (error) {
      logger.error('Error finding actuator:', error);
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      return await Actuator.find(filters);
    } catch (error) {
      logger.error('Error finding all actuators:', error);
      throw error;
    }
  }

  async updateStatus(deviceId, status, controlledBy = 'system') {
    try {
      return await Actuator.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            status,
            'lastControlled.by': controlledBy,
            'lastControlled.at': new Date(),
            'lastControlled.action': status,
          },
        },
        { new: true }
      );
    } catch (error) {
      logger.error('Error updating actuator status:', error);
      throw error;
    }
  }

  async update(deviceId, updateData) {
    try {
      return await Actuator.findOneAndUpdate(
        { deviceId },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error('Error updating actuator:', error);
      throw error;
    }
  }

  async delete(deviceId) {
    try {
      return await Actuator.findOneAndDelete({ deviceId });
    } catch (error) {
      logger.error('Error deleting actuator:', error);
      throw error;
    }
  }
}

module.exports = new ActuatorRepository();
