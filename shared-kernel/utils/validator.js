// Shared Kernel - Validation Utility
const Joi = require('joi');

class Validator {
  // Validate request body
  static validate(schema, data) {
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return { isValid: false, errors };
    }
    
    return { isValid: true, value };
  }

  // Common validation schemas
  static schemas = {
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  };
}

module.exports = Validator;
