// src/shared/db.ts
import { config } from './config.js';

// Connection placeholder using the validated database URL
// (You will replace this with your ORM / driver instance like Prisma, Drizzle, or Kysely)
export const db = {
  url: config.DATABASE_URL,
};