import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import {and, asc, desc, eq, like, or, type SQL, sql, type SQLWrapper} from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { users } from "../../../db/schema/auth.ts";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import {getUserAvatarUrl} from "../../../utils/app-utils.ts";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/list',
    method: 'GET',
    schema: {
      tags: ['Admin/User'],
      summary: '',
      description: 'Get list of users with pagination and sorting',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
        sort: Type.Optional(Type.String({
          enum: ['email', 'name', 'role'],
          default: 'email'
        })),
        order: Type.Optional(Type.String({
          enum: ['asc', 'desc'],
          default: 'asc'
        })),
        search: Type.Optional(Type.String()),
        role: Type.Optional(Type.String({ enum: ['admin', 'teacher', 'user'] })),
        showBanned: Type.Optional(Type.Boolean({ default: false }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            email: Type.String({ format: 'email' }),
            name: Type.String(),
            role: Type.String(),
            image: Type.Union([Type.String(), Type.Null()]),
            emailVerified: Type.Boolean(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })),
          meta: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number(),
            totalPages: Type.Number()
          })
        }),
        400: Type.Object({
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
        })
    }
  },
  handler: withErrorHandler(async (req, reply) => {
      const {
        page = 1,
        limit = 10,
        sort = 'email',
        order = 'asc',
        search,
        role,
        showBanned = false
      } = req.query as {
        page?: number;
        limit?: number;
        sort?: 'email' | 'name' | 'role';
        order?: 'asc' | 'desc';
        search?: string;
        role?: string;
        showBanned?: boolean;
      };

      // Create sort expression
      const orderBy = order === 'asc' ? asc : desc;
      let sortColumn: SQL.Aliased | SQLWrapper;

      switch (sort) {
        case 'name':
          sortColumn = users.name;
          break;
        case 'role':
          sortColumn = users.role;
          break;
        default:
          sortColumn = users.email;
      }

      // Build where conditions
      const conditions = [];

      if (search && search.trim() !== '') {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(users.email, searchTerm),
            like(users.name, searchTerm)
          )
        );
      }

      if (role) {
        conditions.push(eq(users.role, role));
      }

      // Only show non-banned users by default
      if (!showBanned) {
        conditions.push(eq(users.banned, false));
      }

      const offset = (page - 1) * limit;

      // Get total count for pagination
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .$dynamic();

      // Get paginated results
      const query = db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          image: users.image,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt ,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .$dynamic();

      // Apply where conditions if any
      if (conditions.length > 0) {
        query.where(and(...conditions));
        countQuery.where(and(...conditions));
      }

      // Apply sorting and pagination
      query
        .orderBy(orderBy(sortColumn))
        .limit(limit)
        .offset(offset);

      // Execute queries in parallel
      const [usersData, totalResult] = await Promise.all([
        query,
        countQuery
      ]);

      const total = Number(totalResult[0]?.count || 0);
      const totalPages = Math.ceil(total / limit);

      return reply.status(200).send({
        success: true,
        data: usersData.map(user => ({
          ...user,
          image: user.image ? getUserAvatarUrl(user.image) : null
        })),
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      });
    }, 422),
  });
}
export default protectedRoute
