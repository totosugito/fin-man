import FastifyCors, { type FastifyCorsOptions } from '@fastify/cors';
import envConfig from "../../config/env.config.ts";

export const autoConfig: FastifyCorsOptions = {
  origin: envConfig.server.trustedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export default FastifyCors;
