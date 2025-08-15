import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { and, asc, desc, eq, like, or, type SQL, sql, type SQLWrapper } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import {projectEvents} from "../../../db/schema/projects.ts";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { EnumProjectEventType } from "../../../db/schema/index.ts";

const projectEventRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/list',
    method: 'GET',
    schema: {
      tags: ['Project Events'],
      summary: '',
      description: 'Get list of project events with pagination, sorting, and filtering',
      querystring: Type.Object({
        projectId: Type.String({ format: 'uuid' }),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
        sort: Type.Optional(Type.String({
          enum: ['name', 'evenType', 'createdAt', 'updatedAt'],
          default: 'createdAt'
        })),
        order: Type.Optional(Type.String({
          enum: ['asc', 'desc'],
          default: 'desc'
        })),
        search: Type.Optional(Type.String()),
        evenType: Type.Optional(Type.String({ enum: Object.values(EnumProjectEventType) })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            projectId: Type.String({ format: 'uuid' }),
            userId: Type.String({ format: 'uuid' }),
            parentId: Type.Optional(Type.String({ format: 'uuid' })),
            name: Type.String(),
            description: Type.Union([Type.String(), Type.Null()]),
            evenType: Type.String({ enum: Object.values(EnumProjectEventType) }),
            extra: Type.Record(Type.String(), Type.Any()),
            sortOrder: Type.Number(),
            path: Type.String(),
            depth: Type.Number(),
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
        projectId,
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search,
        eventType: type,
      } = req.query as {
        projectId: string;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
        search?: string;
        eventType?: string;
      };

      // Create sort expression
      const orderBy = order === 'asc' ? asc : desc;
      let sortColumn: SQL.Aliased | SQLWrapper;
      switch (sort) {
        case 'name':
          sortColumn = projectEvents.name;
          break;
        case 'eventType':
          sortColumn = projectEvents.eventType;
          break;
        case 'createdAt':
          sortColumn = projectEvents.createdAt;
          break;
        case 'updatedAt':
          sortColumn = projectEvents.updatedAt;
          break;
        default:
          sortColumn = projectEvents.createdAt;
      }

      // Build where conditions
      const conditions = [];
      conditions.push(eq(projectEvents.projectId, projectId));

      if (search && search.trim() !== '') {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(projectEvents.name, searchTerm),
            like(projectEvents.description, searchTerm)
          )
        );
      }

      if (type) {
        conditions.push(eq(projectEvents.eventType, type as any));
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projectEvents)
        .where(and(...conditions));

      const total = totalResult?.count || 0;
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const events = await db
        .select()
        .from(projectEvents)
        .where(and(...conditions))
        .orderBy(orderBy(sortColumn))
        .limit(limit)
        .offset((page - 1) * limit);

      return {
        success: true,
        data: events.map(event => ({
          ...event,
          createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: event.updatedAt?.toISOString() ?? new Date().toISOString(),
          sortOrder: event.sortOrder ?? 0,
          evenType: event.eventType,
          path: event.path ?? '',
          depth: event.depth ?? 0,
          parentId: event.parentId ?? undefined,
          extra: event.extra ?? {}
        })),
        meta: {
          total,
          page,
          limit,
          totalPages
        }
      };
    })
  });
};

export default projectEventRoutes;
