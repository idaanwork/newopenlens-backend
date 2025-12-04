import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const librarySchema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().required(),
  purl: Joi.string().allow(''),
  license_declared: Joi.string().allow(''),
  license_detected: Joi.string().allow(''),
  owner: Joi.string().allow(''),
  environment: Joi.string().allow('')
});

export const validate = (data, schema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message);
    return { valid: false, errors: messages };
  }
  return { valid: true, value };
};
