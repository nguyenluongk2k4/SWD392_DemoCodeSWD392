// Automation Engine - Infrastructure - Alerting Clients
// UC09: Send notifications via Email (SMTP)
const nodemailer = require('nodemailer');
const config = require('../../../shared-kernel/config');
const logger = require('../../../shared-kernel/utils/logger');

class AlertingClients {
  
  constructor() {
    this.emailTransporter = null;
    this.initializeEmailClient();
  }
  
  /**
   * Initialize email client (NodeMailer with SMTP)
   */
  initializeEmailClient() {
    try {
      if (!config.email || !config.email.host || !config.email.user || !config.email.pass) {
        logger.warn('⚠️ Email configuration incomplete. Email alerts disabled.');
        logger.info('Please configure SMTP settings in .env file:');
        logger.info('  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
        return;
      }
      
      this.emailTransporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465 (SSL), false for 587 (TLS)
        auth: {
          user: config.email.user,
          pass: config.email.pass
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates (for dev)
        }
      });
      
      // Verify connection
      this.emailTransporter.verify((error, success) => {
        if (error) {
          logger.error('❌ SMTP connection failed:', error.message);
        } else {
          logger.info('✅ SMTP email client ready');
        }
      });
      
    } catch (error) {
      logger.error('Error initializing email client:', error);
    }
  }
  
  /**
   * UC09: Send email notification via SMTP
   */
  async sendEmail(recipient, subject, message, html = null) {
    try {
      if (!this.emailTransporter) {
        logger.warn('⚠️ Email client not initialized. Skipping email.');
        return {
          status: 'skipped',
          reason: 'Email client not configured',
          recipient
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
      
      logger.info(`✅ Email sent to ${recipient}: ${info.messageId}`);
      
      return {
        status: 'sent',
        messageId: info.messageId,
        recipient,
        timestamp: new Date()
      };
      
    } catch (error) {
      logger.error('❌ Error sending email:', error.message);
      return {
        status: 'failed',
        error: error.message,
        recipient,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Generate HTML email template for alerts
   */
  generateEmailHTML(subject, message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
            background: #ffffff; 
          }
          .content h3 {
            color: #333;
            margin-top: 0;
          }
          .alert-box { 
            padding: 20px; 
            margin: 20px 0; 
            border-left: 4px solid #ff9800; 
            background: #fff3cd;
            border-radius: 4px;
          }
          .alert-box p {
            margin: 0;
            color: #856404;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            color: #333;
          }
          .footer { 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #999;
            background: #f9f9f9;
            border-top: 1px solid #eee;
          }
          .footer p {
            margin: 5px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 20px 0;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🌾 Smart Agriculture System</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Automated Alert Notification</p>
          </div>
          <div class="content">
            <h3>${subject}</h3>
            <div class="alert-box">
              <p><strong>Alert Message:</strong></p>
              <p>${message}</p>
            </div>
            <div class="info-row">
              <span class="label">⏰ Time:</span>
              <span class="value">${new Date().toLocaleString('vi-VN')}</span>
            </div>
            <div class="info-row">
              <span class="label">🔔 Priority:</span>
              <span class="value">Auto-generated Alert</span>
            </div>
            <p style="margin-top: 30px; color: #666;">
              Please check your dashboard for more details and take appropriate action if needed.
            </p>
            <div style="text-align: center;">
              <a href="#" class="button">View Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Smart Agriculture System</strong></p>
            <p>SWD392 Final Project © ${new Date().getFullYear()}</p>
            <p style="margin-top: 10px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Verify SMTP connection
   */
  async verifyEmailConnection() {
    try {
      if (!this.emailTransporter) {
        return { 
          connected: false, 
          message: 'Email client not initialized. Check SMTP configuration in .env file.' 
        };
      }
      
      await this.emailTransporter.verify();
      logger.info('✅ SMTP connection verified successfully');
      
      return { 
        connected: true, 
        message: 'SMTP server connection verified',
        host: config.email.host,
        port: config.email.port,
        user: config.email.user
      };
      
    } catch (error) {
      logger.error('❌ SMTP connection verification failed:', error.message);
      return { 
        connected: false, 
        message: error.message,
        host: config.email.host,
        port: config.email.port
      };
    }
  }
}

module.exports = new AlertingClients();
