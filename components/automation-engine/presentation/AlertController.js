// Automation Engine - Presentation - Alert Controller
const express = require('express');
const router = express.Router();
const NotificationService = require('../application/NotificationService');
const { successResponse, errorResponse } = require('../../../shared-kernel/utils/response');
const logger = require('../../../shared-kernel/utils/logger');

class AlertController {
  
  /**
   * UC09: Get all alerts
   * GET /api/alerts
   */
  async getAllAlerts(req, res) {
    try {
      const filters = {
        type: req.query.type,
        severity: req.query.severity,
        status: req.query.status,
        farmZone: req.query.farmZone,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: req.query.page,
        limit: req.query.limit
      };
      
      const result = await NotificationService.getAlerts(filters);
      
      return successResponse(res, result, 'Alerts retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getAllAlerts controller:', error);
      return errorResponse(res, error.message, 500);
    }
  }
  
  /**
   * Get active alerts
   * GET /api/alerts/active
   */
  async getActiveAlerts(req, res) {
    try {
      const alerts = await NotificationService.getActiveAlerts();
      
      return successResponse(res, alerts, 'Active alerts retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getActiveAlerts controller:', error);
      return errorResponse(res, error.message, 500);
    }
  }
  
  /**
   * UC09: Acknowledge alert
   * POST /api/alerts/:id/acknowledge
   */
  async acknowledgeAlert(req, res) {
    try {
      const userId = req.user?.id;
      
      const alert = await NotificationService.acknowledgeAlert(req.params.id, userId);
      
      return successResponse(res, alert, 'Alert acknowledged successfully');
      
    } catch (error) {
      logger.error('Error in acknowledgeAlert controller:', error);
      return errorResponse(res, error.message, 400);
    }
  }
  
  /**
   * UC09: Resolve alert
   * POST /api/alerts/:id/resolve
   */
  async resolveAlert(req, res) {
    try {
      const userId = req.user?.id;
      const { notes } = req.body;
      
      const alert = await NotificationService.resolveAlert(req.params.id, userId, notes);
      
      return successResponse(res, alert, 'Alert resolved successfully');
      
    } catch (error) {
      logger.error('Error in resolveAlert controller:', error);
      return errorResponse(res, error.message, 400);
    }
  }
  
  /**
   * Get alert statistics
   * GET /api/alerts/stats
   */
  async getStatistics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      
      const stats = await NotificationService.getAlertStatistics(filters);
      
      return successResponse(res, stats, 'Statistics retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getStatistics controller:', error);
      return errorResponse(res, error.message, 500);
    }
  }
  
  /**
   * Test notification
   * POST /api/alerts/test-notification
   */
  async testNotification(req, res) {
    try {
      const { channel, recipient, message } = req.body;
      
      if (!channel || !recipient) {
        return errorResponse(res, 'Channel and recipient are required', 400);
      }
      
      const result = await NotificationService.testNotification(channel, recipient, message);
      
      return successResponse(res, result, 'Test notification sent');
      
    } catch (error) {
      logger.error('Error in testNotification controller:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

// Initialize controller
const controller = new AlertController();

// Define routes
router.get('/', controller.getAllAlerts.bind(controller));
router.get('/active', controller.getActiveAlerts.bind(controller));
router.get('/stats', controller.getStatistics.bind(controller));
router.post('/test-notification', controller.testNotification.bind(controller));
router.post('/:id/acknowledge', controller.acknowledgeAlert.bind(controller));
router.post('/:id/resolve', controller.resolveAlert.bind(controller));

module.exports = router;
