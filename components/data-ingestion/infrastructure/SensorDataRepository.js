// Data Ingestion - Infrastructure - SensorData Repository
const SensorData = require('../domain/SensorData');
const logger = require('../../../shared-kernel/utils/logger');

class SensorDataRepository {
  async create(sensorDataObj) {
    try {
      const data = new SensorData(sensorDataObj);
      await data.save();
      return data;
    } catch (error) {
      logger.error('Error creating sensor data:', error);
      throw error;
    }
  }

  async findBySensorId(sensorId, limit = 100) {
    try {
      return await SensorData.find({ sensorId })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      logger.error('Error finding sensor data:', error);
      throw error;
    }
  }

  async findByTimeRange(startTime, endTime, filters = {}) {
    try {
      const query = {
        timestamp: { $gte: startTime, $lte: endTime },
        ...filters,
      };
      return await SensorData.find(query).sort({ timestamp: 1 });
    } catch (error) {
      logger.error('Error finding sensor data by time range:', error);
      throw error;
    }
  }

  async getLatestBySensorId(sensorId) {
    try {
      return await SensorData.findOne({ sensorId }).sort({ timestamp: -1 });
    } catch (error) {
      logger.error('Error getting latest sensor data:', error);
      throw error;
    }
  }

  async getRecentData(limit = 10) {
    try {
      return await SensorData.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('sensorId', 'sensorType value timestamp');
    } catch (error) {
      logger.error('Error getting recent sensor data:', error);
      throw error;
    }
  }

  async getAverageByTimeRange(sensorId, startTime, endTime) {
    try {
      const result = await SensorData.aggregate([
        {
          $match: {
            sensorId,
            timestamp: { $gte: startTime, $lte: endTime },
          },
        },
        {
          $group: {
            _id: null,
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            count: { $sum: 1 },
          },
        },
      ]);

      return result[0] || null;
    } catch (error) {
      logger.error('Error calculating average sensor data:', error);
      throw error;
    }
  }
}

module.exports = new SensorDataRepository();
