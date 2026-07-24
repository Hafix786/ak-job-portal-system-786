// src/shared/config.ts — the ONLY place in the app that reads process.env
import { z } from 'zod';

// (1) VALIDATE — declare every variable the app needs, and its rules.
const EnvSchema = z.object({
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
  PORT:         z.coerce.number().int().positive().default(3000),  // (3) COERCE: "3000" → 3000
  DATABASE_URL: z.string().url(),                                  // required; secrets get no default
  REDIS_URL:    z.string().url(),
  JWT_SECRET:   z.string().min(32),                               // required AND long enough to be safe
});

// Validate the WHOLE environment once, here, at startup.
const parsed = EnvSchema.safeParse(process.env);

// (2) FAIL FAST — if anything is missing or malformed, crash NOW, on purpose.
if (!parsed.success) {
  // log the KEYS and the problem — NEVER the values — then exit
  console.error('✖ Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Typed, validated, guaranteed-present. The rest of the app imports THIS.
export const config = parsed.data;