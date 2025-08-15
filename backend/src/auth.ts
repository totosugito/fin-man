import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {admin, openAPI} from 'better-auth/plugins';
import {db} from './db/index.ts';
import envConfig from "./config/env.config.ts";

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  plugins: [
    admin(),
    openAPI({
      path: '/docs',
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 1 week
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 1,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({user, url}) => {
      // Simulate sending a reset password email
      console.info(`Simulating sending reset password link to ${user.email} with URL: ${url}`);

      // Return a resolved promise with no value
      return Promise.resolve();
    },
    // sendResetPassword: async ({user, url, token}, request) => {
    //   await sendEmail({
    //     to: user.email,
    //     subject: "Reset your password",
    //     text: `Click the link to reset your password: ${url}`,
    //   });
    // },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },

  advanced: {
    cookiePrefix: envConfig.server.cookiePrefix, // the data cookies saved on client side will be prefixed with this prefix
    database: {
      generateId: false,
    },
  },
  trustedOrigins: envConfig.server.trustedOrigins,
  secretKey: envConfig.server.secretKey,
  debug: false,
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;

export default auth;
