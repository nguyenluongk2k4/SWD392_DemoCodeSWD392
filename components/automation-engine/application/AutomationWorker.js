// Automation Engine - Application - Automation Worker
const AutomationTaskRepository = require('../infrastructure/AutomationTaskRepository');
const AlertRepository = require('../infrastructure/AlertRepository');
const ActuatorService = require('../../device-control/application/ActuatorService');
const config = require('../../../shared-kernel/config');
const logger = require('../../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');

class AutomationWorker {
  constructor() {
    this.intervalMs = config.automation.workerIntervalMs;
    this.timer = null;
    this.isRunning = false;
    this.isProcessing = false;
  }

  start() {
    if (!config.automation.workerEnabled) {
      logger.info('Automation worker disabled by configuration');
      return;
    }

    if (this.isRunning) {
      return;
    }

    this.timer = setInterval(() => this.processPendingTasks(), this.intervalMs);
    // Kick off immediately so we don't wait for the first interval
    this.processPendingTasks();
    this.isRunning = true;
    logger.info(`⚙️ Automation worker started (interval ${this.intervalMs} ms)`);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  async processPendingTasks() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const tasks = await AutomationTaskRepository.fetchDueTasks();
      if (!tasks.length) {
        return;
      }

      for (const task of tasks) {
        await this.processTask(task);
      }
    } catch (error) {
      logger.error(`Automation worker loop failed: ${error.message}`, { error });
    } finally {
      this.isProcessing = false;
    }
  }

  async processTask(taskSummary) {
    try {
      const task = await AutomationTaskRepository.markProcessing(taskSummary._id);
      if (!task) {
        return;
      }

      try {
        const result = await this.executeTask(task);
        const completedTask = await AutomationTaskRepository.markSuccess(task._id, result);
        await this.handleTaskSuccess(completedTask, result);
      } catch (error) {
        const failedTask = await AutomationTaskRepository.markFailed(task, error);
        await this.handleTaskFailure(failedTask, error);
      }
    } catch (error) {
      logger.error(`Automation worker failed to process task ${taskSummary._id}: ${error.message}`);
    }
  }

  async executeTask(task) {
    const triggeredBy = task.metadata?.triggeredBy || (task.threshold ? {
      type: 'threshold',
      thresholdId: task.threshold,
      violationType: task.metadata?.violationType
    } : undefined);

    const controlPayload = {
      deviceId: task.deviceId,
      actuatorId: task.actuator,
      action: task.action,
      mode: 'auto',
      triggeredBy,
      address: task.metadata?.address
    };

    logger.info(`🚜 Processing automation task ${task._id} for device ${task.deviceId || task.actuator}`);

    const result = await ActuatorService.controlDevice(controlPayload);
    return result;
  }

  async handleTaskSuccess(task, result) {
    logger.info(`✅ Automation task ${task._id} completed successfully`);

    eventBus.publish(Events.AUTOMATION_TASK_COMPLETED, {
      taskId: task._id,
      alert: task.alert,
      correlationId: task.correlationId,
      result
    });

    if (!task.alert) {
      return;
    }

    const historyEntry = {
      event: 'automation_task_success',
      status: 'action_executed',
      detail: `Automation task ${task._id} executed action ${task.action}`,
      createdAt: new Date()
    };

    const updatedAlert = await AlertRepository.appendHistory(
      task.alert,
      historyEntry,
      {
        status: 'action_executed',
        additionalFields: {
          'automation.lastExecutedAt': new Date(),
          'automation.lastTaskStatus': 'success',
          'automation.lastError': null,
          ...(task.correlationId ? { 'automation.correlationId': task.correlationId } : {})
        },
        addToSet: {
          'automation.taskIds': task._id
        }
      }
    );

    if (updatedAlert) {
      eventBus.publish(Events.ALERT_UPDATED, { alert: updatedAlert });
    }
  }

  async handleTaskFailure(task, error) {
    logger.error(`❌ Automation task ${task._id} failed: ${error.message || error}`);

    eventBus.publish(Events.AUTOMATION_TASK_FAILED, {
      taskId: task._id,
      alert: task.alert,
      correlationId: task.correlationId,
      error: error.message || String(error)
    });

    if (!task.alert) {
      return;
    }

    const historyEntry = {
      event: 'automation_task_failed',
      status: 'action_failed',
      detail: error.message || String(error),
      createdAt: new Date()
    };

    const updatedAlert = await AlertRepository.appendHistory(
      task.alert,
      historyEntry,
      {
        status: 'action_failed',
        additionalFields: {
          'automation.lastExecutedAt': new Date(),
          'automation.lastTaskStatus': 'failed',
          'automation.lastError': error.message || String(error),
          ...(task.correlationId ? { 'automation.correlationId': task.correlationId } : {})
        },
        addToSet: {
          'automation.taskIds': task._id
        }
      }
    );

    if (updatedAlert) {
      eventBus.publish(Events.ALERT_UPDATED, { alert: updatedAlert });
    }
  }
}

module.exports = new AutomationWorker();
