// User Management - Application - Role Service (UC07)
const RoleRepository = require('../infrastructure/RoleRepository');
const logger = require('../../../shared-kernel/utils/logger');

class RoleService {
  async createRole(roleData) {
    try {
      const existingRole = await RoleRepository.findByName(roleData.name);
      if (existingRole) {
        throw new Error('Role already exists');
      }

      const role = await RoleRepository.create(roleData);
      logger.info(`Role created: ${role.name}`);
      
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
      const role = await RoleRepository.update(roleId, updateData);
      
      if (!role) {
        throw new Error('Role not found');
      }

      logger.info(`Role updated: ${role.name}`);
      
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
      
      return role;
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }
}

module.exports = new RoleService();
