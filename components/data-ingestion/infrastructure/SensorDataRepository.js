// Data Ingestion - Infrastructure - SensorData Repository
const SensorData = require('../domain/SensorData');
const SensorRepository = require('./SensorRepository');
const logger = require('../../../shared-kernel/utils/logger');

const SENSOR_POPULATE = [
  {
    path: 'sensor',
    populate: [
      { path: 'sensorType' },
      { path: 'farmId' },
      { path: 'zoneId' }
    ]
  },
  { path: 'sensorType' },
  { path: 'farmId' },
  { path: 'zoneId' }
];

class SensorDataRepository {
  async create(sensorDataObj) {
    try {
      const data = new SensorData(sensorDataObj);
      await data.save();
      return await data.populate(SENSOR_POPULATE);
    } catch (error) {
      logger.error('Error creating sensor data:', error);
      throw error;
    }
  }

  async findBySensorId(sensorId, limit = 100) {
    try {
      const sensor = await SensorRepository.findByCode(sensorId);
      if (!sensor) {
        return [];
      }

      return await SensorData.find({ sensor: sensor._id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate(SENSOR_POPULATE);
    } catch (error) {
      logger.error('Error finding sensor data:', error);
      throw error;
    }
  }

  async findByTimeRange(startTime, endTime, filters = {}) {
    try {
      const query = {
        timestamp: { $gte: startTime, $lte: endTime }
      };

      if (filters.sensorId || filters.sensorCode) {
        const sensor = await SensorRepository.findByCode(filters.sensorId || filters.sensorCode);
        if (!sensor) {
          return [];
        }
        query.sensor = sensor._id;
      } else if (filters.sensor) {
        query.sensor = filters.sensor;
      }

      return await SensorData.find(query)
        .sort({ timestamp: 1 })
        .populate(SENSOR_POPULATE);
    } catch (error) {
      logger.error('Error finding sensor data by time range:', error);
      throw error;
    }
  }

  async getLatestBySensorId(sensorId) {
    try {
      const sensor = await SensorRepository.findByCode(sensorId);
      if (!sensor) {
        return null;
      }

      return await SensorData.findOne({ sensor: sensor._id })
        .sort({ timestamp: -1 })
        .populate(SENSOR_POPULATE);
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
        .populate(SENSOR_POPULATE);
    } catch (error) {
      logger.error('Error getting recent sensor data:', error);
      throw error;
    }
  }

  async getAverageByTimeRange(sensorId, startTime, endTime) {
    try {
      const sensor = await SensorRepository.findByCode(sensorId);
      if (!sensor) {
        return null;
      }

      const result = await SensorData.aggregate([
        {
          $match: {
            sensor: sensor._id,
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
