import amqp from "amqplib";
import { RABBITMQ_URL } from "../index.js";

const exchange = "batch_exchange";
const exchangeType = "direct";
const routingKey = "batch_key";

const delayQueue = "batch_delay_queue";

const connection = await amqp.connect(RABBITMQ_URL);
const channel = await connection.createChannel();

await channel.assertExchange(exchange, exchangeType, { durable: true });

await channel.assertQueue(delayQueue, {
    durable: true,
    arguments: {
        "x-queue-type": "lazy",
        "x-message-ttl": 5000,
        "x-dead-letter-exchange": exchange,
        "x-dead-letter-routing-key": routingKey
    }
});

function generateBatchId() {
    return `batch_${Date.now()}`;
}

function collectOrdersForBatch() {
    return [
        { id: 1, item: "Laptop", status: "pending" },
        { id: 2, item: "Phone", status: "pending" },
        { id: 3, item: "Tablet", status: "pending" },
    ];
}

async function processBatchOrder() {
    const batchId = generateBatchId();
    const orders = collectOrdersForBatch();

    console.log(`📦 Batch Created: ${batchId}`);

    orders.forEach(order => {
        const message = { batchId, ...order };

        channel.sendToQueue(
            delayQueue,
            Buffer.from(JSON.stringify(message))
        );

        console.log("[delay queue]:", message);
    });
}

await processBatchOrder();