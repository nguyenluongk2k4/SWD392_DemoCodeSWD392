// Automation Engine - Application - Notification Service (UC09)
const mongoose = require('mongoose');
const AlertRepository = require('../infrastructure/AlertRepository');
const AlertingClients = require('../infrastructure/AlertingClients');
const AutomationTaskService = require('./AutomationTaskService');
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
    // Listen to alert creation request events
    eventBus.on(Events.ALERT_CREATE_REQUEST, async (alertData) => {
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

      const historyEntries = [
        {
          event: 'alert_created',
          status: alert.status,
          detail: `Alert created with severity ${alert.severity}`,
          createdAt: new Date()
        }
      ];

      if (alertData.automation?.correlationId) {
        const linkedTasks = await AutomationTaskService.attachAlertToTasks(
          alertData.automation.correlationId,
          alert._id
        );

        if (linkedTasks.length) {
          const taskIds = linkedTasks.map((task) => task._id);
          const existingIds = (alert.automation?.taskIds || []).map((id) => id.toString());
          const combinedIds = Array.from(new Set([...existingIds, ...taskIds.map((id) => id.toString())]));
          alert.automation = {
            ...(alert.automation || {}),
            correlationId: alertData.automation.correlationId,
            taskIds: combinedIds.map((id) => new mongoose.Types.ObjectId(id)),
            lastTaskStatus: linkedTasks[0].status || alert.automation?.lastTaskStatus || 'pending'
          };

          historyEntries.push({
            event: 'automation_tasks_linked',
            status: alert.automation.lastTaskStatus,
            detail: `Linked ${linkedTasks.length} automation task(s)`,
            createdAt: new Date()
          });
        } else {
          alert.automation = {
            ...(alert.automation || {}),
            correlationId: alertData.automation.correlationId,
            lastTaskStatus: alert.automation?.lastTaskStatus || 'pending'
          };
        }
      }
      
      // Determine notification channels and recipients
      const { channels, recipients } = await this.getNotificationSettings(alert);
      
      if (channels.length === 0 || recipients.length === 0) {
        logger.info('No notification channels or recipients configured');
        alert.history = [...(alert.history || []), ...historyEntries];
        await alert.save();
        return alert;
      }
      
      // Send notifications
      const { notifications = [], attempts = [] } = await this.sendNotifications(
        channels,
        recipients,
        alert
      );
      
      // Update alert with notification status
      alert.notifications = notifications;
      historyEntries.push(...attempts);

      const hasAttempt = attempts.length > 0 || notifications.length > 0;
      if (hasAttempt) {
        const hasSuccess = notifications.some((item) => item.status === 'sent') ||
          attempts.some((item) => item.status === 'sent');
        alert.status = hasSuccess ? 'notified' : 'notification_failed';
        historyEntries.push({
          event: 'notification_summary',
          status: alert.status,
          detail: hasSuccess ? 'At least one channel succeeded' : 'All channels failed',
          createdAt: new Date()
        });
      }

      alert.history = [...(alert.history || []), ...historyEntries];
      await alert.save();

      eventBus.emit(Events.ALERT_CREATED, { alert });
      
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
      // Simplified: Only email channel based on severity
      let channels = [];
      
      switch (alert.severity) {
        case 'critical':
        case 'high':
        case 'medium':
          channels = ['email']; // Only email for all important alerts
          break;
        case 'low':
          channels = ['websocket']; // Only real-time WebSocket, no email
          break;
      }
      
      // Get recipients from threshold action or default
      let recipients = [];
      
      const thresholdDoc = alert.threshold?.thresholdId;

      if (thresholdDoc && thresholdDoc.action && thresholdDoc.action.recipients) {
        recipients = thresholdDoc.action.recipients;
      } else {
        // Default recipients - get from config or database
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
    // In production, query users with notification preferences from database
    // For demo, return from environment variable or default
    const defaultEmail = process.env.DEFAULT_ALERT_EMAIL || 'admin@smartagri.com';
    return [defaultEmail];
  }
  
  /**
   * UC09: Send notifications via email only
   */
  async sendNotifications(channels, recipients, alert) {
    try {
      const notifications = [];
      const attempts = [];
      
      for (const channel of channels) {
        if (channel === 'websocket') {
          // WebSocket is handled by eventBus, skip here
          attempts.push({
            event: 'notification_attempt',
            status: 'skipped',
            channel,
            detail: 'Handled via WebSocket broadcast',
            createdAt: new Date()
          });
          continue;
        }
        
        if (channel === 'email') {
          for (const recipient of recipients) {
            attempts.push({
              event: 'notification_attempt',
              status: 'pending',
              channel,
              recipient,
              createdAt: new Date()
            });
            const result = await AlertingClients.sendEmail(
              recipient,
              alert.title,
              alert.message
            );
            
            notifications.push({
              channel: 'email',
              recipient,
              status: result.status,
              sentAt: new Date(),
              messageId: result.messageId || null,
              error: result.error || null
            });

            attempts.push({
              event: 'notification_result',
              status: result.status,
              channel,
              recipient,
              detail: result.error || result.messageId || 'Email processed',
              createdAt: new Date()
            });
          }
        } else {
          logger.warn(`⚠️ Unsupported notification channel: ${channel}`);
          attempts.push({
            event: 'notification_attempt',
            status: 'skipped',
            channel,
            detail: 'Unsupported channel',
            createdAt: new Date()
          });
        }
      }
      
      return { notifications, attempts };
      
    } catch (error) {
      logger.error('Error sending notifications:', error);
      return {
        notifications: [],
        attempts: [{
          event: 'notification_error',
          status: 'failed',
          channel: 'system',
          detail: error.message,
          createdAt: new Date()
        }]
      };
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
   * Test notification delivery (email only)
   */
  async testNotification(channel, recipient, message) {
    try {
      logger.info(`Testing ${channel} notification to ${recipient}`);
      
      if (channel !== 'email') {
        throw new Error('Only email channel is supported');
      }
      
      const result = await AlertingClients.sendEmail(
        recipient,
        '🧪 Test Notification - Smart Agriculture System',
        message || 'This is a test email notification from Smart Agriculture System. If you received this, your email configuration is working correctly!'
      );
      
      return result;
      
    } catch (error) {
      logger.error('Error testing notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
