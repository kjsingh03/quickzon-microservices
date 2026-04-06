import amqp from "amqplib";
import { RABBITMQ_URL } from "../../index.js";

const exchange = "priority_exchange";
const queue = "priority_queue";
const exchangeType = "direct";

export async function sendMessage() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchange, exchangeType, { durable: true });
        await channel.assertQueue(queue, { durable: true, arguments: { "x-max-priority": 10 } });

        await channel.bindQueue(queue, exchange, "priority_key");

        const data = [
            { taskId: 1, description: "Low priority task", priority: 1 },
            { taskId: 2, description: "Medium priority task", priority: 5 },
            { taskId: 3, description: "High priority task", priority: 10 },
        ]

        data.map((msg) =>   
            channel.publish(exchange, "priority_key", Buffer.from(JSON.stringify(msg)), { priority: msg.priority })
        )

        console.log("[RabbitMQ] message sent");

        setTimeout(() => {
            connection.close();
        }, 500);

        return data
    } catch (e) {
        console.log("[RabbitMQ error]", e);
    }
}

await sendMessage();