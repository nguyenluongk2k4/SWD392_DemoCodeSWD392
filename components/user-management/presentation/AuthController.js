// User Management - Presentation - Auth Controller
const express = require('express');
const AuthService = require('../application/AuthService');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const Validator = require('../../../shared-kernel/utils/validator');
const Joi = require('joi');

const router = express.Router();

// Login Schema
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

/**
 * @route   POST /api/auth/login
 * @desc    User login (UC01)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request
    const validation = Validator.validate(loginSchema, req.body);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    const { username, password } = validation.value;

    // Login
    const result = await AuthService.login(username, password);

    return ResponseHandler.success(res, result, 'Login successful');
  } catch (error) {
    if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated') {
      return ResponseHandler.unauthorized(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return ResponseHandler.unauthorized(res, 'No token provided');
    }

    const decoded = AuthService.verifyToken(token);

    return ResponseHandler.success(res, decoded, 'Token is valid');
  } catch (error) {
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }
});

module.exports = router;
