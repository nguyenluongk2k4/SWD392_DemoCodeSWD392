// WebSocket Gateway - Real-time Communication
const { Server } = require('socket.io');
const logger = require('../../shared-kernel/utils/logger');
const { eventBus, Events } = require('../../shared-kernel/event-bus');

class WebSocketGateway {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventListeners();
    this.setupSocketHandlers();

    logger.info('✅ WebSocket Gateway initialized');
  }

  setupEventListeners() {
    // Listen to sensor data events
    eventBus.subscribe(Events.SENSOR_DATA_RECEIVED, (data) => {
      this.broadcast('sensor:data', data);
    });

    eventBus.subscribe(Events.SENSOR_DATA_PROCESSED, (data) => {
      this.broadcast('sensor:data:processed', data);
    });

    // Listen to device control events
    eventBus.subscribe(Events.DEVICE_CONTROLLED, (data) => {
      this.broadcast('device:controlled', data);
    });

    // Listen to threshold exceeded events
    eventBus.subscribe(Events.THRESHOLD_EXCEEDED, (data) => {
      this.broadcast('alert:threshold', data);
    });

    // Listen to alert created events
    eventBus.subscribe(Events.ALERT_CREATED, (data) => {
      this.broadcast('alert:created', data);
    });

    eventBus.subscribe(Events.ALERT_NOTIFIED, (data) => {
      this.broadcast('alert:notified', data);
    });

    eventBus.subscribe(Events.ALERT_UPDATED, (data) => {
      this.broadcast('alert:updated', data);
    });

    eventBus.subscribe(Events.ALERT_ACKNOWLEDGED, (data) => {
      this.broadcast('alert:acknowledged', data);
    });

    eventBus.subscribe(Events.ALERT_RESOLVED, (data) => {
      this.broadcast('alert:resolved', data);
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      logger.info(`🔌 WebSocket client connected: ${clientId}`);

      this.connectedClients.set(clientId, {
        socket,
        connectedAt: new Date(),
      });

      // Handle client disconnection
      socket.on('disconnect', () => {
        logger.info(`🔌 WebSocket client disconnected: ${clientId}`);
        this.connectedClients.delete(clientId);
      });

      // Handle subscription to specific topics
      socket.on('subscribe', (topic) => {
        socket.join(topic);
        logger.info(`Client ${clientId} subscribed to ${topic}`);
      });

      socket.on('unsubscribe', (topic) => {
        socket.leave(topic);
        logger.info(`Client ${clientId} unsubscribed from ${topic}`);
      });

      // Send welcome message
      socket.emit('connected', {
        clientId,
        message: 'Connected to Smart Agriculture System',
        timestamp: new Date(),
      });
    });
  }

  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, {
        event,
        data,
        timestamp: new Date(),
      });
      logger.info(`📡 Broadcast: ${event}`);
    }
  }

  sendToClient(clientId, event, data) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.socket.emit(event, {
        event,
        data,
        timestamp: new Date(),
      });
    }
  }

  getConnectedClientsCount() {
    return this.connectedClients.size;
  }
}

module.exports = new WebSocketGateway();
