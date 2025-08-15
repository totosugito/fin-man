import Swagger from '@fastify/swagger';
import ScalarApiReference from '@scalar/fastify-api-reference';
import type {FastifyInstance} from 'fastify';
import fp from 'fastify-plugin';
import packageJson from '../../../package.json' with {type: 'json'};

async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(Swagger, {
    openapi: {
      openapi: '3.1.1',
      info: {
        title: 'SI CERDAS - OpenAPI 3.1',
        description: 'API Documentation for SI CERDAS',
        version: packageJson.version,
      },
    },
  });

  // Hook to modify route options
  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions.url.startsWith('/api/auth')) {
      // biome-ignore lint/complexity/useOptionalChain: <explanation>
      if (routeOptions.schema && routeOptions.schema.tags) {
        routeOptions.schema.tags = ['Auth'];
      } else {
        routeOptions.schema = {...routeOptions.schema, tags: ['Auth']};
      }
    }
  });

  await fastify.register(ScalarApiReference, {
    routePrefix: '/api/docs',
  });

  fastify.log.info('API Reference is available at /api/docs');
}

export default fp(swaggerPlugin, {
  name: 'swagger-plugin',
});
