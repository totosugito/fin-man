import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import envConfig from '../config/env.config.ts';
import * as schema from './schema/index.ts';

export const pool = new pg.Pool({
  connectionString: envConfig.db.url,
  max: 4,                  // keep small, 2–4 connections max
  idleTimeoutMillis: 5000, // close idle clients after 5s to free memory
  maxUses: 1000,            // recycle clients after some queries to avoid leaks
  allowExitOnIdle: true     // let Node exit when nothing’s active
});

export const db = drizzle({ client: pool, schema });
