// Automation Engine - Application - Automation Service (UC04)
// Core logic for automatic irrigation/ventilation
const mongoose = require('mongoose');
const ThresholdService = require('./ThresholdService');
const ActuatorService = require('../../device-control/application/ActuatorService');
const logger = require('../../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');

class AutomationService {
  
  constructor() {
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners for sensor data
   */
  setupEventListeners() {
    // Listen to sensor data events
    eventBus.on(Events.SENSOR_DATA_PROCESSED, async (sensorEvent) => {
      await this.evaluateSensorData(sensorEvent);
    });
    
    logger.info('👂 AutomationService subscribed to processed sensor data events');
  }
  
  /**
   * UC04: Evaluate sensor data against thresholds
   */
  async evaluateSensorData(sensorEvent) {
    try {
      if (!sensorEvent) {
        return;
      }

      const {
        sensorType,
        sensor,
        value,
        zone,
        farm,
        sensorData
      } = sensorEvent;

      const sensorTypeName = sensorType?.name || 'unknown';
      const sensorCode = sensor?.sensorId || sensorEvent.rawPayload?.sensorId || 'unknown';

      logger.info(`Evaluating sensor data: ${sensorTypeName} = ${value}`);

      // Get active thresholds for this sensor type / location
      const thresholds = await ThresholdService.getActiveThresholds({
        sensorTypeId: sensorType?._id,
        farmId: farm?._id,
        zoneId: zone?._id
      });
      
      if (thresholds.length === 0) {
        logger.debug(`No active thresholds for sensor ${sensorCode} (${sensorTypeName})`);
        return;
      }
      
      // Check each threshold
      for (const threshold of thresholds) {
        // Check if threshold is violated
        if (threshold.isViolated && threshold.isViolated(value)) {
          const violationType = threshold.getViolationType(value);
          
          logger.warn(`⚠️  Threshold violated: ${threshold.name} (${violationType})`);
          
          // Execute action
          await this.executeThresholdAction(threshold, sensorEvent, violationType);
          
          // Emit event
          eventBus.emit(Events.THRESHOLD_EXCEEDED, {
            threshold,
            sensorData,
            violationType
          });
        }
      }
      
    } catch (error) {
      logger.error('Error evaluating sensor data:', error);
    }
  }
  
  /**
   * UC04: Execute action when threshold is exceeded
   */
  async executeThresholdAction(threshold, sensorEvent, violationType) {
    try {
      const { action } = threshold;
      if (!action) {
        logger.warn(`Threshold ${threshold.name} has no action defined`);
        return;
      }

      logger.info(`Executing threshold action: ${action.type}`);
      const { sensorData } = sensorEvent;
      
      // Control device
      if (action.type === 'device' || action.type === 'both') {
        if ((action.actuator || action.deviceId) && action.deviceAction) {
          await this.controlDevice(action.actuator, action.deviceId, action.deviceAction, threshold, sensorData);
        }
      }
      
      // Send alert
      if (action.type === 'alert' || action.type === 'both') {
        await this.createAlert(threshold, sensorEvent, violationType);
      }
      
    } catch (error) {
      logger.error('Error executing threshold action:', error);
      throw error;
    }
  }
  
  /**
   * Control device based on threshold action
   */
  async controlDevice(actuatorRef, deviceIdFallback, deviceAction, threshold, sensorData) {
    try {
      const actuatorId = actuatorRef && actuatorRef._id
        ? actuatorRef._id
        : (mongoose.isValidObjectId(actuatorRef) ? actuatorRef : undefined);
      const deviceId = deviceIdFallback || (actuatorRef && actuatorRef.deviceId) || undefined;

      if (!deviceId && !actuatorId) {
        logger.warn('No actuator reference provided for control action');
        return;
      }

      logger.info(`Auto-controlling device: ${deviceId || actuatorId} → ${deviceAction}`);

      await ActuatorService.controlDevice({
        deviceId,
        actuatorId,
        action: deviceAction,
        mode: 'auto',
        triggeredBy: {
          type: 'threshold',
          thresholdId: threshold._id,
          sensorData
        }
      });
      
  logger.info(`✅ Device ${deviceId || actuatorId} controlled successfully`);
      
    } catch (error) {
      logger.error('Error controlling device:', error);
      throw error;
    }
  }
  
  /**
   * Create alert when threshold is exceeded
   */
  async createAlert(threshold, sensorEvent, violationType) {
    try {
      const severity = this.calculateSeverity(threshold, sensorEvent.value, violationType);

      const { sensor, sensorType, sensorData, farm, zone } = sensorEvent;
      const alertData = {
        type: 'threshold',
        severity,
        title: `${threshold.name} Exceeded`,
        message: this.generateAlertMessage(threshold, sensorEvent, violationType),
        threshold: {
          thresholdId: threshold._id,
          thresholdName: threshold.name,
          expectedRange: {
            min: threshold.minValue,
            max: threshold.maxValue
          }
        },
        sensorData: {
          sensorDataId: sensorData?._id,
          sensor: sensor?._id,
          value: sensorEvent.value,
          timestamp: sensorEvent.timestamp || new Date()
        },
        farmId: farm?._id,
        zoneId: zone?._id
      };
      
      // This will be handled by NotificationService
      eventBus.emit(Events.ALERT_CREATED, alertData);
      
      logger.info(`Alert created for threshold: ${threshold.name}`);
      
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }
  
  /**
   * Calculate alert severity based on how much threshold is violated
   */
  calculateSeverity(threshold, value, violationType) {
    const range = threshold.maxValue - threshold.minValue;
    let deviation;
    
    if (violationType === 'below_min') {
      deviation = Math.abs(value - threshold.minValue);
    } else {
      deviation = Math.abs(value - threshold.maxValue);
    }
    
    const deviationPercent = (deviation / range) * 100;
    
    if (deviationPercent > 50) return 'critical';
    if (deviationPercent > 30) return 'high';
    if (deviationPercent > 10) return 'medium';
    return 'low';
  }
  
  /**
   * Generate human-readable alert message
   */
  generateAlertMessage(threshold, sensorEvent, violationType) {
    const { sensorType, value } = sensorEvent;
    const { minValue, maxValue } = threshold;

    const displayType = sensorType?.displayName || sensorType?.name || 'Sensor';
    let message = `${displayType} reading is ${value}`;

    if (violationType === 'below_min') {
      message += `, which is below the minimum threshold of ${minValue}.`;
    } else {
      message += `, which exceeds the maximum threshold of ${maxValue}.`;
    }

    if (threshold.action?.actuator || threshold.action?.deviceId) {
      message += ` Automatic action has been triggered.`;
    }

    return message;
  }
  
  /**
   * Get automation statistics
   */
  async getAutomationStatistics(period = '24h') {
    try {
      // This would query historical data
      // For now, return mock statistics
      return {
        period,
        totalEvaluations: 0,
        thresholdsExceeded: 0,
        devicesControlled: 0,
        alertsSent: 0
      };
    } catch (error) {
      logger.error('Error getting automation statistics:', error);
      throw error;
    }
  }
}

module.exports = new AutomationService();
