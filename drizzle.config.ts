import { defineConfig } from 'drizzle-kit';
import { env } from './src/config/env.config.js';

export default defineConfig({
  schema: './src/lib/db/schemas/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
