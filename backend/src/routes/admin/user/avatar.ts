import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { withErrorHandler } from '../../../utils/withErrorHandler.ts';
import { db } from '../../../db/index.ts';
import { users } from '../../../db/schema/index.ts';
import { eq } from 'drizzle-orm';
import { Type } from '@sinclair/typebox';
import { processChangeAvatar } from '../../user/avatar.ts';

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id/avatar',
    method: 'PATCH',
    schema: {
      tags: ['Admin/User'],
      summary: "",
      description: 'Allows administrators to change the avatar for any user',
      consumes: ['multipart/form-data'],
      params: Type.Object({
        id: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            name: Type.String(),
            image: Type.Union([Type.String(), Type.Null()]),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
        401: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
        404: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
        500: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
    handler: withErrorHandler(async (req, reply) => {
      const { id } = req.params as { id: string };

      // Verify the target user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: { id: true },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: 'User not found',
        });
      }

      // Get the uploaded file from the request
      const data = await req.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Convert to UploadedFile type
      const file = {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype,
      };

      // Use the shared processChangeAvatar function
      return processChangeAvatar(reply, id, file);
    }),
  });
};

export default protectedRoute;
