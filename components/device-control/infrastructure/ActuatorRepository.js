// Device Control - Infrastructure - Actuator Repository
const Actuator = require('../domain/Actuator');
const logger = require('../../../shared-kernel/utils/logger');

const ACTUATOR_POPULATE = [
  { path: 'actuatorType' },
  { path: 'farmId' },
  { path: 'zoneId' }
];

class ActuatorRepository {
  async create(actuatorData) {
    try {
      const actuator = new Actuator(actuatorData);
      await actuator.save();
      return await actuator.populate(ACTUATOR_POPULATE);
    } catch (error) {
      logger.error('Error creating actuator:', error);
      throw error;
    }
  }

  async findById(deviceId) {
    try {
      return await Actuator.findOne({ deviceId }).populate(ACTUATOR_POPULATE);
    } catch (error) {
      logger.error('Error finding actuator by deviceId:', error);
      throw error;
    }
  }

  async findByObjectId(actuatorId) {
    try {
      return await Actuator.findById(actuatorId).populate(ACTUATOR_POPULATE);
    } catch (error) {
      logger.error('Error finding actuator by objectId:', error);
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      return await Actuator.find(filters).populate(ACTUATOR_POPULATE);
    } catch (error) {
      logger.error('Error finding all actuators:', error);
      throw error;
    }
  }

  async updateStatus({ deviceId, actuatorId }, status, source = 'system') {
    try {
      const query = actuatorId ? { _id: actuatorId } : { deviceId };
      return await Actuator.findOneAndUpdate(
        query,
        {
          $set: {
            status,
            'lastCommand.action': status,
            'lastCommand.timestamp': new Date(),
            'lastCommand.source': source
          }
        },
        { new: true }
      ).populate(ACTUATOR_POPULATE);
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
      ).populate(ACTUATOR_POPULATE);
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
