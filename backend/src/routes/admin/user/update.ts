import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from "../../../db/index.ts";
import { users, EnumUserRole } from "../../../db/schema/index.ts";
import { eq } from "drizzle-orm";
import { getAuthInstance } from '../../../decorators/auth.decorator.ts';
import { fromNodeHeaders } from 'better-auth/node';
import {getUserAvatarUrl} from "../../../utils/app-utils.ts";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id',
    method: 'PUT',
    schema: {
      tags: ['Admin/User'],
      summary: '',
      description: 'Update user details including name, email, and role',
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        role: Type.Optional(Type.String()),
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
      const updateData = req.body as {
        name?: string;
        role?: string;
      };

      // Check if user exists
      const user = await db.query.users.findFirst({
        where: (userTable, { eq }) => eq(userTable.id, id)
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: 'User not found'
        });
      }

      // Get current user ID from session
      const auth = getAuthInstance(app);
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      const currentUserId = session?.user?.id;

      // If user is updating their own account, remove role from update data
      if (currentUserId === id && 'role' in updateData) {
        // Create a new object without the role property
        const { role, ...rest } = updateData;
        // Clear the updateData object and assign the rest properties
        Object.keys(updateData).forEach(key => delete updateData[key as keyof typeof updateData]);
        Object.assign(updateData, rest);
      }

      // Validate role if provided
      if (updateData.role && !Object.values(EnumUserRole).includes(updateData.role as keyof typeof EnumUserRole)) {
        return reply.status(400).send({
          success: false,
          message: `Invalid role. Must be one of: ${Object.values(EnumUserRole).join(', ')}`,
        });
      }

      // If no updates are provided, return early
      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'No update data provided',
        });
      }

      // Prepare update data
      const updateFields: Record<string, unknown> = {
        ...updateData,
        updatedAt: new Date()
      };

      // Remove undefined values
      Object.keys(updateFields).forEach(key =>
        updateFields[key] === undefined && delete updateFields[key]
      );

      // Update user
      await db.update(users)
        .set(updateFields)
        .where(eq(users.id, id));

      // Get updated user
      const updatedUser = await db.query.users.findFirst({
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

      return {
        success: true,
        message: 'User updated successfully',
        data: {
          ...updatedUser,
          image: getUserAvatarUrl(updatedUser?.image)
        }
      };
    }, 422),
  });
}

export default protectedRoute
