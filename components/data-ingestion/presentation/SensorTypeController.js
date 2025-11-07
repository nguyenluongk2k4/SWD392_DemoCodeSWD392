// Automation Engine - Infrastructure - Sensor Type Repository (already exists, just exposing)
const SensorTypeRepository = require('../../automation-engine/infrastructure/SensorTypeRepository');
const express = require('express');
const router = express.Router();
const ResponseHandler = require('../../../shared-kernel/utils/response');
const logger = require('../../../shared-kernel/utils/logger');

class SensorTypeController {
  
  /**
   * Get all sensor types
   * GET /api/sensor-types
   */
  async getAllSensorTypes(req, res) {
    try {
      const sensorTypes = await SensorTypeRepository.findAll();
      return ResponseHandler.success(res, sensorTypes, 'Sensor types retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllSensorTypes:', error);
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

// Initialize controller
const controller = new SensorTypeController();

// Define routes
router.get('/', controller.getAllSensorTypes.bind(controller));

module.exports = router;
