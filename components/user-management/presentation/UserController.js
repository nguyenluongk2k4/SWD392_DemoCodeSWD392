// User Management - Presentation - User Controller
const express = require('express');
const UserService = require('../application/UserService');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const Validator = require('../../../shared-kernel/utils/validator');
const Joi = require('joi');

const router = express.Router();

// Create User Schema
const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Validator.schemas.email,
  password: Validator.schemas.password,
  fullName: Joi.string().min(2).max(100).required(),
  phoneNumber: Validator.schemas.phoneNumber,
  role: Validator.schemas.mongoId.required(),
});

// Update User Schema
const updateUserSchema = Joi.object({
  email: Validator.schemas.email.optional(),
  password: Joi.string().min(6).optional(),
  fullName: Joi.string().min(2).max(100).optional(),
  phoneNumber: Validator.schemas.phoneNumber,
  role: Validator.schemas.mongoId.optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * @route   POST /api/users
 * @desc    Create new user (UC06)
 * @access  Private (Admin only)
 */
router.post('/', async (req, res) => {
  try {
    const validation = Validator.validate(createUserSchema, req.body);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

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
    const users = await UserService.getAllUsers();
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
    const validation = Validator.validate(updateUserSchema, req.body);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    const user = await UserService.updateUser(req.params.id, validation.value);
    return ResponseHandler.success(res, user, 'User updated successfully');
  } catch (error) {
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
