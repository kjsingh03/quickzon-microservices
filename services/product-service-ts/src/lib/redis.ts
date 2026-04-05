import Redis from "ioredis"

const REDIS_HOST: string = process.env.REDIS_HOST ?? "redis";
const REDIS_PORT = process.env.REDIS_PORT ?? "6379";

export function RedisClient() {
    return new Redis({ host: REDIS_HOST, port: parseInt(REDIS_PORT), });
}