import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App Configuration
  RECUROX_PORT: Joi.number().default(3000),

  // RabbitMQ Configuration
  RECUROX_RABBITMQ_USER: Joi.string().required(),
  RECUROX_RABBITMQ_PASS: Joi.string().required(),
  RECUROX_RABBITMQ_URI: Joi.string().uri().required(),

  // Redis Configuration
  RECUROX_REDIS_URL: Joi.string().required(),
  RECUROX_REDIS_DISABLE_SSL: Joi.boolean().default(false),

  // PostgreSQL Configuration
  RECUROX_POSTGRES_HOST: Joi.string().required(),
  RECUROX_POSTGRES_PORT: Joi.number().default(5432),
  RECUROX_POSTGRES_USER: Joi.string().required(),
  RECUROX_POSTGRES_PASSWORD: Joi.string().required(),
  RECUROX_POSTGRES_DB: Joi.string().required(),
  RECUROX_POSTGRES_LOGGING: Joi.boolean().default(false),
});
