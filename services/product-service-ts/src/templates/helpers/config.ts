const RABBITMQ_HOST = process.env.RABBITMQ_HOST ?? "localhost";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT ?? "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER ?? "guest";
const RABBITMQ_PASS = process.env.RABBITMQ_PASS ?? "guest";

export const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;