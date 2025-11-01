// Device Control - Infrastructure - gRPC Client
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const logger = require('../../../shared-kernel/utils/logger');
const config = require('../../../shared-kernel/config');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../../grpc_server/actuator.proto');

class GrpcClient {
  constructor() {
  this.clients = {};
  this.packageDefinition = null;
  this.protoDescriptor = null;
  this.actuatorService = null;
  }

  async initialize() {
    try {
      this.packageDefinition = await protoLoader.load(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });

      const loadedDescriptor = grpc.loadPackageDefinition(this.packageDefinition);
      // Handle proto namespace packages (e.g., smart_agriculture.v1)
      const serviceNamespace = loadedDescriptor.smart_agriculture?.v1 || loadedDescriptor;

      if (!serviceNamespace?.ActuatorManagerService) {
        throw new Error('ActuatorManagerService definition not found in proto descriptor');
      }

      this.protoDescriptor = serviceNamespace;
      this.actuatorService = serviceNamespace.ActuatorManagerService;
      
      logger.info('gRPC Client initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize gRPC Client: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create gRPC client for specified address
   * @param {string} address - gRPC server address (e.g., '0.0.0.0:50051')
   * @returns {object} gRPC client instance
   */
  getClient(address = config.grpc?.actuatorAddress || '0.0.0.0:50051') {
    if (!this.clients[address]) {
      if (!this.actuatorService) {
        throw new Error('gRPC Client not initialized. Call initialize() first.');
      }

      const credentials = grpc.credentials.createInsecure();
      this.clients[address] = new this.actuatorService(address, credentials);
      logger.info(`Created gRPC client for address: ${address}`);
    }

    return this.clients[address];
  }

  /**
   * Control actuator via gRPC
   * @param {string} deviceId - Device ID to control
   * @param {string} action - Action to perform ('TURN_ON' or 'TURN_OFF')
   * @param {string} address - gRPC server address (optional)
   * @returns {Promise<object>} Response from gRPC server
   */
  async controlActuator(deviceId, action, address = config.grpc?.actuatorAddress || '0.0.0.0:50051') {
    return new Promise((resolve, reject) => {
      const client = this.getClient(address);

      const request = {
        device_id: deviceId,
        action: action // 'TURN_ON' or 'TURN_OFF'
      };

      logger.info(`Sending gRPC request to ${address}: ${JSON.stringify(request)}`);

      client.ControlActuator(request, (err, response) => {
        if (err) {
          logger.error(`gRPC error from ${address}: ${err.message}`);
          reject(err);
        } else {
          logger.info(`gRPC response received: ${JSON.stringify(response)}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * Get actuator status via gRPC
   * @param {string} deviceId - Device ID to query
   * @param {string} address - gRPC server address (optional)
   * @returns {Promise<object>} Actuator status response
   */
  async getActuatorStatus(deviceId, address = config.grpc?.actuatorAddress || '0.0.0.0:50051') {
    return new Promise((resolve, reject) => {
      const client = this.getClient(address);

      const request = {
        device_id: deviceId
      };

      logger.info(`Querying actuator status: ${deviceId} from ${address}`);

      client.GetActuatorStatus(request, (err, response) => {
        if (err) {
          logger.error(`gRPC error: ${err.message}`);
          reject(err);
        } else {
          logger.info(`Actuator status response: ${JSON.stringify(response)}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * Close all gRPC client connections
   */
  closeAll() {
    Object.values(this.clients).forEach(client => {
      if (client) {
        client.close();
      }
    });
    this.clients = {};
    logger.info('All gRPC clients closed');
  }

  /**
   * Close specific gRPC client connection
   * @param {string} address - gRPC server address
   */
  close(address) {
    if (this.clients[address]) {
      this.clients[address].close();
      delete this.clients[address];
      logger.info(`gRPC client closed for address: ${address}`);
    }
  }
}

// Singleton instance
let grpcClient = null;

const getGrpcClient = async () => {
  if (!grpcClient) {
    grpcClient = new GrpcClient();
    await grpcClient.initialize();
  }
  return grpcClient;
};

module.exports = {
  getGrpcClient,
  GrpcClient
};
