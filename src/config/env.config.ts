import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('127.0.0.1'),
  BASE_URL: z.string().default('http://localhost:3333'),
  API_VERSION: z.string().default('1.0.0'),
  GROQ_API_KEY: z.string(),
  DATABASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
