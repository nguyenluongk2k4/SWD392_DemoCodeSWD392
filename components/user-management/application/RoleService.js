// User Management - Application - Role Service (UC07)
const RoleRepository = require('../infrastructure/RoleRepository');
const PermissionService = require('./PermissionService');
const AuditLogService = require('./AuditLogService');
const logger = require('../../../shared-kernel/utils/logger');

class RoleService {
  async createRole(roleData) {
    try {
      // Step 2: RoleService receives create/update request from controller
      const existingRole = await RoleRepository.findByName(roleData.name);
      if (existingRole) {
        throw new Error('Role already exists');
      }

      // Step 3: PermissionService.validatePermissions(permissionList)
      const permissions = PermissionService.validatePermissions(roleData.permissions || []);

      const role = await RoleRepository.create({
        ...roleData,
        permissions,
      });
      logger.info(`Role created: ${role.name}`);
      await AuditLogService.logRoleAction('ROLE_CREATED', {
        roleId: role._id,
        name: role.name,
      });
      
      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  async getRoleById(roleId) {
    try {
      const role = await RoleRepository.findById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      return role;
    } catch (error) {
      logger.error('Error getting role:', error);
      throw error;
    }
  }

  async getAllRoles() {
    try {
      return await RoleRepository.findAll();
    } catch (error) {
      logger.error('Error getting all roles:', error);
      throw error;
    }
  }

  async updateRole(roleId, updateData) {
    try {
      const payload = { ...updateData };

      if (updateData.permissions) {
        payload.permissions = PermissionService.validatePermissions(updateData.permissions);
      }

      const role = await RoleRepository.update(roleId, payload);
      
      if (!role) {
        throw new Error('Role not found');
      }

      logger.info(`Role updated: ${role.name}`);
      await AuditLogService.logRoleAction('ROLE_UPDATED', {
        roleId: role._id,
        name: role.name,
      });
      
      return role;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  async deleteRole(roleId) {
    try {
      const role = await RoleRepository.delete(roleId);
      
      if (!role) {
        throw new Error('Role not found');
      }

      logger.info(`Role deleted: ${role.name}`);
      await AuditLogService.logRoleAction('ROLE_DELETED', {
        roleId,
        name: role?.name,
      });
      
      return role;
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }
}

module.exports = new RoleService();
