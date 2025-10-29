// User Management - Application - User Service (UC06)
const UserRepository = require('../infrastructure/UserRepository');
const RoleRepository = require('../infrastructure/RoleRepository');
const AuthService = require('./AuthService');
const logger = require('../../../shared-kernel/utils/logger');

class UserService {
  async createUser(userData) {
    try {
      // Check if username or email already exists
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

      // Hash password
      userData.password = await AuthService.hashPassword(userData.password);

      // Create user
      const user = await UserRepository.create(userData);
      
      logger.info(`User created: ${user.username}`);
      
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
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await AuthService.hashPassword(updateData.password);
      }

      // If role is being updated, validate it
      if (updateData.role) {
        const role = await RoleRepository.findById(updateData.role);
        if (!role) {
          throw new Error('Invalid role');
        }
      }

      const user = await UserRepository.update(userId, updateData);
      
      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`User updated: ${user.username}`);
      
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
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
      
      return user;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async deactivateUser(userId) {
    try {
      return await this.updateUser(userId, { isActive: false });
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  async activateUser(userId) {
    try {
      return await this.updateUser(userId, { isActive: true });
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
