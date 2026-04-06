import { rabbit } from "./rabbit/rabbit.js";
import { getRedis, closeRedis } from "./rabbit/redis.js";
import { publishUserSignupEvent } from "./rabbit/publisher.js";
import { startAnalyticsWorker, startLoggingWorker, startEmailWorker } from "./rabbit/workers.js";

async function main() {
    await getRedis();
    await rabbit.init();

    await startAnalyticsWorker();
    await startLoggingWorker();
    await startEmailWorker();

    await publishUserSignupEvent({ userId: "u_123", email: "user@example.com", plan: "pro", });

    console.log(JSON.stringify({ level: "info", msg: "workers started" }));
}

main().catch(async (err) => {
    console.error(JSON.stringify({ level: "error", msg: "fatal startup error", err: String(err) }));
    await closeRedis().catch(() => undefined);
    await rabbit.close().catch(() => undefined);
    process.exit(1);
});

process.on("SIGINT", async () => {
    await closeRedis().catch(() => undefined);
    await rabbit.close().catch(() => undefined);
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await closeRedis().catch(() => undefined);
    await rabbit.close().catch(() => undefined);
    process.exit(0);
});