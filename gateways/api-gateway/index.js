// API Gateway - Main Router
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('../../shared-kernel/utils/logger');

// Import Controllers
const AuthController = require('../../components/user-management/presentation/AuthController');
const UserController = require('../../components/user-management/presentation/UserController');
const DeviceController = require('../../components/device-control/presentation/DeviceController');

class ApiGateway {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // CORS
    this.app.use(cors());

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // HTTP request logger
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // API Routes
    this.app.use('/api/auth', AuthController);
    this.app.use('/api/users', UserController);
    this.app.use('/api/devices', DeviceController);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);

      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = new ApiGateway();
