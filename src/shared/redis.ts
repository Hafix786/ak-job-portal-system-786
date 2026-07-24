// src/shared/redis.ts
import { config } from './config.js';

// Connection placeholder using the validated Redis URL
// (You will replace this with your ioredis or redis client instance)
export const redis = {
  url: config.REDIS_URL,
};