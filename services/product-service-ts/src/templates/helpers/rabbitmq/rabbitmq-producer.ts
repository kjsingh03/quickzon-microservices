import amqp from "amqplib";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST ?? "localhost";
const RABBITMQ_PORT = process.env.RABBITMQ_PORT ?? "5672";
const RABBITMQ_USER = process.env.RABBITMQ_USER ?? "guest";
const RABBITMQ_PASS = process.env.RABBITMQ_PASS ?? "guest";

const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

const exchange = "mail_exchange";
const mailQueue1 = "mail_queue1";
const mailQueue2 = "mail_queue2";
const routingKey1 = "send_email1";
const routingKey2 = "send_email2";

export async function sendMail() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const mail = {
            to: "Hirdya@gmail.com",
            from: "Manral@gmail.com",
            subject: "Padhle boht saaf dil ke",
            message: "Schedule btaiyo aaj ka"
        }

        await channel.assertExchange(exchange,"direct",{ durable: false });
        
        await channel.assertQueue(mailQueue1, { durable: false });
        await channel.assertQueue(mailQueue2, { durable: false });

        await channel.bindQueue(mailQueue1, exchange, routingKey1);
        await channel.bindQueue(mailQueue2, exchange, routingKey2);

        channel.publish(exchange, routingKey2, Buffer.from(JSON.stringify(mail)))

        console.log("[RabbitMQ] mail sent");

        return mail
    } catch (e) {
        console.log("[RabbitMQ error]", e);
    }
}