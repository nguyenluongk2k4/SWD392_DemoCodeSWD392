// Automation Engine - Infrastructure - SensorType Repository
// Helper repository to resolve sensor type master data.

const { SensorType } = require('../../../database_schemas');
const logger = require('../../../shared-kernel/utils/logger');

class SensorTypeRepository {
  async findByName(name) {
    try {
      if (!name) {
        return null;
      }

      return await SensorType.findOne({ name: name.toLowerCase() });
    } catch (error) {
      logger.error('Error finding sensor type by name:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await SensorType.findById(id);
    } catch (error) {
      logger.error('Error finding sensor type by id:', error);
      throw error;
    }
  }
}

module.exports = new SensorTypeRepository();
