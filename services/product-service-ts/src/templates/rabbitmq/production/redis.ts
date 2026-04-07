import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

    redis.on("error", (err: Error) => {
      console.error("Redis error", err);
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
    if (redis) {
        await redis.quit(); // graceful shutdown
        redis = null;
    }
}