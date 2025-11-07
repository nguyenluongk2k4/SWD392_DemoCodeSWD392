// Farm Management - Infrastructure - Zone Repository
const mongoose = require('mongoose');
const logger = require('../../../shared-kernel/utils/logger');

class ZoneRepository {
  constructor() {
    this.Zone = mongoose.model('Zone');
  }
  
  /**
   * Get all zones
   */
  async findAll() {
    try {
      return await this.Zone.find()
        .populate('farmId', 'name')
        .select('name farmId zoneType area description isActive')
        .sort({ name: 1 });
    } catch (error) {
      logger.error('Error finding all zones:', error);
      throw error;
    }
  }
  
  /**
   * Find zones by farm ID
   */
  async findByFarmId(farmId) {
    try {
      return await this.Zone.find({ farmId })
        .select('name zoneType area description isActive')
        .sort({ name: 1 });
    } catch (error) {
      logger.error('Error finding zones by farm ID:', error);
      throw error;
    }
  }
  
  /**
   * Find zone by ID
   */
  async findById(zoneId) {
    try {
      return await this.Zone.findById(zoneId)
        .populate('farmId', 'name');
    } catch (error) {
      logger.error('Error finding zone by ID:', error);
      throw error;
    }
  }
}

module.exports = new ZoneRepository();
