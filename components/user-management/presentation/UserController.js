// User Management - Presentation - User Controller
const express = require('express');
const UserService = require('../application/UserService');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const Validator = require('../../../shared-kernel/utils/validator');
const logger = require('../../../shared-kernel/utils/logger');
const Joi = require('joi');

const router = express.Router();

const sanitizePayload = (payload = {}) => {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return acc;
      }
      acc[key] = trimmed;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};

// Create User Schema
// const createUserSchema = Joi.object({
//   username: Joi.string().min(3).max(50).required(),
//   email: Validator.schemas.email,
//   password: Validator.schemas.password,
//   fullName: Joi.string().min(2).max(100).required(),
//   phoneNumber: Validator.schemas.phoneNumber,
//   role: Validator.schemas.mongoId.required(),
// });

/**
 * @route   POST /api/users
 * @desc    Create new user (UC06)
 * @access  Private (Admin only)
 */
router.post('/', async (req, res) => {
  try {
    const sanitizedBody = sanitizePayload(req.body);
    // Step 2: Admin submits CreateUser(name,email,role,password)
    const validation = Validator.validate(createUserSchema, sanitizedBody);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    // Step 2.1: Delegate to UserService.createUser(userData)
    const user = await UserService.createUser(validation.value);
    return ResponseHandler.created(res, user, 'User created successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      return ResponseHandler.badRequest(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (UC06)
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Step 1: Admin selects "Manage Users" (UI) → controller fetches list
    // Step 1.1: UserController -> UserService.getAllUsers()
    const users = await UserService.getAllUsers();
    // Step 1.1.1: userList returned from service/repository chain
    return ResponseHandler.success(res, users, 'Users retrieved successfully');
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (UC06)
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    return ResponseHandler.success(res, user, 'User retrieved successfully');
  } catch (error) {
    if (error.message === 'User not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (UC06)
 * @access  Private (Admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    const sanitizedBody = sanitizePayload(req.body);
    const user = await UserService.updateUser(req.params.id, sanitizedBody);
    return ResponseHandler.success(res, user, 'User updated successfully');
  } catch (error) {
    logger.error('Error in UserController.put:', {
      userId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    if (error.message === 'User not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (UC06)
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    await UserService.deleteUser(req.params.id);
    return ResponseHandler.success(res, null, 'User deleted successfully');
  } catch (error) {
    if (error.message === 'User not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

module.exports = router;
