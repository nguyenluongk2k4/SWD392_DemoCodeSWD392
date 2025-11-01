// Data Ingestion - Infrastructure - Sensor Repository
// Provides helper methods to resolve sensor master data required by the new normalized schema.

const { Sensor } = require('../../../database_schemas');
const logger = require('../../../shared-kernel/utils/logger');

class SensorRepository {
  async findByCode(sensorCode, { populateRelations = true } = {}) {
    try {
      if (!sensorCode) {
        return null;
      }

      const query = Sensor.findOne({ sensorId: sensorCode });

      if (populateRelations) {
        query.populate([
          { path: 'sensorType' },
          { path: 'farmId' },
          { path: 'zoneId' }
        ]);
      }

      return await query.exec();
    } catch (error) {
      logger.error('Error resolving sensor by code:', error);
      throw error;
    }
  }
}

module.exports = new SensorRepository();
