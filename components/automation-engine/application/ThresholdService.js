// Automation Engine - Application - Threshold Service (UC05)
const mongoose = require('mongoose');
const ThresholdRepository = require('../infrastructure/ThresholdRepository');
const SensorTypeRepository = require('../infrastructure/SensorTypeRepository');
const logger = require('../../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');

class ThresholdService {
  
  /**
   * UC05: Create new threshold
   */
  async createThreshold(thresholdData, userId) {
    try {
      const sensorTypeId = await this.resolveSensorTypeId(thresholdData.sensorType || thresholdData.sensorTypeId);

      if (!sensorTypeId) {
        throw new Error('Sensor type is required and must exist');
      }

      logger.info(`Creating threshold for sensor type: ${thresholdData.sensorType || thresholdData.sensorTypeId}`);
      
      // Validation
      if (thresholdData.minValue >= thresholdData.maxValue) {
        throw new Error('Min value must be less than max value');
      }
      
      const threshold = await ThresholdRepository.create({
        ...thresholdData,
        sensorType: sensorTypeId,
        createdBy: userId
      });
      
      // Emit event
      eventBus.emit(Events.THRESHOLD_CREATED, threshold);
      
      logger.info(`Threshold created successfully: ${threshold._id}`);
      return threshold;
      
    } catch (error) {
      logger.error('Error in createThreshold:', error);
      throw error;
    }
  }
  
  /**
   * UC05: Get threshold by ID
   */
  async getThresholdById(id) {
    try {
      const threshold = await ThresholdRepository.findById(id);
      
      if (!threshold) {
        throw new Error('Threshold not found');
      }
      
      return threshold;
    } catch (error) {
      logger.error('Error in getThresholdById:', error);
      throw error;
    }
  }
  
  /**
   * UC05: Get all thresholds with filters
   */
  async getAllThresholds(filters = {}) {
    try {
      const resolvedFilters = { ...filters };

      if (filters.sensorType) {
        const sensorTypeId = await this.resolveSensorTypeId(filters.sensorType);
        resolvedFilters.sensorTypeId = sensorTypeId;
      }

      return await ThresholdRepository.findAll(resolvedFilters);
    } catch (error) {
      logger.error('Error in getAllThresholds:', error);
      throw error;
    }
  }
  
  /**
   * UC05: Get active thresholds by sensor type
   */
  async getActiveThresholdsBySensorType(sensorType) {
    try {
      const sensorTypeId = await this.resolveSensorTypeId(sensorType);
      return await this.getActiveThresholds({ sensorTypeId });
    } catch (error) {
      logger.error('Error in getActiveThresholdsBySensorType:', error);
      throw error;
    }
  }

  async getActiveThresholds(filters = {}) {
    try {
      const resolvedFilters = { ...filters };

      if (filters.sensorType && !filters.sensorTypeId) {
        resolvedFilters.sensorTypeId = await this.resolveSensorTypeId(filters.sensorType);
      }

      return await ThresholdRepository.findActive(resolvedFilters);
    } catch (error) {
      logger.error('Error in getActiveThresholds:', error);
      throw error;
    }
  }
  
  /**
   * UC05: Update threshold
   */
  async updateThreshold(id, updateData, userId) {
    try {
      logger.info(`Updating threshold: ${id}`);
      
      // Validation
      if (updateData.minValue !== undefined && updateData.maxValue !== undefined) {
        if (updateData.minValue >= updateData.maxValue) {
          throw new Error('Min value must be less than max value');
        }
      }
      
      const threshold = await ThresholdRepository.update(id, {
        ...updateData,
        updatedBy: userId
      });
      
      // Emit event
      eventBus.emit(Events.THRESHOLD_UPDATED, threshold);
      
      logger.info(`Threshold updated successfully: ${threshold._id}`);
      return threshold;
      
    } catch (error) {
      logger.error('Error in updateThreshold:', error);
      throw error;
    }
  }
  
  /**
   * UC05: Delete threshold
   */
  async deleteThreshold(id) {
    try {
      logger.info(`Deleting threshold: ${id}`);
      
      const threshold = await ThresholdRepository.delete(id);
      
      // Emit event
      eventBus.emit(Events.THRESHOLD_DELETED, { thresholdId: id });
      
      logger.info(`Threshold deleted successfully: ${id}`);
      return threshold;
      
    } catch (error) {
      logger.error('Error in deleteThreshold:', error);
      throw error;
    }
  }
  
  /**
   * UC05: Activate/Deactivate threshold
   */
  async toggleThreshold(id, isActive) {
    try {
      logger.info(`${isActive ? 'Activating' : 'Deactivating'} threshold: ${id}`);
      
      const threshold = isActive 
        ? await ThresholdRepository.activate(id)
        : await ThresholdRepository.deactivate(id);
      
      eventBus.emit(Events.THRESHOLD_UPDATED, threshold);
      
      return threshold;
    } catch (error) {
      logger.error('Error in toggleThreshold:', error);
      throw error;
    }
  }
  
  /**
   * Get threshold statistics
   */
  async getStatistics() {
    try {
      const [total, active, bySensorType] = await Promise.all([
        ThresholdRepository.count(),
        ThresholdRepository.count({ isActive: true }),
        ThresholdRepository.findAll()
      ]);
      
      const groupedBySensorType = bySensorType.reduce((acc, threshold) => {
        if (!acc[threshold.sensorType]) {
          acc[threshold.sensorType] = { total: 0, active: 0 };
        }
        acc[threshold.sensorType].total++;
        if (threshold.isActive) {
          acc[threshold.sensorType].active++;
        }
        return acc;
      }, {});
      
      return {
        total,
        active,
        inactive: total - active,
        bySensorType: groupedBySensorType
      };
    } catch (error) {
      logger.error('Error in getStatistics:', error);
      throw error;
    }
  }

  async resolveSensorTypeId(sensorTypeInput) {
    if (!sensorTypeInput) {
      return null;
    }

    if (mongoose.isValidObjectId(sensorTypeInput)) {
      return sensorTypeInput;
    }

    if (typeof sensorTypeInput === 'object' && sensorTypeInput._id) {
      return sensorTypeInput._id;
    }

    const sensorType = await SensorTypeRepository.findByName(sensorTypeInput);
    return sensorType?._id || null;
  }
}

module.exports = new ThresholdService();
