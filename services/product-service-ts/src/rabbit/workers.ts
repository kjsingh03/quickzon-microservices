import { ConsumeMessage } from "amqplib";
import { rabbit } from "./rabbit.js";
import { getRedis } from "./redis.js";
import { IDEMPOTENCY_DONE_TTL_SEC, IDEMPOTENCY_LOCK_TTL_SEC, MAX_RETRIES, QUEUES, } from "./consts.js";
import { Envelope, FatalError, RetryableError } from "./types.js";

function safeJsonParse<T>(buf: Buffer): T {
    return JSON.parse(buf.toString("utf8")) as T;
}

function serializeError(err: unknown): { name: string; message: string; stack?: string } {
    if (err instanceof Error) {
        return { name: err.name, message: err.message, stack: err.stack };
    }
    return { name: "UnknownError", message: String(err) };
}

function isRetryable(err: unknown): boolean {
    if (err instanceof FatalError) return false;
    if (err instanceof RetryableError) return true;
    if (err instanceof Error) {
        return /timeout|temporar|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(err.message);
    }
    return true;
}

// async function claimIdempotency(
//     service: string,
//     messageId: string
// ): Promise<"done" | "locked" | "new"> {
//     const redis = getRedis();

//     const doneKey = `idp:${service}:${messageId}:done`;
//     const lockKey = `idp:${service}:${messageId}:lock`;

//     const alreadyDone = await redis.get(doneKey);
//     if (alreadyDone) return "done";

//     const claimed = await redis.set(lockKey, "1", "NX", "EX", IDEMPOTENCY_LOCK_TTL_SEC);

//     return claimed === "OK" ? "new" : "locked";
// }

const CLAIM_SCRIPT = `
if redis.call("EXISTS", KEYS[1]) == 1 then
    return "done"
end

if redis.call("SET", KEYS[2], "1", "NX", "EX", ARGV[1]) then
    return "new"
end

return "locked"
`;

export async function claimIdempotency(service: string, messageId: string): Promise<"done" | "locked" | "new"> {
    const redis = getRedis();
    const doneKey = `idp:${service}:${messageId}:done`;
    const lockKey = `idp:${service}:${messageId}:lock`;

    const result = await redis.eval(CLAIM_SCRIPT, 2, doneKey, lockKey, 300);

    return result as "done" | "locked" | "new";
}

// async function markDone(service: string, messageId: string): Promise<void> {
//     const redis = getRedis();

//     const doneKey = `idp:${service}:${messageId}:done`;
//     const lockKey = `idp:${service}:${messageId}:lock`;

//     await redis.set(doneKey, "1", "EX", IDEMPOTENCY_DONE_TTL_SEC);

//     await redis.del(lockKey);
// }

const MARK_DONE_SCRIPT = `
redis.call("SET", KEYS[1], "1", "EX", ARGV[1])
redis.call("DEL", KEYS[2])
return "OK"
`;

export async function markDone(
    service: string,
    messageId: string
): Promise<void> {
    const redis = getRedis();
    const doneKey = `idp:${service}:${messageId}:done`;
    const lockKey = `idp:${service}:${messageId}:lock`;

    await redis.eval(
        MARK_DONE_SCRIPT,
        2,
        doneKey,
        lockKey,
        60 * 60 * 24 * 30 // 30 days
    );
}

async function bumpAnalytics(eventType: string, payload: Envelope<unknown>): Promise<void> {
    const redis = getRedis();

    await redis.hincrby("analytics:event_counts", eventType, 1);
    await redis.lpush("analytics:recent_events", JSON.stringify(payload));
    await redis.ltrim("analytics:recent_events", 0, 999);
}

async function sendEmail(payload: Envelope<{ to: string; subject: string; body: string }>): Promise<void> {
    // Replace with your provider: SES / SendGrid / SMTP / Resend, etc.
    console.log(JSON.stringify({
        level: "info",
        msg: "email sent",
        messageId: payload.id,
        to: payload.data.to,
        subject: payload.data.subject,
    }));
}

