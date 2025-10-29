// Data Ingestion - Application - Data Collector Service
const SensorDataRepository = require('../infrastructure/SensorDataRepository');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const logger = require('../../../shared-kernel/utils/logger');

class DataCollectorService {
  constructor() {
    // Subscribe to sensor data events
    eventBus.subscribe(Events.SENSOR_DATA_RECEIVED, this.handleSensorData.bind(this));
  }

  async handleSensorData(eventData) {
    try {
      const { data } = eventData;
      
      // Parse and validate sensor data
      const sensorData = this.parseSensorData(data);
      
      if (!sensorData) {
        logger.warn('Invalid sensor data received:', data);
        return;
      }

      // Save to database
      const savedData = await SensorDataRepository.create(sensorData);
      
      logger.info(`✅ Sensor data saved: ${savedData.sensorId} - ${savedData.value}${savedData.unit}`);

      // Publish event for automation engine to check thresholds
      eventBus.publish(Events.SENSOR_DATA_RECEIVED, {
        sensorData: savedData,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Error handling sensor data:', error);
    }
  }

  parseSensorData(data) {
    try {
      // Validate required fields
      if (!data.sensorId || !data.sensorType || data.value === undefined) {
        return null;
      }

      return {
        sensorId: data.sensorId,
        sensorType: data.sensorType,
        value: parseFloat(data.value),
        unit: data.unit || this.getDefaultUnit(data.sensorType),
        location: data.location || {},
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        quality: this.determineQuality(data.sensorType, data.value),
      };
    } catch (error) {
      logger.error('Error parsing sensor data:', error);
      return null;
    }
  }

  getDefaultUnit(sensorType) {
    const unitMap = {
      temperature: '°C',
      humidity: '%',
      soil_moisture: '%',
      light: 'lux',
      ph: 'pH',
      nutrient: 'ppm',
    };
    return unitMap[sensorType] || '';
  }

  determineQuality(sensorType, value) {
    // Simple quality determination logic
    const thresholds = {
      temperature: { min: 15, max: 35 },
      humidity: { min: 40, max: 80 },
      soil_moisture: { min: 30, max: 70 },
      ph: { min: 6, max: 7.5 },
    };

    const threshold = thresholds[sensorType];
    if (!threshold) return 'good';

    if (value < threshold.min || value > threshold.max) {
      return 'critical';
    } else if (value < threshold.min * 1.1 || value > threshold.max * 0.9) {
      return 'warning';
    }

    return 'good';
  }

  async getRecentData(sensorId, limit = 100) {
    try {
      return await SensorDataRepository.findBySensorId(sensorId, limit);
    } catch (error) {
      logger.error('Error getting recent data:', error);
      throw error;
    }
  }

  async getDataByTimeRange(startTime, endTime, filters = {}) {
    try {
      return await SensorDataRepository.findByTimeRange(startTime, endTime, filters);
    } catch (error) {
      logger.error('Error getting data by time range:', error);
      throw error;
    }
  }

  async getLatestData(sensorId) {
    try {
      return await SensorDataRepository.getLatestBySensorId(sensorId);
    } catch (error) {
      logger.error('Error getting latest data:', error);
      throw error;
    }
  }
}

module.exports = new DataCollectorService();
