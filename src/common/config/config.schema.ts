import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App Configuration
  RECUROX_PORT: Joi.number().default(3000),

  // RabbitMQ Configuration
  RECUROX_RABBITMQ_USER: Joi.string().required(),
  RECUROX_RABBITMQ_PASS: Joi.string().required(),
  RECUROX_RABBITMQ_URI: Joi.string().uri().required(),
});
