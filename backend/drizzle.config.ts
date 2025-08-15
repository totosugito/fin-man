import { defineConfig } from 'drizzle-kit';
import envConfig from './src/config/env.config.ts';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: envConfig.db.url,
  },
});
