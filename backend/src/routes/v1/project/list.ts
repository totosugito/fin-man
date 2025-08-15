import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { and, asc, desc, eq, like, or, type SQL, sql, type SQLWrapper } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { projects, projectEvents, projectsCost } from "../../../db/schema/projects.ts";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { EnumProjectStatus, EnumProjectType, EnumUserRole } from "../../../db/schema/index.ts";

const projectRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/list',
    method: 'GET',
    schema: {
      tags: ['Projects'],
      summary: 'Get list of projects',
      description: 'Get list of projects with pagination and sorting',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
        sort: Type.Optional(Type.String({
          enum: ['name', 'status', 'createdAt', 'updatedAt'],
          default: 'updatedAt'
        })),
        order: Type.Optional(Type.String({
          enum: ['asc', 'desc'],
          default: 'desc'
        })),
        search: Type.Optional(Type.String()),
        status: Type.Optional(Type.String({ enum: Object.values(EnumProjectStatus) })),
        type: Type.Optional(Type.String({ enum: Object.values(EnumProjectType) })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            userId: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.Union([Type.String(), Type.Null()]),
            status: Type.String({ enum: Object.values(EnumProjectStatus) }),
            cost: Type.Union([Type.Record(Type.String(), Type.Any()), Type.Null()]),
            extra: Type.Record(Type.String(), Type.Any()),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })),
          meta: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number(),
            totalPages: Type.Number()
          })
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search,
        status,
        type,
      } = req.query as {
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
        search?: string;
        status?: string;
        type?: string;
      };

      // Create sort expression
      const orderBy = order === 'asc' ? asc : desc;
      let sortColumn: SQL.Aliased | SQLWrapper;
      switch (sort) {
        case 'name':
          sortColumn = projects.name;
          break;
        case 'status':
          sortColumn = projects.status;
          break;
        case 'createdAt':
          sortColumn = projects.createdAt;
          break;
        case 'updatedAt':
          sortColumn = projects.updatedAt;
          break;
        default:
          sortColumn = projects.name;
      }

      // Build where conditions
      const conditions = [];

      if (search && search.trim() !== '') {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(projects.name, searchTerm),
            like(projects.description, searchTerm)
          )
        );
      }

      // Add status filter
      if (status) {
        conditions.push(eq(projects.status, status as any));
      }
      if (type) {
        conditions.push(eq(projects.type, type as any));
      }

      // Add user filter (if not admin, only show user's projects)
      const userRole = req.session?.user?.role;
      const userId = req.session?.user?.id;
      if (userRole !== EnumUserRole.admin) {
        conditions.push(eq(projects.userId, userId));
      }

      const offset = (page - 1) * limit;

      // Get total count for pagination
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .$dynamic();

      // Get paginated results
      const query = db
        .select({
          id: projects.id,
          userId: projects.userId,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          type: projects.type,
          extra: projects.extra,
          cost: projectsCost.eventSummary,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt
        })
        .from(projects)
        .leftJoin(
          projectEvents,
          and(
            eq(projectEvents.projectId, projects.id),
            sql`${projectEvents.parentId} IS NULL` // Ensure root event only
          )
        )
        .leftJoin(
          projectsCost,
          eq(projectsCost.projectEventId, projectEvents.id)
        )
        .groupBy(projects.id, projectsCost.eventSummary)
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
      const [projectsData, totalResult] = await Promise.all([
        query,
        countQuery
      ]);

      const total = Number(totalResult[0]?.count || 0);
      const totalPages = Math.ceil(total / limit);

      return reply.status(200).send({
        success: true,
        data: projectsData,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      });
    })
  });
};

export default projectRoutes;
