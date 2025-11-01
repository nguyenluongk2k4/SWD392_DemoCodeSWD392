// Automation Engine - Application - Notification Service (UC09)
const AlertRepository = require('../infrastructure/AlertRepository');
const AlertingClients = require('../infrastructure/AlertingClients');
const logger = require('../../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');

class NotificationService {
  
  constructor() {
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen to alert creation events
    eventBus.on(Events.ALERT_CREATED, async (alertData) => {
      await this.handleNewAlert(alertData);
    });
    
    logger.info('👂 NotificationService subscribed to alert events');
  }
  
  /**
   * UC09: Handle new alert and send notifications
   */
  async handleNewAlert(alertData) {
    try {
      logger.info(`Handling new alert: ${alertData.title}`);
      
      // Create alert in database
      const alert = await AlertRepository.create(alertData);
      
      // Determine notification channels and recipients
      const { channels, recipients } = await this.getNotificationSettings(alert);
      
      if (channels.length === 0 || recipients.length === 0) {
        logger.info('No notification channels or recipients configured');
        return alert;
      }
      
      // Send notifications
      const notifications = await this.sendNotifications(
        channels,
        recipients,
        alert
      );
      
      // Update alert with notification status
      alert.notifications = notifications;
      await alert.save();
      
      // Emit WebSocket event for real-time updates
      eventBus.emit(Events.ALERT_NOTIFIED, {
        alert,
        notifications
      });
      
      logger.info(`✅ Alert notifications sent: ${alert._id}`);
      
      return alert;
      
    } catch (error) {
      logger.error('Error handling new alert:', error);
      throw error;
    }
  }
  
  /**
   * Get notification settings based on alert
   */
  async getNotificationSettings(alert) {
    try {
      // Default channels based on severity
      let channels = [];
      
      switch (alert.severity) {
        case 'critical':
          channels = ['email', 'sms', 'push'];
          break;
        case 'high':
          channels = ['email', 'push'];
          break;
        case 'medium':
          channels = ['email'];
          break;
        case 'low':
          channels = ['websocket']; // Only real-time, no persistent notification
          break;
      }
      
      // Get recipients from threshold action or default
      let recipients = [];
      
      const thresholdDoc = alert.threshold?.thresholdId;

      if (thresholdDoc && thresholdDoc.action && thresholdDoc.action.recipients) {
        recipients = thresholdDoc.action.recipients;
      } else {
        // Default recipients - in production, get from user preferences
        recipients = this.getDefaultRecipients(alert);
      }
      
      return { channels, recipients };
      
    } catch (error) {
      logger.error('Error getting notification settings:', error);
      return { channels: [], recipients: [] };
    }
  }
  
  /**
   * Get default recipients for alerts
   */
  getDefaultRecipients(alert) {
    // In production, this should query users with notification preferences
    // For now, return from config or mock data
    return ['admin@example.com']; // Mock recipient
  }
  
  /**
   * UC09: Send notifications via multiple channels
   */
  async sendNotifications(channels, recipients, alert) {
    try {
      const notifications = [];
      
      for (const channel of channels) {
        if (channel === 'websocket') {
          // WebSocket is handled by eventBus
          continue;
        }
        
        for (const recipient of recipients) {
          let result;
          
          switch (channel) {
            case 'email':
              result = await AlertingClients.sendEmail(
                recipient,
                alert.title,
                alert.message
              );
              break;
              
            case 'sms':
              result = await AlertingClients.sendSMS(
                recipient,
                `${alert.title}: ${alert.message}`
              );
              break;
              
            case 'push':
              result = await AlertingClients.sendPushNotification(
                recipient,
                alert.title,
                alert.message,
                { alertId: alert._id }
              );
              break;
              
            default:
              logger.warn(`Unknown notification channel: ${channel}`);
              continue;
          }
          
          notifications.push({
            channel,
            recipient,
            status: result.status,
            sentAt: new Date(),
            error: result.error || null
          });
        }
      }
      
      return notifications;
      
    } catch (error) {
      logger.error('Error sending notifications:', error);
      return [];
    }
  }
  
  /**
   * UC09: Get all alerts with pagination
   */
  async getAlerts(filters = {}) {
    try {
      return await AlertRepository.findAll(filters);
    } catch (error) {
      logger.error('Error getting alerts:', error);
      throw error;
    }
  }
  
  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      return await AlertRepository.findActive();
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      throw error;
    }
  }
  
  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId, userId) {
    try {
      const alert = await AlertRepository.findById(alertId);
      
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      await alert.acknowledge(userId);
      
      eventBus.emit(Events.ALERT_ACKNOWLEDGED, { alert, userId });
      
      logger.info(`Alert acknowledged: ${alertId} by user ${userId}`);
      
      return alert;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }
  
  /**
   * Resolve alert
   */
  async resolveAlert(alertId, userId, notes) {
    try {
      const alert = await AlertRepository.findById(alertId);
      
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      await alert.resolve(userId, notes);
      
      eventBus.emit(Events.ALERT_RESOLVED, { alert, userId });
      
      logger.info(`Alert resolved: ${alertId} by user ${userId}`);
      
      return alert;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }
  
  /**
   * Get alert statistics
   */
  async getAlertStatistics(filters = {}) {
    try {
      return await AlertRepository.getStatistics(filters);
    } catch (error) {
      logger.error('Error getting alert statistics:', error);
      throw error;
    }
  }
  
  /**
   * Test notification delivery
   */
  async testNotification(channel, recipient, message) {
    try {
      logger.info(`Testing ${channel} notification to ${recipient}`);
      
      let result;
      
      switch (channel) {
        case 'email':
          result = await AlertingClients.sendEmail(
            recipient,
            'Test Notification - Smart Agriculture System',
            message || 'This is a test notification from Smart Agriculture System.'
          );
          break;
          
        case 'sms':
          result = await AlertingClients.sendSMS(
            recipient,
            message || 'Test SMS from Smart Agriculture System'
          );
          break;
          
        case 'push':
          result = await AlertingClients.sendPushNotification(
            recipient,
            'Test Notification',
            message || 'This is a test push notification.'
          );
          break;
          
        default:
          throw new Error(`Unknown notification channel: ${channel}`);
      }
      
      return result;
      
    } catch (error) {
      logger.error('Error testing notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
