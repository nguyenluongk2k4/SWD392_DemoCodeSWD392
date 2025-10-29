// Device Control - Presentation - Device Controller
const express = require('express');
const ActuatorService = require('../application/ActuatorService');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const Validator = require('../../../shared-kernel/utils/validator');
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

module.exports = router;
