// Farm Management - Infrastructure - Farm Repository
const mongoose = require('mongoose');
const logger = require('../../../shared-kernel/utils/logger');

class FarmRepository {
  constructor() {
    this.Farm = mongoose.model('Farm');
  }
  
  /**
   * Get all farms
   */
  async findAll() {
    try {
      return await this.Farm.find()
        .select('name location area description isActive')
        .sort({ name: 1 });
    } catch (error) {
      logger.error('Error finding all farms:', error);
      throw error;
    }
  }
  
  /**
   * Find farm by ID
   */
  async findById(farmId) {
    try {
      return await this.Farm.findById(farmId);
    } catch (error) {
      logger.error('Error finding farm by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create new farm
   */
  async create(farmData) {
    try {
      const farm = new this.Farm(farmData);
      return await farm.save();
    } catch (error) {
      logger.error('Error creating farm:', error);
      throw error;
    }
  }
}

module.exports = new FarmRepository();
