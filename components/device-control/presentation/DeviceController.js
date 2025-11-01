// Device Control - Presentation - Device Controller
const express = require('express');
const ActuatorService = require('../application/ActuatorService');
const { getGrpcClient } = require('../infrastructure/GrpcClient');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const Validator = require('../../../shared-kernel/utils/validator');
const logger = require('../../../shared-kernel/utils/logger');
const Joi = require('joi');

const router = express.Router();

// Control Device Schema
const controlDeviceSchema = Joi.object({
  command: Joi.string().valid('on', 'off').required(),
});

// Register Device Schema
const registerDeviceSchema = Joi.object({
  deviceId: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().valid('pump', 'fan', 'valve', 'light', 'heater', 'cooler').required(),
  location: Joi.object({
    zone: Joi.string().optional(),
    field: Joi.string().optional(),
  }).optional(),
});

/**
 * @route   POST /api/devices/control/:deviceId
 * @desc    Control device (UC03)
 * @access  Private
 */
router.post('/control/:deviceId', async (req, res) => {
  try {
    const validation = Validator.validate(controlDeviceSchema, req.body);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    const { command } = validation.value;
    const { deviceId } = req.params;

    // TODO: Get user from JWT token
    const controlledBy = req.user?.username || 'user';

    const device = await ActuatorService.controlDevice(deviceId, command, controlledBy);

    return ResponseHandler.success(res, device, `Device ${command} command sent successfully`);
  } catch (error) {
    if (error.message === 'Device not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    if (error.message.includes('Invalid command')) {
      return ResponseHandler.badRequest(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   GET /api/devices
 * @desc    Get all devices
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const devices = await ActuatorService.getAllDevices();
    return ResponseHandler.success(res, devices, 'Devices retrieved successfully');
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   GET /api/devices/:deviceId
 * @desc    Get device status
 * @access  Private
 */
router.get('/:deviceId', async (req, res) => {
  try {
    const device = await ActuatorService.getDeviceStatus(req.params.deviceId);
    return ResponseHandler.success(res, device, 'Device status retrieved successfully');
  } catch (error) {
    if (error.message === 'Device not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   POST /api/devices
 * @desc    Register new device
 * @access  Private (Admin only)
 */
router.post('/', async (req, res) => {
  try {
    const validation = Validator.validate(registerDeviceSchema, req.body);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    const device = await ActuatorService.registerDevice(validation.value);
    return ResponseHandler.created(res, device, 'Device registered successfully');
  } catch (error) {
    if (error.message === 'Device already registered') {
      return ResponseHandler.badRequest(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   PUT /api/devices/:deviceId/automatic
 * @desc    Toggle automatic mode
 * @access  Private
 */
router.put('/:deviceId/automatic', async (req, res) => {
  try {
    const { isAutomatic } = req.body;
    const device = await ActuatorService.toggleAutomaticMode(req.params.deviceId, isAutomatic);
    
    return ResponseHandler.success(res, device, 'Automatic mode updated successfully');
  } catch (error) {
    if (error.message === 'Device not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   POST /api/devices/grpc/control/:deviceId
 * @desc    Control device via gRPC
 * @access  Private
 */
router.post('/grpc/control/:deviceId', async (req, res) => {
  try {
    const validation = Validator.validate(
      Joi.object({
        action: Joi.string().valid('TURN_ON', 'TURN_OFF').required(),
        address: Joi.string().optional()
      }),
      req.body
    );

    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    const { deviceId } = req.params;
    const { action, address } = validation.value;

    // Get gRPC client
    const grpcClient = await getGrpcClient();

    // Call gRPC to control actuator
    const response = await grpcClient.controlActuator(deviceId, action, address);

    if (response && response.actuator) {
      const actuator = response.actuator;
      
      // Update actuator status in database
      const updatedDevice = await ActuatorService.updateActuatorStatus(deviceId, {
        status: actuator.status?.toLowerCase() || action.toLowerCase().replace('turn_', ''),
        lastCommand: action,
        updatedAt: new Date()
      });

      logger.info(`Actuator ${deviceId} controlled successfully via gRPC: ${action}`);
      
      return ResponseHandler.success(
        res,
        {
          grpcResponse: response,
          dbActuator: updatedDevice
        },
        `Device ${action} command executed successfully`
      );
    } else {
      return ResponseHandler.badRequest(res, 'Invalid gRPC response received');
    }

  } catch (error) {
    logger.error(`gRPC control error: ${error.message}`);
    
    if (error.message.includes('UNAVAILABLE') || error.message.includes('ECONNREFUSED')) {
      return ResponseHandler.badRequest(res, 'gRPC server not available at specified address');
    }
    
    return ResponseHandler.serverError(res, `gRPC error: ${error.message}`);
  }
});

/**
 * @route   GET /api/devices/grpc/status/:deviceId
 * @desc    Get device status via gRPC
 * @access  Private
 */
router.get('/grpc/status/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { address } = req.query;

    // Get gRPC client
    const grpcClient = await getGrpcClient();

    // Query gRPC for actuator status
    const response = await grpcClient.getActuatorStatus(deviceId, address);

    logger.info(`Retrieved actuator ${deviceId} status via gRPC`);
    
    return ResponseHandler.success(res, response, 'Device status retrieved successfully');

  } catch (error) {
    logger.error(`gRPC status query error: ${error.message}`);
    return ResponseHandler.serverError(res, `gRPC error: ${error.message}`);
  }
});

/**
 * @route   GET /api/devices
 * @desc    Get all actuators
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const devices = await ActuatorService.getAllDevices();
    return ResponseHandler.success(res, devices, 'Devices retrieved successfully');
  } catch (error) {
    logger.error(`Error getting devices: ${error.message}`);
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   GET /api/devices/:deviceId
 * @desc    Get single actuator by ID
 * @access  Public
 */
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await ActuatorService.getDeviceById(deviceId);
    
    if (!device) {
      return ResponseHandler.notFound(res, 'Device not found');
    }
    
    return ResponseHandler.success(res, device, 'Device retrieved successfully');
  } catch (error) {
    logger.error(`Error getting device: ${error.message}`);
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   PUT /api/devices/:deviceId
 * @desc    Update actuator
 * @access  Public
 */
router.put('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const updateData = req.body;
    
    const device = await ActuatorService.updateDevice(deviceId, updateData);
    
    if (!device) {
      return ResponseHandler.notFound(res, 'Device not found');
    }
    
    logger.info(`Actuator ${deviceId} updated`);
    return ResponseHandler.success(res, device, 'Device updated successfully');
  } catch (error) {
    logger.error(`Error updating device: ${error.message}`);
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   DELETE /api/devices/:deviceId
 * @desc    Delete actuator
 * @access  Public
 */
router.delete('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await ActuatorService.deleteDevice(deviceId);
    
    if (!device) {
      return ResponseHandler.notFound(res, 'Device not found');
    }
    
    logger.info(`Actuator ${deviceId} deleted`);
    return ResponseHandler.success(res, device, 'Device deleted successfully');
  } catch (error) {
    logger.error(`Error deleting device: ${error.message}`);
    return ResponseHandler.serverError(res, error.message);
  }
});

module.exports = router;
