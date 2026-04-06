import amqp from "amqplib";
import { RABBITMQ_URL } from "../../index.js";

const exchange = "priority_exchange";
const queue = "priority_queue";
const exchangeType = "direct";

async function consumeMessages() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchange, exchangeType, { durable: true });

        await channel.assertQueue(queue, {
            durable: true,
            arguments: { "x-max-priority": 10 }
        });

        await channel.bindQueue(queue, exchange, "priority_key");
        console.log("[*] Waiting for messages...");

        channel.consume(queue, (msg) => {
            if (msg) {
                const routingKey = msg.fields.routingKey;
                const content = JSON.parse(msg.content.toString());

                console.log(`📥 Received [${routingKey}]:`, content);

                channel.ack(msg);
            }
        });

    } catch (err) {
        console.error("[RabbitMQ Consumer Error]", err);
    }
}

consumeMessages();