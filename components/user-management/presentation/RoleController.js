// User Management - Presentation - Role Controller
// Implements the communication diagram for Manage Users/Role Administration.
const express = require('express');
const Joi = require('joi');

const RoleService = require('../application/RoleService');
const ResponseHandler = require('../../../shared-kernel/utils/response');
const Validator = require('../../../shared-kernel/utils/validator');
const Role = require('../domain/Role');

const router = express.Router();

const createRoleSchema = Joi.object({
  name: Joi.string().valid(...Role.ROLE_NAMES).required(),
  description: Joi.string().allow('', null).optional(),
  permissions: Joi.array().items(Joi.string().valid(...Role.PERMISSIONS)).default([]),
});

const updateRoleSchema = Joi.object({
  description: Joi.string().allow('', null),
  permissions: Joi.array().items(Joi.string().valid(...Role.PERMISSIONS)),
}).min(1);

// Step 1: Admin requests manageRoles()
router.get('/', async (req, res) => {
  try {
    const roles = await RoleService.getAllRoles();
    return ResponseHandler.success(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
});

// Step 2: createOrUpdateRole(roleDTO)
router.post('/', async (req, res) => {
  try {
    const validation = Validator.validate(createRoleSchema, req.body);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    const role = await RoleService.createRole(validation.value);
    return ResponseHandler.created(res, role, 'Role created successfully');
  } catch (error) {
    if (error.message === 'Role already exists') {
      return ResponseHandler.badRequest(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

// Step 2 (update path)
router.put('/:id', async (req, res) => {
  try {
    const validation = Validator.validate(updateRoleSchema, req.body);
    if (!validation.isValid) {
      return ResponseHandler.badRequest(res, 'Validation failed', validation.errors);
    }

    const role = await RoleService.updateRole(req.params.id, validation.value);
    return ResponseHandler.success(res, role, 'Role updated successfully');
  } catch (error) {
    if (error.message === 'Role not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await RoleService.deleteRole(req.params.id);
    return ResponseHandler.success(res, null, 'Role deleted successfully');
  } catch (error) {
    if (error.message === 'Role not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.serverError(res, error.message);
  }
});

module.exports = router;

