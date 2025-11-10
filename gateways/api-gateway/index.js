// API Gateway - Main Router
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('../../shared-kernel/utils/logger');

// Import Controllers
const AuthController = require('../../components/user-management/presentation/AuthController');
const UserController = require('../../components/user-management/presentation/UserController');
const DeviceController = require('../../components/device-control/presentation/DeviceController');
const DemoController = require('../../components/user-management/presentation/DemoController');
const DebugController = require('../../components/user-management/presentation/DebugController');
const ThresholdController = require('../../components/automation-engine/presentation/ThresholdController');
const AlertController = require('../../components/automation-engine/presentation/AlertController');
const FarmController = require('../../components/farm-management/presentation/FarmController');
const ZoneController = require('../../components/farm-management/presentation/ZoneController');
const SensorTypeController = require('../../components/data-ingestion/presentation/SensorTypeController');
const RoleController = require('../../components/user-management/presentation/RoleController');

class ApiGateway {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // CORS - Allow requests from frontend with detailed configuration
    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        const allowedOrigins = [
          'http://localhost:3001', 
          'http://localhost:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3000'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(null, true); // Allow all origins in development
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Length', 'X-Request-Id'],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204
    };

    this.app.use(cors(corsOptions));

    // Explicit OPTIONS handler for all routes
    this.app.options('*', cors(corsOptions));

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Additional CORS headers middleware (backup)
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      
      // Handle preflight
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      next();
    });

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
    this.app.use('/api/roles', RoleController);
    this.app.use('/api/thresholds', ThresholdController);
    this.app.use('/api/alerts', AlertController);
    this.app.use('/api/farms', FarmController);
    this.app.use('/api/zones', ZoneController);
    this.app.use('/api/sensor-types', SensorTypeController);

    // Demo Routes - Show Architecture Flow
    this.app.get('/api/demo/architecture-flow', DemoController.showArchitectureFlow.bind(DemoController));
    this.app.post('/api/demo/test-flow', DemoController.testUseCaseFlow.bind(DemoController));
    this.app.get('/api/demo/sensor-data', DemoController.getSensorData.bind(DemoController));

    // Debug Routes - Check seeded data
    this.app.get('/api/debug/seed-data', DebugController.getSeedData.bind(DebugController));

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
