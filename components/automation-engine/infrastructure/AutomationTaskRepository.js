// Automation Engine - Infrastructure - Automation Task Repository
const AutomationTask = require('../domain/AutomationTask');
const logger = require('../../../shared-kernel/utils/logger');
const config = require('../../../shared-kernel/config');

class AutomationTaskRepository {
  async create(taskData) {
    try {
      const payload = {
        ...taskData,
        status: 'pending',
        attempts: 0,
        scheduledAt: taskData.scheduledAt || new Date()
      };

      const task = await AutomationTask.create(payload);
      logger.info(`Automation task queued: ${task._id}`);
      return task;
    } catch (error) {
      logger.error('Error creating automation task:', error);
      throw error;
    }
  }

  async fetchDueTasks(limit = 10) {
    try {
      const now = new Date();
      return await AutomationTask.find({
        status: { $in: ['pending', 'failed'] },
        scheduledAt: { $lte: now },
        attempts: { $lt: config.automation.maxAttempts }
      })
        .sort({ scheduledAt: 1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Error fetching due automation tasks:', error);
      throw error;
    }
  }

  async markProcessing(taskId) {
    try {
      const task = await AutomationTask.findOneAndUpdate(
        {
          _id: taskId,
          status: { $in: ['pending', 'failed'] },
          attempts: { $lt: config.automation.maxAttempts }
        },
        {
          status: 'processing',
          lastAttemptAt: new Date(),
          $inc: { attempts: 1 }
        },
        { new: true }
      ).lean();

      return task;
    } catch (error) {
      logger.error('Error locking automation task:', error);
      throw error;
    }
  }

  async markSuccess(taskId, result) {
    try {
      return await AutomationTask.findByIdAndUpdate(
        taskId,
        {
          status: 'success',
          result,
          error: null
        },
        { new: true }
      ).lean();
    } catch (error) {
      logger.error('Error marking automation task success:', error);
      throw error;
    }
  }

  async markFailed(task, error) {
    try {
      const taskId = task && task._id ? task._id : task;
      const attempts = task && typeof task.attempts === 'number' ? task.attempts : undefined;
      const canRetry = attempts === undefined || attempts < config.automation.maxAttempts;
      const update = {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      };

      if (canRetry) {
        update.scheduledAt = new Date(Date.now() + config.automation.retryDelayMs);
      }

      return await AutomationTask.findByIdAndUpdate(
        taskId,
        update,
        { new: true }
      ).lean();
    } catch (err) {
      logger.error('Error marking automation task failed:', err);
      throw err;
    }
  }

  async attachAlertByCorrelation(correlationId, alertId) {
    if (!correlationId || !alertId) {
      return [];
    }

    try {
      const tasks = await AutomationTask.find({ correlationId })
        .select('_id alert correlationId status')
        .lean();

      if (!tasks.length) {
        return [];
      }

      const updateResult = await AutomationTask.updateMany(
        { correlationId },
        { alert: alertId }
      );

      const modifiedCount = updateResult.modifiedCount || updateResult.nModified || 0;
      logger.info(`Linked ${modifiedCount} automation task(s) to alert ${alertId}`);

      return await AutomationTask.find({ correlationId })
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Error attaching alert to automation tasks:', error);
      throw error;
    }
  }

  async updateTask(taskId, updateData) {
    try {
      return await AutomationTask.findByIdAndUpdate(taskId, updateData, { new: true }).lean();
    } catch (error) {
      logger.error('Error updating automation task:', error);
      throw error;
    }
  }
}

module.exports = new AutomationTaskRepository();
