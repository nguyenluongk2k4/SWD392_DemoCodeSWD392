// Data Ingestion - Application - Data Collector Service
const SensorDataRepository = require('../infrastructure/SensorDataRepository');
const SensorRepository = require('../infrastructure/SensorRepository');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const logger = require('../../../shared-kernel/utils/logger');

class DataCollectorService {
  constructor() {
    // Subscribe to sensor data events
    eventBus.subscribe(Events.SENSOR_DATA_RECEIVED, this.handleSensorData.bind(this));
  }

  async handleSensorData(eventData) {
    try {
      if (!eventData || !eventData.data) {
        logger.warn('Sensor data event missing payload');
        return;
      }

      const normalization = await this.normalizeSensorData(eventData.data);

      if (!normalization) {
        logger.warn('Invalid sensor data received:', eventData.data);
        return;
      }

      const savedData = await SensorDataRepository.create(normalization.document);

      logger.info(`✅ Sensor data saved: ${normalization.sensor.sensorId} - ${savedData.value}`);

      eventBus.publish(Events.SENSOR_DATA_PROCESSED, {
        sensorData: savedData,
        sensor: normalization.sensor,
        sensorType: normalization.sensorType,
        farm: normalization.farm,
        zone: normalization.zone,
        value: savedData.value,
        quality: savedData.quality,
        timestamp: savedData.timestamp,
        rawPayload: eventData.data,
        sourceTopic: eventData.topic,
        receivedAt: eventData.timestamp || new Date()
      });

    } catch (error) {
      logger.error('Error handling sensor data:', error);
    }
  }

  async normalizeSensorData(data) {
    try {
      if (!data.sensorId || data.value === undefined) {
        return null;
      }

      const sensor = await SensorRepository.findByCode(data.sensorId);

      if (!sensor) {
        logger.warn(`Sensor master data not found for sensorId=${data.sensorId}`);
        return null;
      }

      const sensorType = sensor.sensorType || null;
      const farm = sensor.farmId || null;
      const zone = sensor.zoneId || null;

      const numericValue = Number(data.value);
      if (Number.isNaN(numericValue)) {
        return null;
      }

      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

      return {
        sensor,
        sensorType,
        farm,
        zone,
        document: {
          sensor: sensor._id,
          value: numericValue,
          timestamp,
          quality: this.determineQuality(sensorType?.name, numericValue),
          metadata: {
            batteryLevel: data?.metadata?.batteryLevel ?? data?.batteryLevel,
            signalStrength: data?.metadata?.signalStrength ?? data?.signalStrength
          }
        }
      };
    } catch (error) {
      logger.error('Error normalizing sensor data:', error);
      return null;
    }
  }

  determineQuality(sensorTypeName, value) {
    // Simple quality determination logic
    const thresholds = {
      temperature: { min: 15, max: 35 },
      humidity: { min: 40, max: 80 },
      'soil-moisture': { min: 30, max: 70 },
      ph: { min: 6, max: 7.5 },
    };

    const normalizedType = (sensorTypeName || '').toLowerCase();
    const threshold = thresholds[normalizedType];
    if (!threshold) return 'good';

    if (value < threshold.min || value > threshold.max) {
      return 'critical';
    } else if (value < threshold.min * 1.1 || value > threshold.max * 0.9) {
      return 'warning';
    }

    return 'good';
  }

  async getRecentDataBySensorId(sensorId, limit = 100) {
    try {
      return await SensorDataRepository.findBySensorId(sensorId, limit);
    } catch (error) {
      logger.error('Error getting recent data by sensor ID:', error);
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

  async getRecentData(limit = 10) {
    try {
      return await SensorDataRepository.getRecentData(limit);
    } catch (error) {
      logger.error('Error getting recent data:', error);
      throw error;
    }
  }
}

module.exports = new DataCollectorService();
