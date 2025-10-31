// Automation Engine - Infrastructure - Alerting Clients
// UC09: Send notifications via Email, SMS, Push
const nodemailer = require('nodemailer');
const config = require('../../../shared-kernel/config');
const logger = require('../../../shared-kernel/utils/logger');

class AlertingClients {
  
  constructor() {
    this.emailTransporter = null;
    this.initializeEmailClient();
  }
  
  /**
   * Initialize email client (NodeMailer)
   */
  initializeEmailClient() {
    try {
      if (!config.email || !config.email.host) {
        logger.warn('Email configuration not found. Email alerts disabled.');
        return;
      }
      
      this.emailTransporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: config.email.user && config.email.pass ? {
          user: config.email.user,
          pass: config.email.pass
        } : undefined
      });
      
      logger.info('📧 Email client initialized');
      
    } catch (error) {
      logger.error('Error initializing email client:', error);
    }
  }
  
  /**
   * UC09: Send email notification
   */
  async sendEmail(recipient, subject, message, html = null) {
    try {
      if (!this.emailTransporter) {
        logger.warn('Email client not initialized. Skipping email.');
        return {
          status: 'skipped',
          reason: 'Email client not configured'
        };
      }
      
      const mailOptions = {
        from: config.email.from,
        to: recipient,
        subject: subject,
        text: message,
        html: html || this.generateEmailHTML(subject, message)
      };
      
      const info = await this.emailTransporter.sendMail(mailOptions);
      
      logger.info(`📧 Email sent to ${recipient}: ${info.messageId}`);
      
      return {
        status: 'sent',
        messageId: info.messageId,
        recipient
      };
      
    } catch (error) {
      logger.error('Error sending email:', error);
      return {
        status: 'failed',
        error: error.message,
        recipient
      };
    }
  }
  
  /**
   * Generate HTML email template
   */
  generateEmailHTML(subject, message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
          .alert-box { padding: 15px; margin: 10px 0; border-left: 4px solid #ff9800; background: #fff3cd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🌾 Smart Agriculture System</h2>
          </div>
          <div class="content">
            <h3>${subject}</h3>
            <div class="alert-box">
              <p>${message}</p>
            </div>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p>Please check your dashboard for more details.</p>
          </div>
          <div class="footer">
            <p>Smart Agriculture System - Automated Alert</p>
            <p>© 2025 SWD392 Project</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * UC09: Send SMS notification (Mock - requires Twilio or similar)
   */
  async sendSMS(phoneNumber, message) {
    try {
      // This is a mock implementation
      // In production, integrate with Twilio, AWS SNS, or other SMS providers
      
      logger.info(`📱 SMS would be sent to ${phoneNumber}: ${message}`);
      
      // Mock successful response
      return {
        status: 'sent',
        recipient: phoneNumber,
        provider: 'mock',
        note: 'SMS functionality requires Twilio integration'
      };
      
    } catch (error) {
      logger.error('Error sending SMS:', error);
      return {
        status: 'failed',
        error: error.message,
        recipient: phoneNumber
      };
    }
  }
  
  /**
   * UC09: Send push notification (Mock - requires Firebase or similar)
   */
  async sendPushNotification(deviceToken, title, body, data = {}) {
    try {
      // This is a mock implementation
      // In production, integrate with Firebase Cloud Messaging (FCM) or OneSignal
      
      logger.info(`🔔 Push notification would be sent: ${title}`);
      
      // Mock successful response
      return {
        status: 'sent',
        deviceToken,
        provider: 'mock',
        note: 'Push notification requires Firebase FCM integration'
      };
      
    } catch (error) {
      logger.error('Error sending push notification:', error);
      return {
        status: 'failed',
        error: error.message,
        deviceToken
      };
    }
  }
  
  /**
   * Send notification via multiple channels
   */
  async sendMultiChannel(channels, recipients, subject, message) {
    const results = [];
    
    for (const channel of channels) {
      switch (channel) {
        case 'email':
          for (const recipient of recipients) {
            const result = await this.sendEmail(recipient, subject, message);
            results.push({ channel: 'email', ...result });
          }
          break;
          
        case 'sms':
          for (const recipient of recipients) {
            const result = await this.sendSMS(recipient, message);
            results.push({ channel: 'sms', ...result });
          }
          break;
          
        case 'push':
          for (const recipient of recipients) {
            const result = await this.sendPushNotification(recipient, subject, message);
            results.push({ channel: 'push', ...result });
          }
          break;
          
        default:
          logger.warn(`Unknown notification channel: ${channel}`);
      }
    }
    
    return results;
  }
  
  /**
   * Verify email connection
   */
  async verifyEmailConnection() {
    try {
      if (!this.emailTransporter) {
        return { connected: false, message: 'Email client not initialized' };
      }
      
      await this.emailTransporter.verify();
      return { connected: true, message: 'Email server connection verified' };
      
    } catch (error) {
      logger.error('Email connection verification failed:', error);
      return { connected: false, message: error.message };
    }
  }
}

module.exports = new AlertingClients();
