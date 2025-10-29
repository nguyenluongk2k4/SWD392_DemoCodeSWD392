// Automation Engine - Infrastructure - Threshold Repository
const Threshold = require('../domain/Threshold');
const logger = require('../../../shared-kernel/utils/logger');

class ThresholdRepository {
  
  async create(thresholdData) {
    try {
      const threshold = new Threshold(thresholdData);
      await threshold.save();
      logger.info(`Threshold created: ${threshold._id}`);
      return threshold;
    } catch (error) {
      logger.error('Error creating threshold:', error);
      throw error;
    }
  }
  
  async findById(id) {
    try {
      return await Threshold.findById(id)
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email');
    } catch (error) {
      logger.error('Error finding threshold by ID:', error);
      throw error;
    }
  }
  
  async findAll(filters = {}) {
    try {
      const query = {};
      
      if (filters.sensorType) {
        query.sensorType = filters.sensorType;
      }
      
      if (filters.farmZone) {
        query.farmZone = filters.farmZone;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      return await Threshold.find(query)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error finding thresholds:', error);
      throw error;
    }
  }
  
  async findActiveBySensorType(sensorType) {
    try {
      return await Threshold.find({
        sensorType,
        isActive: true
      });
    } catch (error) {
      logger.error('Error finding active thresholds:', error);
      throw error;
    }
  }
  
  async update(id, updateData) {
    try {
      const threshold = await Threshold.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!threshold) {
        throw new Error('Threshold not found');
      }
      
      logger.info(`Threshold updated: ${threshold._id}`);
      return threshold;
    } catch (error) {
      logger.error('Error updating threshold:', error);
      throw error;
    }
  }
  
  async delete(id) {
    try {
      const threshold = await Threshold.findByIdAndDelete(id);
      
      if (!threshold) {
        throw new Error('Threshold not found');
      }
      
      logger.info(`Threshold deleted: ${id}`);
      return threshold;
    } catch (error) {
      logger.error('Error deleting threshold:', error);
      throw error;
    }
  }
  
  async activate(id) {
    try {
      return await this.update(id, { isActive: true });
    } catch (error) {
      logger.error('Error activating threshold:', error);
      throw error;
    }
  }
  
  async deactivate(id) {
    try {
      return await this.update(id, { isActive: false });
    } catch (error) {
      logger.error('Error deactivating threshold:', error);
      throw error;
    }
  }
  
  async count(filters = {}) {
    try {
      const query = {};
      
      if (filters.sensorType) {
        query.sensorType = filters.sensorType;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      return await Threshold.countDocuments(query);
    } catch (error) {
      logger.error('Error counting thresholds:', error);
      throw error;
    }
  }
}

module.exports = new ThresholdRepository();
