import Joi from 'joi';

// Password policy: 8–128 chars, at least one letter and one number.
const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .required()
  .messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password is too long',
    'string.pattern.base': 'Password must include at least one letter and one number',
    'any.required': 'Password is required',
  });

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name is too short',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Enter a valid email address',
    'string.empty': 'Email is required',
  }),
  password,
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Enter a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});
