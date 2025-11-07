// Automation Engine - Presentation - Threshold Controller
const express = require('express');
const router = express.Router();
const ThresholdService = require('../application/ThresholdService');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const logger = require('../../../shared-kernel/utils/logger');
const { User } = require('../../../database_schemas');

// Cache for demo user ID
let demoUserId = null;

async function getDemoUserId() {
  if (demoUserId) return demoUserId;
  
  try {
    const adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      demoUserId = adminUser._id.toString();
      return demoUserId;
    }
    
    // Fallback: create a temporary demo user if admin doesn't exist
    logger.warn('Admin user not found, using fallback user ID');
    return '507f1f77bcf86cd799439011';
  } catch (error) {
    logger.error('Error getting demo user ID:', error);
    return '507f1f77bcf86cd799439011';
  }
}

class ThresholdController {
  
  /**
   * UC05: Create new threshold
   * POST /api/thresholds
   */
  async createThreshold(req, res) {
    try {
      // TODO: Replace with actual user ID from authentication middleware
      const userId = req.user?.id || await getDemoUserId();
      
      // Clean up empty string values that should be undefined for ObjectId fields
      const thresholdData = { ...req.body };
      if (thresholdData.action && thresholdData.action.actuator === '') {
        delete thresholdData.action.actuator;
      }
      if (thresholdData.farmId === '') {
        delete thresholdData.farmId;
      }
      if (thresholdData.zoneId === '') {
        delete thresholdData.zoneId;
      }
      
      const threshold = await ThresholdService.createThreshold(thresholdData, userId);
      
      return ResponseHandler.created(res, threshold, 'Threshold created successfully');
      
    } catch (error) {
      logger.error('Error in createThreshold controller:', error);
      return ResponseHandler.badRequest(res, error.message);
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
      
      return ResponseHandler.success(res, thresholds, 'Thresholds retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getAllThresholds controller:', error);
      return ResponseHandler.serverError(res, error.message);
    }
  }
  
  /**
   * UC05: Get threshold by ID
   * GET /api/thresholds/:id
   */
  async getThresholdById(req, res) {
    try {
      const threshold = await ThresholdService.getThresholdById(req.params.id);
      
      return ResponseHandler.success(res, threshold, 'Threshold retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getThresholdById controller:', error);
      return ResponseHandler.notFound(res, error.message);
    }
  }
  
  /**
   * UC05: Update threshold
   * PUT /api/thresholds/:id
   */
  async updateThreshold(req, res) {
    try {
      // TODO: Replace with actual user ID from authentication middleware
      const userId = req.user?.id || await getDemoUserId();
      
      // Clean up empty string values that should be undefined for ObjectId fields
      const updateData = { ...req.body };
      if (updateData.action && updateData.action.actuator === '') {
        delete updateData.action.actuator;
      }
      if (updateData.farmId === '') {
        delete updateData.farmId;
      }
      if (updateData.zoneId === '') {
        delete updateData.zoneId;
      }
      
      const threshold = await ThresholdService.updateThreshold(
        req.params.id,
        updateData,
        userId
      );
      
      return ResponseHandler.success(res, threshold, 'Threshold updated successfully');
      
    } catch (error) {
      logger.error('Error in updateThreshold controller:', error);
      return ResponseHandler.badRequest(res, error.message);
    }
  }
  
  /**
   * UC05: Delete threshold
   * DELETE /api/thresholds/:id
   */
  async deleteThreshold(req, res) {
    try {
      await ThresholdService.deleteThreshold(req.params.id);
      
      return ResponseHandler.success(res, null, 'Threshold deleted successfully');
      
    } catch (error) {
      logger.error('Error in deleteThreshold controller:', error);
      return ResponseHandler.badRequest(res, error.message);
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
      
      return ResponseHandler.success(
        res,
        threshold,
        `Threshold ${isActive ? 'activated' : 'deactivated'} successfully`
      );
      
    } catch (error) {
      logger.error('Error in toggleThreshold controller:', error);
      return ResponseHandler.badRequest(res, error.message);
    }
  }
  
  /**
   * Get threshold statistics
   * GET /api/thresholds/stats
   */
  async getStatistics(req, res) {
    try {
      const stats = await ThresholdService.getStatistics();
      
      return ResponseHandler.success(res, stats, 'Statistics retrieved successfully');
      
    } catch (error) {
      logger.error('Error in getStatistics controller:', error);
      return ResponseHandler.serverError(res, error.message);
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
