const Joi = require('joi');

// Register Validation Schema
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

// Login Validation Schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});


// ... (keep existing schemas)

const urlSchema = Joi.object({
  originalUrl: Joi.string().uri().required().messages({
    'string.uri': 'Invalid URL format. Must start with http:// or https://',
    'any.required': 'Original URL is required'
  })
});

const validateUrl = (url) => {
  try {
    Joi.assert({ originalUrl: url }, urlSchema);
    return true;
  } catch (error) {
    return false;
  }
};

// Update module.exports to include it
module.exports = {
  registerSchema,
  loginSchema,
  urlSchema,
  validateUrl
};