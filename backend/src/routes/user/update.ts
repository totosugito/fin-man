import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from '@sinclair/typebox';
import { withErrorHandler } from "../../utils/withErrorHandler.ts";
import { db } from "../../db/index.ts";
import { users } from "../../db/schema/auth.ts";
import { eq } from "drizzle-orm";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/update',
    method: 'PUT',
    schema: {
      tags: ['User'],
      summary: '',
      description: 'Update the current user\'s profile information',
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Literal(true),
          message: Type.String(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            email: Type.String({ format: 'email' }),
            name: Type.Union([Type.String(), Type.Null()]),
            emailVerified: Type.Boolean(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })
        }),
        400: Type.Object({
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
      },
    },
    handler: withErrorHandler(async (req, reply) => {
      // Get user ID from session (verified by user.hook.ts)
      const userId = req.session.user.id;
      const updateData = req.body as {
        name?: string;
      };

      // Remove any restricted fields that might have been sent
      const restrictedFields = ['id', 'email', 'password', 'role', 'banned', 'banReason', 'image'];
      const safeUpdateData = Object.entries(updateData)
        .filter(([key]) => !restrictedFields.includes(key))
        .reduce((obj, [key, value]) => {
          obj[key] = value;  // Direct assignment instead of spread
          return obj;
        }, {} as Record<string, unknown>);

      // If no valid updates are provided, return early
      if (Object.keys(safeUpdateData).length === 0) {
        return reply.status(400).send({
          success: false as const,
          message: 'No valid update data provided',
        });
      }

      // Update the user
      await db.update(users)
        .set({
          ...safeUpdateData,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Get the updated user
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!updatedUser) {
        return reply.status(404).send({
          success: false as const,
          message: 'User not found',
        });
      }

      return {
        success: true as const,
        message: 'User updated successfully',
        data: {
          ...updatedUser,
          // Ensure dates are properly serialized
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString(),
          emailVerified: Boolean(updatedUser.emailVerified)
        }
      };
    })
  });
};

export default protectedRoute;
