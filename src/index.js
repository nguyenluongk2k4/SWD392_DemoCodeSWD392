// Main Entry Point - Smart Agriculture System
const http = require('http');
const config = require('../shared-kernel/config');
const logger = require('../shared-kernel/utils/logger');
const database = require('../shared-kernel/database');

// Import Gateways
const ApiGateway = require('../gateways/api-gateway');
const WebSocketGateway = require('../gateways/websocket-gateway');

// Import Infrastructure Services
const MqttHandler = require('../components/data-ingestion/infrastructure/MqttHandler');
const RoleRepository = require('../components/user-management/infrastructure/RoleRepository');
const DefaultDataSeeder = require('../shared-kernel/database/defaultDataSeeder');

// Import Application Services (to initialize event listeners)
const DataCollectorService = require('../components/data-ingestion/application/DataCollectorService');
const AutomationService = require('../components/automation-engine/application/AutomationService');
const NotificationService = require('../components/automation-engine/application/NotificationService');

class Application {
  constructor() {
    this.httpServer = null;
    this.isShuttingDown = false;
  }

  async start() {
    try {
      logger.info('Starting Smart Agriculture System...');

      // 1. Connect to Database
      await this.connectDatabase();

      // 2. Initialize default roles
      await this.initializeDefaultData();

      // 3. Connect to MQTT Broker
      await this.connectMqtt();

      // 4. Start HTTP Server with API Gateway
      await this.startHttpServer();

      // 5. Initialize WebSocket Gateway
      this.initializeWebSocket();

      // 6. Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('Smart Agriculture System started successfully!');
      logger.info('API Gateway running on port ' + config.server.port);
      logger.info('WebSocket Gateway ready');
      logger.info('Environment: ' + config.server.env);

    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  async connectDatabase() {
    try {
      await database.connect();
    } catch (error) {
      logger.warn('⚠️ Database connection failed. System will continue without database:', error.message);
      // Don't throw error - system can run without database for testing
    }
  }

  async initializeDefaultData() {
    // Skip if database is disabled
    if (!config.database.enabled) {
      logger.info('⚙️  Skipping default data initialization (Database disabled)');
      return;
    }

    try {
      logger.info('Initializing default data...');
      await RoleRepository.initializeDefaultRoles();
  await DefaultDataSeeder.seed();
      logger.info('Default data initialized');
    } catch (error) {
      logger.warn('⚠️ Error initializing default data. System will continue:', error.message);
      // Don't throw error - system can run without default data for testing
    }
  }

  async connectMqtt() {
    try {
      MqttHandler.connect();
      logger.info('MQTT Handler initialized');
    } catch (error) {
      logger.warn('MQTT connection failed. System will continue without MQTT:', error.message);
      // Don't throw error - system can run without MQTT for testing
    }
  }

  async startHttpServer() {
    return new Promise((resolve) => {
      const app = ApiGateway.getApp();
      this.httpServer = http.createServer(app);

      this.httpServer.listen(config.server.port, () => {
        logger.info('HTTP Server listening on port ' + config.server.port);
        resolve();
      });
    });
  }

  initializeWebSocket() {
    WebSocketGateway.initialize(this.httpServer);
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info(signal + ' received. Starting graceful shutdown...');

      try {
        // Close HTTP server
        if (this.httpServer) {
          await new Promise((resolve) => {
            this.httpServer.close(resolve);
          });
          logger.info('HTTP Server closed');
        }

        // Disconnect MQTT
        MqttHandler.disconnect();
        logger.info('MQTT disconnected');

        // Disconnect Database
        await database.disconnect();
        logger.info('Database disconnected');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
  }
}

// Start Application
const app = new Application();
app.start();

module.exports = app;
