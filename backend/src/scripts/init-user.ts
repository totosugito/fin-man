import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {users, accounts} from '../db/schema/auth.ts';
import {eq} from "drizzle-orm";
import pg from "pg";
import envConfig from "../config/env.config.ts";
import {drizzle} from "drizzle-orm/node-postgres";
import * as schema from '../db/schema/index.ts';

import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'development' ? '.env.devel' : '.env' });

async function seed() {
  const pool = new pg.Pool({
    connectionString: envConfig.db.url,
    max: 10,
  });

  const db = drizzle({ client: pool, schema });
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      usePlural: true,
    })
  });

  const now = new Date();
  const email = process.env.ADMIN_DEFAULT_EMAIL;
  const name = process.env.ADMIN_DEFAULT_NAME;
  const plainPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!email || !name || !plainPassword)
    throw Error(`Missing default user env variables. [email (${email}}), name (${name}), password (${plainPassword})]`);

  const context = await auth.$context;
  const hashedPassword = await context.password.hash(plainPassword);

  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Default user already exists. Skipping seeding.');
    return;
  }

  try {
    // Insert user
    const user_ = (await db.insert(users).values({
      email: email.toLowerCase(),
      name,
      emailVerified: false,
      role: 'admin',
      image: null,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
    }).onConflictDoNothing().returning())[0];

    // Insert account
    await db.insert(accounts).values({
      providerId: 'credential', // this is required by better-auth
      accountId: user_.id,
      userId: user_.id,
      password: hashedPassword,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      scope: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`Admin user created with email: ${email}`);
  } catch (e) {
    console.error(`Error inserting user: ${e}`);
    return;
  } finally {
    await pool.end();
  }
}

seed().then(() => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log('Seeding complete');
})
