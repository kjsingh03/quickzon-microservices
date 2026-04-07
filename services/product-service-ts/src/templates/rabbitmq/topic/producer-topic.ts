import amqp from "amqplib";
import { RABBITMQ_URL } from "../index.js";

const exchange = "notification_exchange";
const exchangeType = "topic";

export async function sendMessage(routingKey: string, message: any) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchange, exchangeType, { durable: true });

        channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)))

        console.log("[RabbitMQ] message sent");

        return message
    } catch (e) {
        console.log("[RabbitMQ error]", e);
    }
}

await sendMessage("user.created", { userId: 123, name: "Karan" });
await sendMessage("user.updated", { userId: 123, name: "Kannu" });
await sendMessage("payment.completed", { paymentId: 456, amount: 99.99 });