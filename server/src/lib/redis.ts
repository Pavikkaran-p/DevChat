import Redis from "ioredis";
import { config } from "../config/env.js";

function createRedisClient(name: string): Redis {
  const client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      console.log(
        `[Redis:${name}] Reconnecting in ${delay}ms (attempt ${times})`,
      );
      return delay;
    },
    reconnectOnError(err: Error) {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  client.on("connect", () => {
    console.log(`[Redis:${name}] Connected`);
  });

  client.on("error", (err: Error) => {
    console.error(`[Redis:${name}] Error:`, err.message);
  });

  client.on("close", () => {
    console.log(`[Redis:${name}] Connection closed`);
  });

  return client;
}

/** Primary Redis client for general use (sessions, caching, etc.) */
export const redis = createRedisClient("primary");

/** Dedicated pub client for Socket.io Redis adapter */
export const redisPub = createRedisClient("pub");

/** Dedicated sub client for Socket.io Redis adapter */
export const redisSub = createRedisClient("sub");
