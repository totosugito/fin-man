import { Session } from '@better-auth/core';

declare module 'fastify' {
  interface FastifyRequest {
    session: Session;
  }
}
