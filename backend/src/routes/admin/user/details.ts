import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from "../../../db/index.ts";
import {getUserAvatarUrl} from "../../../utils/app-utils.ts";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id',
    method: 'GET',
    schema: {
      tags: ['Admin/User'],
      summary: '',
      description: 'Get user details',
      params: Type.Object({
        id: Type.String({ 
          format: "uuid",
          description: "ID of the user to get details for"
        })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            email: Type.String({ format: 'email' }),
            name: Type.String(),
            role: Type.String(),
            image: Type.Union([Type.String(), Type.Null()]),
            emailVerified: Type.Boolean(),
            banned: Type.Boolean(),
            banReason: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        401: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        403: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        404: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        409: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        422: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          error: Type.Optional(Type.String())
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      const { id } = req.params as { id: string };

      // Find the user by ID
      const user = await db.query.users.findFirst({
        where: (userTable, { eq }) => eq(userTable.id, id),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          image: true,
          emailVerified: true,
          banned: true,
          banReason: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: "User not found"
        });
      }

      return {
        success: true,
        data: {
          ...user,
          image: getUserAvatarUrl(user.image),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      };
    }, 422)
  });
}
export default protectedRoute
