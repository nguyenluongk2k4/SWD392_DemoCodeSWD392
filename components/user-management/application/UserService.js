// User Management - Application - User Service (UC06)
const UserRepository = require('../infrastructure/UserRepository');
const RoleRepository = require('../infrastructure/RoleRepository');
const AuthService = require('./AuthService');
const AuditLogService = require('./AuditLogService');
const logger = require('../../../shared-kernel/utils/logger');

class UserService {
  async createUser(userData) {
    try {
      // Step 2.1: UserService orchestrates the Create User use case
      // Step 2.1.1: Validate incoming data against existing records
      const existingUser = await UserRepository.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const existingEmail = await UserRepository.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }

      // Validate role
      const role = await RoleRepository.findById(userData.role);
      if (!role) {
        throw new Error('Invalid role');
      }

      // Step 2.1.1: Hash password prior to persistence
      userData.password = await AuthService.hashPassword(userData.password);

      // Step 2.1.1: Delegate persistence to repository
      const user = await UserRepository.create(userData);
      
      logger.info(`User created: ${user.username}`);

      // Step 2.1.1.1: AuditLogService.log('USER_CREATED')
      await AuditLogService.logUserAction('USER_CREATED', {
        userId: user._id,
        username: user.username,
        roleId: user.role,
      });

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  async getAllUsers(filters = {}) {
    try {
      return await UserRepository.findAll(filters);
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      logger.info('UserService.updateUser called:', { userId, updateData });

      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await AuthService.hashPassword(updateData.password);
      }

      // If role is being updated, validate it
      if (updateData.role) {
        logger.info('Validating role:', { role: updateData.role });
        // Try to find role by ID first, then by name
        let role = null;
        
        // Check if it looks like an ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(updateData.role)) {
          role = await RoleRepository.findById(updateData.role);
          logger.info('Role lookup by ID:', { roleId: updateData.role, found: !!role });
        }
        
        // If not found by ID, try by name
        if (!role) {
          role = await RoleRepository.findByName(updateData.role);
          logger.info('Role lookup by name:', { roleName: updateData.role, found: !!role });
        }
        
        if (!role) {
          logger.error('Role not found:', { role: updateData.role });
          throw new Error('Invalid role');
        }
        
        // Ensure we use the role's _id
        updateData.role = role._id;
        logger.info('Role resolved to:', { roleId: role._id });
      }

      logger.info('Calling repository update with:', { userId, updateData });
      const user = await UserRepository.update(userId, updateData);
      
      if (!user) {
        logger.error('User not found in repository:', { userId });
        throw new Error('User not found');
      }

      logger.info(`User updated successfully: ${user.username}`);
      await AuditLogService.logUserAction('USER_UPDATED', {
        userId: user._id,
        username: user.username,
        updates: Object.keys(updateData),
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserService.updateUser:', {
        userId,
        updateData,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await UserRepository.delete(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`User deleted: ${user.username}`);
      await AuditLogService.logUserAction('USER_DELETED', {
        userId,
        username: user.username,
      });
      
      return user;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async deactivateUser(userId) {
    try {
      const user = await this.updateUser(userId, { isActive: false });
      await AuditLogService.logUserAction('USER_DEACTIVATED', {
        userId,
        username: user.username,
      });
      return user;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  async activateUser(userId) {
    try {
      const user = await this.updateUser(userId, { isActive: true });
      await AuditLogService.logUserAction('USER_ACTIVATED', {
        userId,
        username: user.username,
      });
      return user;
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
