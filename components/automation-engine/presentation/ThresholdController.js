// Automation Engine - Presentation - Threshold Controller
const express = require('express');
const router = express.Router();
const ThresholdService = require('../application/ThresholdService');
const { successResponse, errorResponse } = require('../../../shared-kernel/utils/response');
const logger = require('../../../shared-kernel/utils/logger');

class ThresholdController {
  
  /**
   * UC05: Create new threshold
   * POST /api/thresholds
   */
  async createThreshold(req, res) {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets req.user
      
      const threshold = await ThresholdService.createThreshold(req.body, userId);
      
      return successResponse(res, threshold, 'Threshold created successfully', 201);
      
    } catch (error) {
      logger.error('Error in createThreshold controller:', error);
      return errorResponse(res, error.message, 400);
    }
  }
  
  /**
   * UC05: Get all thresholds
   * GET /api/thresholds
   */
  async getAllThresholds(req, res) {
    try {
      const filters = {
        sensorType: req.query.sensorType,
        farmZone: req.query.farmZone,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };
      
      const thresholds = await ThresholdService.getAllThresholds(filters);
      
      return successResponse(res, thresholds, 'Thresholds retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getAllThresholds controller:', error);
      return errorResponse(res, error.message, 500);
    }
  }
  
  /**
   * UC05: Get threshold by ID
   * GET /api/thresholds/:id
   */
  async getThresholdById(req, res) {
    try {
      const threshold = await ThresholdService.getThresholdById(req.params.id);
      
      return successResponse(res, threshold, 'Threshold retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getThresholdById controller:', error);
      return errorResponse(res, error.message, 404);
    }
  }
  
  /**
   * UC05: Update threshold
   * PUT /api/thresholds/:id
   */
  async updateThreshold(req, res) {
    try {
      const userId = req.user?.id;
      
      const threshold = await ThresholdService.updateThreshold(
        req.params.id,
        req.body,
        userId
      );
      
      return successResponse(res, threshold, 'Threshold updated successfully');
      
    } catch (error) {
      logger.error('Error in updateThreshold controller:', error);
      return errorResponse(res, error.message, 400);
    }
  }
  
  /**
   * UC05: Delete threshold
   * DELETE /api/thresholds/:id
   */
  async deleteThreshold(req, res) {
    try {
      await ThresholdService.deleteThreshold(req.params.id);
      
      return successResponse(res, null, 'Threshold deleted successfully');
      
    } catch (error) {
      logger.error('Error in deleteThreshold controller:', error);
      return errorResponse(res, error.message, 400);
    }
  }
  
  /**
   * UC05: Toggle threshold active status
   * PATCH /api/thresholds/:id/toggle
   */
  async toggleThreshold(req, res) {
    try {
      const { isActive } = req.body;
      
      const threshold = await ThresholdService.toggleThreshold(req.params.id, isActive);
      
      return successResponse(
        res,
        threshold,
        `Threshold ${isActive ? 'activated' : 'deactivated'} successfully`
      );
      
    } catch (error) {
      logger.error('Error in toggleThreshold controller:', error);
      return errorResponse(res, error.message, 400);
    }
  }
  
  /**
   * Get threshold statistics
   * GET /api/thresholds/stats
   */
  async getStatistics(req, res) {
    try {
      const stats = await ThresholdService.getStatistics();
      
      return successResponse(res, stats, 'Statistics retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getStatistics controller:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

// Initialize controller
const controller = new ThresholdController();

// Define routes
router.post('/', controller.createThreshold.bind(controller));
router.get('/', controller.getAllThresholds.bind(controller));
router.get('/stats', controller.getStatistics.bind(controller));
router.get('/:id', controller.getThresholdById.bind(controller));
router.put('/:id', controller.updateThreshold.bind(controller));
router.delete('/:id', controller.deleteThreshold.bind(controller));
router.patch('/:id/toggle', controller.toggleThreshold.bind(controller));

module.exports = router;
