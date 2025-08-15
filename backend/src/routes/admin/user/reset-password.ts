import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { getAuthInstance } from "../../../decorators/auth.decorator.ts";
import { db } from "../../../db/index.ts";
import { accounts } from "../../../db/schema/auth.ts";
import { eq } from "drizzle-orm";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: "/:id/reset-password",
    method: "PATCH",
    schema: {
      tags: ["Admin/User"],
      summary: "",
      description: "Reset password for a specific user by admin",
      params: Type.Object({
        id: Type.String({ format: "uuid" })
      }),
      body: Type.Object({
        newPassword: Type.String({ minLength: 6 })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
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
      const { newPassword } = req.body as { newPassword: string };

      // Check if user exists
      const user = await db.query.users.findFirst({
        where: (userTable, { eq }) => eq(userTable.id, id)
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: "User not found"
        });
      }

      // Get auth instance for password hashing
      const auth = getAuthInstance(app);
      const context = await auth.$context;
      const hashedPassword = await context.password.hash(newPassword);

      // Update password in accounts table
      await db.update(accounts)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(accounts.userId, id));

      return {
        success: true,
        message: "Password has been reset successfully"
      };
    }, 422)
  });
}
export default protectedRoute
