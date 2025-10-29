// Shared Kernel - Database Connection Module
const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Skip if database is disabled
      if (!config.database.enabled) {
        logger.info('📊 Database is disabled - Running in demo mode');
        return null;
      }

      if (this.connection) {
        logger.info('Database already connected');
        return this.connection;
      }

      this.connection = await mongoose.connect(config.database.uri, config.database.options);
      
      logger.info(`✅ MongoDB Connected: ${this.connection.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);
      logger.warn('⚠️  Running without database connection');
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info('MongoDB disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error.message);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();
