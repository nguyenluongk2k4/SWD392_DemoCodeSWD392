// Automation Engine - Application - Automation Service (UC04)
// Core logic for automatic irrigation/ventilation
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
    eventBus.on(Events.SENSOR_DATA_RECEIVED, async (sensorData) => {
      await this.evaluateSensorData(sensorData);
    });
    
    logger.info('👂 AutomationService subscribed to sensor data events');
  }
  
  /**
   * UC04: Evaluate sensor data against thresholds
   */
  async evaluateSensorData(sensorData) {
    try {
      const { sensorType, value, sensorId, farmZone } = sensorData;
      
      logger.info(`Evaluating sensor data: ${sensorType} = ${value}`);
      
      // Get active thresholds for this sensor type
      const thresholds = await ThresholdService.getActiveThresholdsBySensorType(sensorType);
      
      if (thresholds.length === 0) {
        logger.debug(`No active thresholds for sensor type: ${sensorType}`);
        return;
      }
      
      // Check each threshold
      for (const threshold of thresholds) {
        // Filter by farm zone if specified
        if (threshold.farmZone !== 'default' && threshold.farmZone !== farmZone) {
          continue;
        }
        
        // Check if threshold is violated
        if (threshold.isViolated(value)) {
          const violationType = threshold.getViolationType(value);
          
          logger.warn(`⚠️  Threshold violated: ${threshold.name} (${violationType})`);
          
          // Execute action
          await this.executeThresholdAction(threshold, sensorData, violationType);
          
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
  async executeThresholdAction(threshold, sensorData, violationType) {
    try {
      const { action } = threshold;
      
      logger.info(`Executing threshold action: ${action.type}`);
      
      // Control device
      if (action.type === 'control_device' || action.type === 'both') {
        if (action.deviceId && action.deviceAction) {
          await this.controlDevice(action.deviceId, action.deviceAction, threshold, sensorData);
        }
      }
      
      // Send alert
      if (action.type === 'send_alert' || action.type === 'both') {
        await this.createAlert(threshold, sensorData, violationType);
      }
      
    } catch (error) {
      logger.error('Error executing threshold action:', error);
      throw error;
    }
  }
  
  /**
   * Control device based on threshold action
   */
  async controlDevice(deviceId, deviceAction, threshold, sensorData) {
    try {
      logger.info(`Auto-controlling device: ${deviceId} → ${deviceAction}`);
      
      await ActuatorService.controlDevice({
        deviceId,
        action: deviceAction,
        mode: 'auto',
        triggeredBy: {
          type: 'threshold',
          thresholdId: threshold._id,
          sensorData
        }
      });
      
      logger.info(`✅ Device ${deviceId} controlled successfully`);
      
    } catch (error) {
      logger.error('Error controlling device:', error);
      throw error;
    }
  }
  
  /**
   * Create alert when threshold is exceeded
   */
  async createAlert(threshold, sensorData, violationType) {
    try {
      const severity = this.calculateSeverity(threshold, sensorData.value, violationType);
      
      const alertData = {
        type: 'threshold_exceeded',
        severity,
        title: `${threshold.name} Exceeded`,
        message: this.generateAlertMessage(threshold, sensorData, violationType),
        threshold: threshold._id,
        sensorData: {
          sensorId: sensorData.sensorId,
          sensorType: sensorData.sensorType,
          value: sensorData.value,
          timestamp: sensorData.timestamp || new Date()
        },
        farmZone: sensorData.farmZone || threshold.farmZone
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
  generateAlertMessage(threshold, sensorData, violationType) {
    const { sensorType, value } = sensorData;
    const { minValue, maxValue } = threshold;
    
    let message = `${sensorType} sensor reading is ${value}`;
    
    if (violationType === 'below_min') {
      message += `, which is below the minimum threshold of ${minValue}.`;
    } else {
      message += `, which exceeds the maximum threshold of ${maxValue}.`;
    }
    
    if (threshold.action.deviceId) {
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
