import amqp from "amqplib";
import { RABBITMQ_URL } from "../../index.js";

const exchange = "batch_exchange";
const queue = "batch_queue";
const routingKey = "batch_key";

const connection = await amqp.connect(RABBITMQ_URL);
const channel = await connection.createChannel();

await channel.assertExchange(exchange, "direct", { durable: true });

await channel.assertQueue(queue, {
    durable: true,
    arguments: { "x-queue-type": "lazy" } // Only if lazy queue requierd
});
await channel.bindQueue(queue, exchange, routingKey);

console.log("[*] Waiting for delayed orders...");

channel.consume(queue, (msg) => {
    if (msg) {
        const order = JSON.parse(msg.content.toString());

        order.status = "processed";
        order.processedAt = new Date().toISOString();

        console.log("Order Updated:", order);

        channel.ack(msg);
    }
});