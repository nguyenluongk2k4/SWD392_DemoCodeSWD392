// Farm Management - Presentation - Zone Controller
const express = require('express');
const router = express.Router();
const ZoneRepository = require('../infrastructure/ZoneRepository');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const logger = require('../../../shared-kernel/utils/logger');

class ZoneController {
  
  /**
   * Get all zones
   * GET /api/zones
   */
  async getAllZones(req, res) {
    try {
      const { farmId } = req.query;
      
      let zones;
      if (farmId) {
        zones = await ZoneRepository.findByFarmId(farmId);
      } else {
        zones = await ZoneRepository.findAll();
      }
      
      return ResponseHandler.success(res, zones, 'Zones retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllZones:', error);
      return ResponseHandler.error(res, error.message, 500);
    }
  }
  
  /**
   * Get zone by ID
   * GET /api/zones/:id
   */
  async getZoneById(req, res) {
    try {
      const { id } = req.params;
      const zone = await ZoneRepository.findById(id);
      
      if (!zone) {
        return ResponseHandler.notFound(res, 'Zone not found');
      }
      
      return ResponseHandler.success(res, zone, 'Zone retrieved successfully');
    } catch (error) {
      logger.error('Error in getZoneById:', error);
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

// Initialize controller
const controller = new ZoneController();

// Define routes
router.get('/', controller.getAllZones.bind(controller));
router.get('/:id', controller.getZoneById.bind(controller));

module.exports = router;
