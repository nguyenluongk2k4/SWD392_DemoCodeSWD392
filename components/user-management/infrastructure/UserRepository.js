// User Management - Infrastructure - User Repository
const User = require('../domain/User');
const logger = require('../../../shared-kernel/utils/logger');

class UserRepository {
  async create(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findById(userId) {
    try {
      return await User.findById(userId).populate('role').select('-password');
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      return await User.findOne({ username }).populate('role');
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({ email }).populate('role');
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      return await User.find(filters).populate('role').select('-password');
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  async update(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('role').select('-password');
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(userId) {
    try {
      return await User.findByIdAndDelete(userId);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { lastLogin: new Date() },
        { new: true }
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository();
