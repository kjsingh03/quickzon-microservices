import amqp from "amqplib";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST ?? "localhost";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT ?? "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER ?? "guest";
const RABBITMQ_PASS = process.env.RABBITMQ_PASS ?? "guest";

const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

const exchange = "mail_exchange";
const mailQueue = "mail_queue1";
const routingKey = "send_email1";

export async function receiveMail() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(mailQueue, { durable: false, });

        channel.consume(mailQueue, (msg) => {
            if (msg) {
                console.log("[RabbitMQ] Message Received by consumer 1: ", JSON.parse(msg.content.toString()));
                channel.ack(msg)
            }
        })
    } catch (e) {
        console.log("[RabbitMQ] Error:", e)
    }
}   