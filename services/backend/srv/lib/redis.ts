import cds from "@sap/cds";
import Redis from "ioredis";

const redisLogger = cds.log("redis", { label: "redis" });

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL as string, {
      db: 0,
    });

    redis.on("connect", () => {
      redisLogger.info("Connected to Redis");
    });

    redis.on("reconnecting", () => {
      redisLogger.info("Reconnecting to Redis");
    });

    redis.on("close", () => {
      redisLogger.info("Disconnected from Redis");
    });

    redis.on("error", (err) => {
      redisLogger.error("Redis error:", err);
    });
  }
  return redis;
}
