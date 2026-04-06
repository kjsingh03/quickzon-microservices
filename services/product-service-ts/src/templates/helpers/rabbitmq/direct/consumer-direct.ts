import amqp from "amqplib";
import { RABBITMQ_URL } from "../../index.js";

const exchange = "mail_exchange";
const mailQueue = "mail_queue2";
const routingKey = "send_email2";

export async function receiveMail2() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(mailQueue, { durable: false, });

        channel.consume(mailQueue, (msg) => {
            if (msg) {
                console.log("[RabbitMQ] Message Received by consumer 2: ", JSON.parse(msg.content.toString()));
                channel.ack(msg)
            }
        })
    } catch (e) {
        console.log("[RabbitMQ] Error:", e)
    }
}