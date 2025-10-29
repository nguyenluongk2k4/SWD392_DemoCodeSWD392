// Automation Engine - Infrastructure - Alert Repository
const Alert = require('../domain/Alert');
const logger = require('../../../shared-kernel/utils/logger');

class AlertRepository {
  
  async create(alertData) {
    try {
      const alert = new Alert(alertData);
      await alert.save();
      logger.info(`Alert created: ${alert._id} - ${alert.title}`);
      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }
  
  async findById(id) {
    try {
      return await Alert.findById(id)
        .populate('threshold')
        .populate('device')
        .populate('acknowledgedBy', 'username email')
        .populate('resolvedBy', 'username email');
    } catch (error) {
      logger.error('Error finding alert by ID:', error);
      throw error;
    }
  }
  
  async findAll(filters = {}) {
    try {
      const query = {};
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.severity) {
        query.severity = filters.severity;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.farmZone) {
        query.farmZone = filters.farmZone;
      }
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }
      
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;
      
      const alerts = await Alert.find(query)
        .populate('threshold', 'name sensorType')
        .populate('acknowledgedBy', 'username')
        .populate('resolvedBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Alert.countDocuments(query);
      
      return {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding alerts:', error);
      throw error;
    }
  }
  
  async findActive() {
    try {
      return await Alert.find({
        status: { $in: ['new', 'acknowledged'] }
      })
        .populate('threshold', 'name sensorType')
        .sort({ severity: -1, createdAt: -1 })
        .limit(50);
    } catch (error) {
      logger.error('Error finding active alerts:', error);
      throw error;
    }
  }
  
  async update(id, updateData) {
    try {
      const alert = await Alert.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      logger.info(`Alert updated: ${alert._id}`);
      return alert;
    } catch (error) {
      logger.error('Error updating alert:', error);
      throw error;
    }
  }
  
  async delete(id) {
    try {
      const alert = await Alert.findByIdAndDelete(id);
      
      if (!alert) {
        throw new Error('Alert not found');
      }
      
      logger.info(`Alert deleted: ${id}`);
      return alert;
    } catch (error) {
      logger.error('Error deleting alert:', error);
      throw error;
    }
  }
  
  async getStatistics(filters = {}) {
    try {
      const query = {};
      
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }
      
      const [
        total,
        byStatus,
        bySeverity,
        byType
      ] = await Promise.all([
        Alert.countDocuments(query),
        Alert.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Alert.aggregate([
          { $match: query },
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]),
        Alert.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);
      
      return {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting alert statistics:', error);
      throw error;
    }
  }
}

module.exports = new AlertRepository();
