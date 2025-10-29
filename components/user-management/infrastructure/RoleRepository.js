// User Management - Infrastructure - Role Repository
const Role = require('../domain/Role');
const logger = require('../../../shared-kernel/utils/logger');

class RoleRepository {
  async create(roleData) {
    try {
      const role = new Role(roleData);
      await role.save();
      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  async findById(roleId) {
    try {
      return await Role.findById(roleId);
    } catch (error) {
      logger.error('Error finding role by ID:', error);
      throw error;
    }
  }

  async findByName(name) {
    try {
      return await Role.findOne({ name });
    } catch (error) {
      logger.error('Error finding role by name:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await Role.find();
    } catch (error) {
      logger.error('Error finding all roles:', error);
      throw error;
    }
  }

  async update(roleId, updateData) {
    try {
      return await Role.findByIdAndUpdate(
        roleId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  async delete(roleId) {
    try {
      return await Role.findByIdAndDelete(roleId);
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  async initializeDefaultRoles() {
    try {
      const defaultRoles = [
        {
          name: 'admin',
          description: 'Full system access',
          permissions: [
            'view_dashboard',
            'view_sensors',
            'control_devices',
            'manage_users',
            'manage_roles',
            'manage_thresholds',
            'view_reports',
            'report_incidents',
          ],
        },
        {
          name: 'manager',
          description: 'Manage operations and view reports',
          permissions: [
            'view_dashboard',
            'view_sensors',
            'control_devices',
            'manage_thresholds',
            'view_reports',
            'report_incidents',
          ],
        },
        {
          name: 'operator',
          description: 'Operate devices and monitor',
          permissions: [
            'view_dashboard',
            'view_sensors',
            'control_devices',
            'report_incidents',
          ],
        },
        {
          name: 'viewer',
          description: 'View only access',
          permissions: ['view_dashboard', 'view_sensors'],
        },
      ];

      for (const roleData of defaultRoles) {
        const exists = await this.findByName(roleData.name);
        if (!exists) {
          await this.create(roleData);
          logger.info(`✅ Default role created: ${roleData.name}`);
        }
      }
    } catch (error) {
      logger.error('Error initializing default roles:', error);
      throw error;
    }
  }
}

module.exports = new RoleRepository();
