// User Management - Application - Auth Service (UC01)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../infrastructure/UserRepository');
const config = require('../../../shared-kernel/config');
const logger = require('../../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../../shared-kernel/event-bus');

class AuthService {
  async login(username, password) {
    try {
      // Find user by username
      const user = await UserRepository.findByUsername(username);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Update last login
      await UserRepository.updateLastLogin(user._id);

      // Publish event
      eventBus.publish(Events.USER_LOGGED_IN, {
        userId: user._id,
        username: user.username,
        timestamp: new Date(),
      });

      logger.info(`User logged in: ${user.username}`);

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  generateToken(user) {
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      logger.error('Token verification error:', error);
      throw new Error('Invalid token');
    }
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
}

module.exports = new AuthService();
