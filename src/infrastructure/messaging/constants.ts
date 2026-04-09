export const RABBITMQ_EXCHANGES = {
  COMMANDS: 'exchange.direct.commands',
  EVENTS: 'exchange.topic.events',
  DLX: 'exchange.dlx',
} as const;

export const RABBITMQ_QUEUES = {
  EMAIL: 'email.queue',
  EMAIL_DLQ: 'email.queue.dlq',
  NOTIFICATIONS: 'notifications.queue',
  NOTIFICATIONS_DLQ: 'notifications.queue.dlq',
} as const;

export const RABBITMQ_ROUTING_KEYS = {
  EMAIL_SEND: 'email.send',
  NOTIFICATIONS_SEND: 'notifications.send', // if direct
  USER_CREATED: 'user.created', // if topic
} as const;
