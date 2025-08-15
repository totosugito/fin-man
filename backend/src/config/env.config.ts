import dotenv from 'dotenv';
export const LogLevel = {
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
} as const;
export const schema = Type.Object({
  POSTGRES_HOST: Type.String(),
  POSTGRES_USER: Type.String(),
  POSTGRES_PASSWORD: Type.String(),
  POSTGRES_DB: Type.String(),
  POSTGRES_PORT: Type.Number({ default: 5432 }),
  LOG_LEVEL: Type.Enum(LogLevel),
  HOST: Type.String({ default: 'localhost' }),
  PORT: Type.Number({ default: 5150 }),
  FRONTEND_URL: Type.String({ default: 'http://localhost:5173' }),
  COOKIE_PREFIX: Type.String({ default: 'cookie' }),
  BETTER_AUTH_SECRET: Type.String({ default: 'secret' }),
});

// Delete only keys defined in schema from process.env
for (const key of Object.keys(schema.properties)) {
  delete process.env[key];
}

// set env file
dotenv.config({ path: process.env.NODE_ENV === 'development' ? '.env.devel' : '.env' });

import { type Static, Type } from '@sinclair/typebox';
import envSchema from 'env-schema';

const env = envSchema<Static<typeof schema>>({
  dotenv: false,
  schema,
});

export default {
  version: process.env.npm_package_version ?? '0.0.0',
  log: {
    level: env.LOG_LEVEL,
  },
  server: {
    cookiePrefix: env.COOKIE_PREFIX,
    secretKey: env.BETTER_AUTH_SECRET,
    host: env.HOST,
    port: env.PORT,
    frontendUrl: env.FRONTEND_URL,
    uploadsUrl: process.env.NODE_ENV === 'development' ?
      `https://${env.HOST}:${env.PORT}` : `https://${env.FRONTEND_URL}`,
    uploadsUserDir: 'uploads/users',
    trustedOrigins: [
      env.HOST,
      `http://${env.HOST}:${env.PORT}`,
      `http://${env.FRONTEND_URL}`,
      `https://${env.HOST}:${env.PORT}`,
      `https://${env.FRONTEND_URL}`
    ],
  },
  db: {
    url: `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`,
  },
};
