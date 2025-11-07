// Automation Engine - Infrastructure - Threshold Repository
const Threshold = require('../domain/Threshold');
const logger = require('../../../shared-kernel/utils/logger');

const THRESHOLD_POPULATE = [
  { path: 'sensorType' },
  { path: 'farmId' },
  { path: 'zoneId' },
  { path: 'action.actuator' },
  { path: 'createdBy', select: 'username email fullName' }
];

class ThresholdRepository {
  
  async create(thresholdData) {
    try {
      const threshold = new Threshold(thresholdData);
      await threshold.save();
      logger.info(`Threshold created: ${threshold._id}`);
      return await threshold.populate(THRESHOLD_POPULATE);
    } catch (error) {
      logger.error('Error creating threshold:', error);
      throw error;
    }
  }
  
  async findById(id) {
    try {
      return await Threshold.findById(id)
        .populate(THRESHOLD_POPULATE);
    } catch (error) {
      logger.error('Error finding threshold by ID:', error);
      throw error;
    }
  }
  
  async findAll(filters = {}) {
    try {
      const query = {};
      
      if (filters.sensorTypeId) {
        query.sensorType = filters.sensorTypeId;
      }

      if (filters.sensorType) {
        query.sensorType = filters.sensorType;
      }
      
      if (filters.farmId) {
        query.farmId = filters.farmId;
      }
      
      if (filters.zoneId) {
        query.zoneId = filters.zoneId;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      return await Threshold.find(query)
        .populate(THRESHOLD_POPULATE)
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error finding thresholds:', error);
      throw error;
    }
  }
  
  async findActive(filters = {}) {
    try {
      const query = { isActive: true };

      if (filters.sensorTypeId) {
        query.sensorType = filters.sensorTypeId;
      }

      if (filters.farmId) {
        query.farmId = filters.farmId;
      }

      if (filters.zoneId) {
        query.zoneId = filters.zoneId;
      }

      return await Threshold.find(query).populate(THRESHOLD_POPULATE);
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
      ).populate(THRESHOLD_POPULATE);
      
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
      
      if (filters.sensorTypeId) {
        query.sensorType = filters.sensorTypeId;
      } else if (filters.sensorType) {
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
