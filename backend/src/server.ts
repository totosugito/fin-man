import closeWithGrace from 'close-with-grace';

import { ajvFilePlugin } from '@fastify/multipart';
import { buildApp } from './app.ts';
import envConfig from './config/env.config.ts';

async function startServer() {
  const app = await buildApp({
    logger: {
      level: envConfig.log.level,
      redact: ['headers.authorization'],
    },
    ignoreTrailingSlash: true,
    ajv: {
      plugins: [ajvFilePlugin],
    },
  });

  closeWithGrace(async ({ signal, err }) => {
    if (err) {
      app.log.error({ err }, 'server closing with error');
    } else {
      app.log.info(`${signal} received, server closing`);
    }
    await app.close();
  });

  // Start server
  try {
    await app.listen({ host: envConfig.server.host, port: envConfig.server.port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
