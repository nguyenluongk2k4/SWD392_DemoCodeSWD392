// Automation Engine - Application - Automation Task Service
const AutomationTaskRepository = require('../infrastructure/AutomationTaskRepository');
const logger = require('../../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');

class AutomationTaskService {
  async enqueueDeviceAction(payload) {
    try {
      const task = await AutomationTaskRepository.create({
        ...payload,
        metadata: {
          ...(payload.metadata || {}),
          triggeredBy: payload.triggeredBy || payload.metadata?.triggeredBy
        }
      });

      eventBus.publish(Events.AUTOMATION_TASK_CREATED, {
        taskId: task._id,
        correlationId: task.correlationId,
        threshold: task.threshold,
        actuator: task.actuator,
        deviceId: task.deviceId,
        action: task.action
      });

      return task;
    } catch (error) {
      logger.error('Error enqueuing automation device action:', error);
      throw error;
    }
  }

  async attachAlertToTasks(correlationId, alertId) {
    try {
      const tasks = await AutomationTaskRepository.attachAlertByCorrelation(correlationId, alertId);
      return tasks;
    } catch (error) {
      logger.error('Error attaching alert to automation tasks:', error);
      throw error;
    }
  }
}

module.exports = new AutomationTaskService();
