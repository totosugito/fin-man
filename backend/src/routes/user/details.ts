import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from '@sinclair/typebox';
import { withErrorHandler } from "../../utils/withErrorHandler.ts";
import { db } from "../../db/index.ts";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema/index.ts";
import {getUserAvatarUrl} from "../../utils/app-utils.ts";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/details',
    method: 'GET',
    schema: {
      tags: ['User'],
      summary: 'Get current user details',
      description: 'Get the authenticated user\'s profile information',
      response: {
        200: Type.Object({
          success: Type.Literal(true),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            email: Type.String({ format: 'email' }),
            name: Type.Union([Type.String(), Type.Null()]),
            image: Type.Union([Type.String({ format: 'uri' }), Type.Null()]),
            emailVerified: Type.Boolean(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })
        }),
        401: Type.Object({
          success: Type.Literal(false),
          message: Type.String()
        }),
        404: Type.Object({
          success: Type.Literal(false),
          message: Type.String()
        }),
        500: Type.Object({
          success: Type.Literal(false),
          message: Type.String()
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      // Get user ID from session (already verified by user.hook.ts)
      const userId = req.session.user.id;

      // Find the current user by ID
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // This should theoretically never happen since the user was just authenticated
      // but, we'll keep it as a safety check
      if (!user) {
        return reply.status(404).send({
          success: false as const,
          message: 'User not found'
        });
      }

      return {
        success: true as const,
        data: {
          ...user,
          image: getUserAvatarUrl(user.image),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          emailVerified: Boolean(user.emailVerified)
        }
      };
    }, 422)
  });
};

export default protectedRoute;
