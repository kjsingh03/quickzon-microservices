export const AMQP_URL = process.env.AMQP_URL ?? "amqp://guest:guest@localhost:5672";
export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const EXCHANGES = {
  EVENTS: "app.events",
  DLQ: "app.dlx",
} as const;

export const QUEUES = {
  ANALYTICS: "analytics.q",
  ANALYTICS_RETRY: "analytics.retry.q",
  ANALYTICS_DLQ: "analytics.dlq",

  LOGGING: "logging.q",
  LOGGING_RETRY: "logging.retry.q",
  LOGGING_DLQ: "logging.dlq",

  EMAIL: "email.q",
  EMAIL_RETRY: "email.retry.q",
  EMAIL_DLQ: "email.dlq",
} as const;

export const ROUTING_KEYS = {
  ANALYTICS: "user.#",
  LOGGING: "#",
  EMAIL: "user.signup",
} as const;

export const RETRY_TTL_MS = 30_000;
export const IDEMPOTENCY_DONE_TTL_SEC = 30 * 24 * 60 * 60; // 30 days
export const IDEMPOTENCY_LOCK_TTL_SEC = 5 * 60; // 5 minutes
export const MAX_RETRIES = 5;