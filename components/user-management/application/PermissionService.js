// User Management - Application - Permission Service
// Aligns with the communication diagram (Step 3) to validate role permissions before persistence.
const Role = require('../domain/Role');
const logger = require('../../../shared-kernel/utils/logger');

class PermissionService {
  constructor() {
    this.allowedPermissions = Role.PERMISSIONS || [];
  }

  /**
   * Validate and sanitize an incoming permission list.
   * @param {string[]} permissions
   * @returns {string[]} sanitized unique permissions
   */
  validatePermissions(permissions = []) {
    // Step 3: validatePermissions(permissionList)
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array');
    }

    const normalized = [...new Set(permissions.map((permission) => String(permission).trim()))]
      .filter((permission) => permission.length > 0);

    const invalid = normalized.filter(
      (permission) => !this.allowedPermissions.includes(permission),
    );

    if (invalid.length > 0) {
      logger.warn('Permission validation failed', { invalid });
      throw new Error(`Invalid permissions: ${invalid.join(', ')}`);
    }

    return normalized;
  }
}

module.exports = new PermissionService();

