// User Management - Application - Audit Log Service
// Implements the AuditLogService swimlane from the UC06/UC07 diagrams.
const logger = require('../../../shared-kernel/utils/logger');

class AuditLogService {
  async log(action, context, payload = {}) {
    // Step 2.1.1.1 / Step 4 (Communication diagram): log action outcome
    logger.info(`[AUDIT][${context}] ${action}`, {
      ...payload,
      loggedAt: new Date().toISOString(),
    });
  }

  async logUserAction(action, payload = {}) {
    return this.log(action, 'USER', payload);
  }

  async logRoleAction(action, payload = {}) {
    return this.log(action, 'ROLE', payload);
  }
}

module.exports = new AuditLogService();

