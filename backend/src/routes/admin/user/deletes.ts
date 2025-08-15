import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { Type } from '@sinclair/typebox';
import { getAuthInstance } from '../../../decorators/auth.decorator.ts';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../../db/index.ts';
import { users, accounts, sessions } from '../../../db/schema/index.ts';
import { inArray } from 'drizzle-orm';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import env from '../../../config/env.config.ts';

const uploadDir = join(process.cwd(), env.server.uploadsUserDir);

async function deleteUserDirectory(userId: string): Promise<void> {
  const userDir = join(uploadDir, userId);
  if (existsSync(userDir)) {
    await rm(userDir, { recursive: true, force: true });
  }
}

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/deletes',
    method: 'DELETE',
    schema: {
      tags: ['Admin/User'],
      summary: '',
      description: 'Delete users by their IDs. Users cannot delete themselves.',
      body: Type.Object({
        ids: Type.Array(Type.String({ format: 'uuid' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          deletedCount: Type.Number(),
          deletedIds: Type.Array(Type.String({ format: 'uuid' })),
          missingIds: Type.Optional(Type.Array(Type.String({ format: 'uuid' })))
        }),
        207: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          deletedCount: Type.Number(),
          deletedIds: Type.Array(Type.String({ format: 'uuid' })),
          failedToDeleteIds: Type.Array(Type.String({ format: 'uuid' })),
          missingIds: Type.Optional(Type.Array(Type.String({ format: 'uuid' })))
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        401: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        404: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          missingIds: Type.Array(Type.String({ format: 'uuid' }))
        }),
        500: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          error: Type.Optional(Type.String())
        })
      }
    },
    handler: withErrorHandler(async (req: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) => {
      const auth = getAuthInstance(app);
      const ids = req.body.ids;

      const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
          });
      const currentUserId = session?.user?.id;
      if (!currentUserId) {
        return reply.status(401).send({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Prevent self-deletion
      if (ids.includes(currentUserId)) {
        return reply.status(400).send({
          success: false,
          message: 'You cannot delete your own account',
        });
      }

      // Check which users exist in the database
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, ids));

      // Create a set of existing user IDs for faster lookups
      const existingUserIdsSet = new Set(existingUsers.map(user => user.id));

      // Map through all requested IDs and check if they exist
      const userChecks = ids.map(userId => ({
        userId,
        exists: existingUserIdsSet.has(userId)
      }));

      // Add type annotations to fix TypeScript errors
      interface UserCheck {
        userId: string;
        exists: boolean;
      }

      const existingUserIds = userChecks
        .filter((check: UserCheck) => check.exists)
        .map((check: UserCheck) => check.userId);

      const nonExistingUserIds = userChecks
        .filter((check: UserCheck) => !check.exists)
        .map((check: UserCheck) => check.userId);

      if (existingUserIds.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'No valid users found to delete',
          missingIds: nonExistingUserIds
        });
      }

      // Delete from users_sessions first due to foreign key constraints
      await db.delete(sessions)
        .where(inArray(sessions.userId, existingUserIds));

      // Delete from users_accounts
      await db.delete(accounts)
        .where(inArray(accounts.userId, existingUserIds));

      // Finally, delete from users table
      const result = await db.delete(users)
        .where(inArray(users.id, existingUserIds))
        .returning({ deletedId: users.id });

      const deletedUserIds = result.map((r: { deletedId: string }) => r.deletedId);
      const failedToDeleteIds = existingUserIds.filter((id: string) => !deletedUserIds.includes(id));

      // Delete user directories for successfully deleted users
      await Promise.allSettled(
        deletedUserIds.map(userId => deleteUserDirectory(userId))
      );

      if (failedToDeleteIds.length > 0) {
        return reply.status(207).send({
          success: true,
          message: 'Some users were not deleted',
          deletedCount: deletedUserIds.length,
          failedToDeleteIds,
          nonExistingUserIds
        });
      }

      return reply.status(200).send({
        success: true,
        message: deletedUserIds.length > 1
          ? 'Users deleted successfully'
          : 'User deleted successfully',
        deletedCount: deletedUserIds.length,
        deletedIds: deletedUserIds,
        ...(nonExistingUserIds.length > 0 && {
          missingIds: nonExistingUserIds
        })
      });
    }, 422),
  });
};
export default protectedRoute;
