import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl) {
  throw new Error("Configuration Error: UPSTASH_REDIS_REST_URL is not set");
}

if (!redisToken) {
  throw new Error("Configuration Error: UPSTASH_REDIS_REST_TOKEN is not set");
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
