import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import {Type} from "@sinclair/typebox";
import {withErrorHandler} from "../../../utils/withErrorHandler.ts";
import {db} from "../../../db/index.ts";
import {users} from "../../../db/schema/auth.ts";
import {eq} from "drizzle-orm";
import {getAuthInstance} from '../../../decorators/auth.decorator.ts';
import {fromNodeHeaders} from 'better-auth/node';

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: "/:id/ban",
    method: "PUT",
    schema: {
      tags: ["Admin/User"],
      summary: "",
      description: "Ban or unban a user with an optional reason",
      params: Type.Object({
        id: Type.String({
          format: "uuid",
          description: "ID of the user to update ban status"
        })
      }),
      body: Type.Object({
        banned: Type.Boolean({
          default: true,
          description: "Whether to ban (true) or unban (false) the user"
        }),
        reason: Type.Optional(Type.String({
          default: "",
          description: "Reason for banning the user (required when banning, ignored when unbanning)",
          minLength: 1
        }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: Type.Object({
            userId: Type.String({format: "uuid"}),
            banned: Type.Boolean(),
            banReason: Type.String()
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
        422: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
        const {id} = req.params as { id: string };
        const {banned = true, reason = ""} = req.body as { banned?: boolean; reason?: string };

        // Get current user from session
        const auth = getAuthInstance(app);
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        const currentUserId = session?.user?.id;

        // Prevent user from banning themselves
        // Prevent self-ban
        if (id === currentUserId) {
          return reply.status(400).send({
            success: false,
            message: "You cannot ban yourself"
          });
        }

        // Validate reason is provided when banning
        if (banned && (!reason || reason.trim() === '')) {
          return reply.status(400).send({
            success: false,
            message: "Reason is required when banning a user"
          });
        }

        // Check if user exists
        const user = await db.query.users.findFirst({
          where: (userTable, {eq}) => eq(userTable.id, id)
        });

        if (!user) {
          return reply.status(404).send({
            success: false,
            message: "User not found"
          });
        }

        // Update user ban status
        await db.update(users)
          .set({
            banned,
            banReason: banned ? reason : "",
            updatedAt: new Date()
          })
          .where(eq(users.id, id));

        return {
          success: true,
          message: `User has been ${banned ? 'banned' : 'unbanned'} successfully`,
          data: {
            userId: id,
            banned,
            banReason: banned ? (reason || "") : ""
          }
        };
      }, 422),
    });
};
export default protectedRoute
