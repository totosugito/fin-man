import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import {withErrorHandler} from "../../utils/withErrorHandler.ts";
import {getAuthInstance} from '../../decorators/auth.decorator.ts';
import {db} from "../../db/index.ts";
import {Type} from '@sinclair/typebox';
import {accounts} from "../../db/schema/index.ts";
import {eq} from "drizzle-orm";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/change-password',
    method: 'PUT',
    schema: {
      tags: ['User'],
      summary: '',
      description: 'Change the current user password',
      body: Type.Object({
        currentPassword: Type.String({
          description: 'Current password',
        }),
        newPassword: Type.String({
          description: 'New password',
        }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
    handler: withErrorHandler(async (req, reply) => {
      const auth = getAuthInstance(app);
      const {currentPassword, newPassword} = req.body as {
        currentPassword: string,
        newPassword: string
      };

      // Validate input
      if (!currentPassword || !newPassword) {
        return reply.status(400).send({
          success: false,
          message: 'Both currentPassword and newPassword are required',
        });
      }

      if (currentPassword === newPassword) {
        return reply.status(400).send({
          success: false,
          message: 'New password must be different from current password',
        });
      }

      // Get user ID from session (already verified by user.hook.ts)
      const userId = req.session.user.id;

      // Get user's current password hash
      const [userAccount] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);

      if (!userAccount) {
        return reply.status(404).send({
          success: false,
          message: 'User account not found',
        });
      }

      const context = await auth.$context;

      if (!userAccount.password) {
        return reply.status(400).send({
          success: false,
          message: 'User account has no password set'
        });
      }

      // Verify current password
      const isPasswordValid = await context.password.verify({
          password: currentPassword,
          hash: userAccount.password
        },
      );

      if (!isPasswordValid) {
        return reply.status(401).send({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await context.password.hash(newPassword);

      // Update password in database
      await db
        .update(accounts)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(accounts.userId, userId));

      return reply.status(200).send({
        success: true,
        message: 'Password updated successfully',
      });
    }),
  });
};

export default protectedRoute;