async function logEvent(payload: Envelope<unknown>, service: string): Promise<void> {
    console.log(JSON.stringify({
        level: "info",
        service,
        messageId: payload.id,
        eventType: payload.eventType,
        occurredAt: payload.occurredAt,
        data: payload.data,
    }));
}

async function publishRetry(service: "analytics" | "logging" | "email", msg: ConsumeMessage, retryCount: number): Promise<void> {
    const spec = rabbit.getSpec(service);
    const headers = {
        ...(msg.properties.headers ?? {}),
        "x-retry-count": retryCount,
        "x-original-routing-key": msg.fields.routingKey,
        "x-original-message-id": msg.properties.messageId,
    };

    await rabbit.publishToQueue(spec.retryQueue, msg.content, {
        messageId: msg.properties.messageId,
        correlationId: msg.properties.correlationId,
        headers,
    });
}

async function publishDlq(
    service: "analytics" | "logging" | "email",
    msg: ConsumeMessage,
    err: unknown
): Promise<void> {
    const spec = rabbit.getSpec(service);
    await rabbit.publishToExchange(
        "app.dlx",
        spec.dlqQueue,
        msg.content,
        {
            messageId: msg.properties.messageId,
            correlationId: msg.properties.correlationId,
            headers: {
                ...(msg.properties.headers ?? {}),
                "x-error": JSON.stringify(serializeError(err)),
                "x-original-routing-key": msg.fields.routingKey,
            },
        }
    );
}

async function handleMessage(
    service: "analytics" | "logging" | "email",
    msg: ConsumeMessage,
    handler: (payload: Envelope<any>) => Promise<void>,
    ch: any
): Promise<void> {
    const payload = safeJsonParse<Envelope<any>>(msg.content);
    const retryCount = Number(msg.properties.headers?.["x-retry-count"] ?? 0);

    const idpState = await claimIdempotency(service, payload.id);

    if (idpState === "done") {
        ch.ack(msg);
        return;
    }

    if (idpState === "locked") {
        if (retryCount < MAX_RETRIES) {
            await publishRetry(service, msg, retryCount + 1);
        } else {
            await publishDlq(service, msg, new Error("Too many lock retries"));
        }

        ch.ack(msg);
        return;
    }

    try {
        await handler(payload);
        await markDone(service, payload.id);
        ch.ack(msg);
    } catch (err) {
        if (isRetryable(err) && retryCount < MAX_RETRIES) {
            await publishRetry(service, msg, retryCount + 1);
        } else {
            await publishDlq(service, msg, err);
        }

        const redis = await getRedis();
        await redis.del(`idp:${service}:${payload.id}:lock`);
        ch.ack(msg);
    }
}

export async function startAnalyticsWorker(): Promise<void> {
    const ch = await rabbit.createConsumerChannel("analytics-worker");
    await ch.prefetch(20);

    await ch.consume(QUEUES.ANALYTICS, async (msg) => {
        if (!msg) return;
        await handleMessage("analytics", msg, async (payload) => {
            await bumpAnalytics(payload.eventType, payload);
        }, ch);
    }, { noAck: false });
}

export async function startLoggingWorker(): Promise<void> {
    const ch = await rabbit.createConsumerChannel("logging-worker");
    await ch.prefetch(50);

    await ch.consume(QUEUES.LOGGING, async (msg) => {
        if (!msg) return;
        await handleMessage("logging", msg, async (payload) => {
            await logEvent(payload, "logging");
        }, ch);
    }, { noAck: false });
}

export async function startEmailWorker(): Promise<void> {
    const ch = await rabbit.createConsumerChannel("email-worker");
    await ch.prefetch(5);

    await ch.consume(QUEUES.EMAIL, async (msg) => {
        if (!msg) return;
        await handleMessage("email", msg, async (payload) => {
            const data = payload.data as { to: string; subject: string; body: string };
            await sendEmail({
                ...payload,
                data,
            });
        }, ch);
    }, { noAck: false });
}