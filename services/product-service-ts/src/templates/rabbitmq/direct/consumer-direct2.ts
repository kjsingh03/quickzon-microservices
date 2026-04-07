import amqp from "amqplib";
import { RABBITMQ_URL } from "../index.js";

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