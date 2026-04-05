import amqp from "amqplib";
import type { ConfirmChannel, Connection, Channel, ChannelModel } from "amqplib";
import { once } from "node:events";
import { AMQP_URL, EXCHANGES, QUEUES, ROUTING_KEYS, RETRY_TTL_MS, } from "./consts";

type QueueSpec = {
    mainQueue: string;
    retryQueue: string;
    dlqQueue: string;
    bindingKey: string;
};

const SPECS: Record<string, QueueSpec> = {
    analytics: {
        mainQueue: QUEUES.ANALYTICS,
        retryQueue: QUEUES.ANALYTICS_RETRY,
        dlqQueue: QUEUES.ANALYTICS_DLQ,
        bindingKey: ROUTING_KEYS.ANALYTICS,
    },
    logging: {
        mainQueue: QUEUES.LOGGING,
        retryQueue: QUEUES.LOGGING_RETRY,
        dlqQueue: QUEUES.LOGGING_DLQ,
        bindingKey: ROUTING_KEYS.LOGGING,
    },
    email: {
        mainQueue: QUEUES.EMAIL,
        retryQueue: QUEUES.EMAIL_RETRY,
        dlqQueue: QUEUES.EMAIL_DLQ,
        bindingKey: ROUTING_KEYS.EMAIL,
    },
};

class RabbitManager {
    private connection: ChannelModel  | null = null;
    private publisher: ConfirmChannel | null = null;
    private connecting: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.connection && this.publisher) return;
        if (this.connecting) return this.connecting;

        this.connecting = this.connectOnce();
        try {
            await this.connecting;
        } finally {
            this.connecting = null;
        }
    }

    private async connectOnce(): Promise<void> {
        const conn = await amqp.connect(AMQP_URL, {
            clientProperties: { connection_name: "rabbitmq-production-sample" },
        } as any);

        conn.on("close", () => this.reset());
        conn.on("error", () => this.reset());

        this.connection = conn;

        const pub = await conn.createConfirmChannel();
        this.publisher = pub;

        await this.setupTopology(pub);
    }

    private reset(): void {
        this.connection = null;
        this.publisher = null;
    }

    private async setupTopology(ch: Channel): Promise<void> {
        await ch.assertExchange(EXCHANGES.EVENTS, "topic", { durable: true });
        await ch.assertExchange(EXCHANGES.DLQ, "direct", { durable: true });

        for (const service of Object.keys(SPECS)) {
            const spec = SPECS[service];

            await ch.assertQueue(spec.mainQueue, {
                durable: true,
                arguments: {
                    "x-dead-letter-exchange": EXCHANGES.DLQ,
                    "x-dead-letter-routing-key": spec.dlqQueue,
                    // Uncomment in a RabbitMQ cluster if you want replicated queues:
                    // "x-queue-type": "quorum",
                },
            });

            await ch.assertQueue(spec.retryQueue, {
                durable: true,
                arguments: {
                    "x-message-ttl": RETRY_TTL_MS,
                    "x-dead-letter-exchange": "",
                    "x-dead-letter-routing-key": spec.mainQueue,
                    // "x-queue-type": "quorum",
                },
            });

            await ch.assertQueue(spec.dlqQueue, {
                durable: true,
                // "x-queue-type": "quorum",
            });

            await ch.bindQueue(spec.mainQueue, EXCHANGES.EVENTS, spec.bindingKey);
            await ch.bindQueue(spec.dlqQueue, EXCHANGES.DLQ, spec.dlqQueue);

            // retry queues are published to via the default exchange by queue name
            // so they do not need an explicit binding
        }
    }

    async getPublisher(): Promise<ConfirmChannel> {
        await this.init();
        if (!this.publisher) {
            throw new Error("RabbitMQ publisher channel is not available");
        }
        return this.publisher;
    }

    async createConsumerChannel(name: string): Promise<Channel> {
        await this.init();
        if (!this.connection) {
            throw new Error("RabbitMQ connection is not available");
        }

        const ch = await this.connection.createChannel();
        ch.on("close", () => console.error(JSON.stringify({ level: "warn", msg: "consumer channel closed", name })));
        ch.on("error", (err) => console.error(JSON.stringify({ level: "error", msg: "consumer channel error", name, err: String(err) })));
        return ch;
    }

    async publishToExchange(
        exchange: string,
        routingKey: string,
        body: Buffer,
        options: Record<string, any> = {}
    ): Promise<void> {
        const ch = await this.getPublisher();
        const ok = ch.publish(exchange, routingKey, body, {
            persistent: true,
            contentType: "application/json",
            ...options,
        });

        if (!ok) {
            await once(ch, "drain");
        }
        await ch.waitForConfirms();
    }

    async publishToQueue(queue: string, body: Buffer, options: Record<string, any> = {}): Promise<void> {
        // Default exchange routes by queue name.
        await this.publishToExchange("", queue, body, options);
    }

    getSpec(service: keyof typeof SPECS): QueueSpec {
        return SPECS[service];
    }

    async close(): Promise<void> {
        if (this.publisher) {
            await this.publisher.close().catch(() => undefined);
        }
        if (this.connection) {
            await this.connection.close().catch(() => undefined);
        }
        this.reset();
    }
}

export const rabbit = new RabbitManager();