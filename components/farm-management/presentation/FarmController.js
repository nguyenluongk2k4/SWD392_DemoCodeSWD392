// Farm Management - Presentation - Farm Controller
const express = require('express');
const router = express.Router();
const FarmRepository = require('../infrastructure/FarmRepository');
const ZoneRepository = require('../infrastructure/ZoneRepository');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const logger = require('../../../shared-kernel/utils/logger');

class FarmController {
  
  /**
   * Get all farms
   * GET /api/farms
   */
  async getAllFarms(req, res) {
    try {
      const farms = await FarmRepository.findAll();
      return ResponseHandler.success(res, farms, 'Farms retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllFarms:', error);
      return ResponseHandler.error(res, error.message, 500);
    }
  }
  
  /**
   * Get farm by ID
   * GET /api/farms/:id
   */
  async getFarmById(req, res) {
    try {
      const { id } = req.params;
      const farm = await FarmRepository.findById(id);
      
      if (!farm) {
        return ResponseHandler.notFound(res, 'Farm not found');
      }
      
      return ResponseHandler.success(res, farm, 'Farm retrieved successfully');
    } catch (error) {
      logger.error('Error in getFarmById:', error);
      return ResponseHandler.error(res, error.message, 500);
    }
  }
  
  /**
   * Get zones by farm ID
   * GET /api/farms/:id/zones
   */
  async getZonesByFarmId(req, res) {
    try {
      const { id } = req.params;
      const zones = await ZoneRepository.findByFarmId(id);
      return ResponseHandler.success(res, zones, 'Zones retrieved successfully');
    } catch (error) {
      logger.error('Error in getZonesByFarmId:', error);
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

// Initialize controller
const controller = new FarmController();

// Define routes
router.get('/', controller.getAllFarms.bind(controller));
router.get('/:id', controller.getFarmById.bind(controller));
router.get('/:id/zones', controller.getZonesByFarmId.bind(controller));

module.exports = router;
