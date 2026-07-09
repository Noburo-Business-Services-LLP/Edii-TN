import ApiError from '../utils/ApiError.js';

// Validates req.body against a Joi schema. Returns the first friendly message.
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });
  if (error) return next(new ApiError(400, error.details[0].message));
  req.body = value;
  next();
};
