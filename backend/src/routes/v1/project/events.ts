import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { and, asc, desc, eq, like, or, type SQL, sql, type SQLWrapper, gte, lt } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { projects, projectEvents, projectsCost } from "../../../db/schema/projects.ts";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { EnumProjectEventType, EnumTransactionType, EnumUserRole } from "../../../db/schema/index.ts";

const projectEventsRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id/events',
    method: 'GET',
    schema: {
      tags: ['Projects'],
      summary: 'Get project events by year-month',
      description: 'Get list of project events with cost data filtered by year-month based on actualCreatedAt for a specific project',
      params: Type.Object({
        id: Type.String({ format: 'uuid', description: 'Project ID' })
      }),
      querystring: Type.Object({
        yearMonth: Type.String({ 
          pattern: '^\\d{4}-\\d{2}$',
          description: 'Year-month in format YYYY-MM (e.g., 2025-01)'
        }),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
        sort: Type.Optional(Type.String({
          enum: ['name', 'eventType', 'actualCreatedAt', 'createdAt', 'updatedAt'],
          default: 'actualCreatedAt'
        })),
        order: Type.Optional(Type.String({
          enum: ['asc', 'desc'],
          default: 'desc'
        })),
        search: Type.Optional(Type.String()),
        eventType: Type.Optional(Type.String({ enum: Object.values(EnumProjectEventType) })),
        transactionType: Type.Optional(Type.String({ enum: Object.values(EnumTransactionType) })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            projectId: Type.String({ format: 'uuid' }),
            userId: Type.String({ format: 'uuid' }),
            parentId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
            name: Type.String(),
            description: Type.Union([Type.String(), Type.Null()]),
            eventType: Type.String({ enum: Object.values(EnumProjectEventType) }),
            extra: Type.Record(Type.String(), Type.Any()),
            sortOrder: Type.Number(),
            path: Type.String(),
            depth: Type.Number(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' }),
            // Cost information
            transactionType: Type.Union([Type.String({ enum: Object.values(EnumTransactionType) }), Type.Null()]),
            budgetCurrency: Type.Union([Type.String(), Type.Null()]),
            budget: Type.Union([Type.String(), Type.Null()]),
            actualCurrency: Type.Union([Type.String(), Type.Null()]),
            actual: Type.Union([Type.String(), Type.Null()]),
            hasActual: Type.Union([Type.Boolean(), Type.Null()]),
            actualCreatedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
          })),
          meta: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number(),
            totalPages: Type.Number(),
            yearMonth: Type.String(),
            projectId: Type.String({ format: 'uuid' }),
            projectName: Type.String()
          })
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        404: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      const { id: projectId } = req.params as { id: string };
      const {
        yearMonth,
        page = 1,
        limit = 10,
        sort = 'actualCreatedAt',
        order = 'desc',
        search,
        eventType,
        transactionType,
      } = req.query as {
        yearMonth: string;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
        search?: string;
        eventType?: string;
        transactionType?: string;
      };

      // Validate yearMonth format (YYYY-MM)
      const yearMonthRegex = /^(\d{4})-(\d{2})$/;
      const match = yearMonth.match(yearMonthRegex);
      if (!match) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid yearMonth format. Expected format: YYYY-MM (e.g., 2025-01)'
        });
      }

      // Check if project exists and user has access
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: {
          id: true,
          name: true,
          userId: true
        }
      });

      if (!project) {
        return reply.status(404).send({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      // Check user permissions (if not admin, only show user's projects)
      const userRole = req.session?.user?.role;
      const userId = req.session?.user?.id;
      if (userRole !== EnumUserRole.admin && project.userId !== userId) {
        return reply.status(404).send({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      const [, year, month] = match;
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

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
        case 'actualCreatedAt':
          sortColumn = projectsCost.actualCreatedAt;
          break;
        case 'createdAt':
          sortColumn = projectEvents.createdAt;
          break;
        case 'updatedAt':
          sortColumn = projectEvents.updatedAt;
          break;
        default:
          sortColumn = projectsCost.actualCreatedAt;
      }

      // Build where conditions
      const conditions = [];
      
      // Filter by project ID
      conditions.push(eq(projectEvents.projectId, projectId));
      
      // Filter by year-month range on actualCreatedAt
      conditions.push(
        and(
          gte(projectsCost.actualCreatedAt, startDate),
          lt(projectsCost.actualCreatedAt, endDate),
          eq(projectsCost.hasActual, true) // Only include events with actual data
        )
      );

      // Search filter
      if (search && search.trim() !== '') {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(projectEvents.name, searchTerm),
            like(projectEvents.description, searchTerm)
          )
        );
      }

      // Event type filter
      if (eventType) {
        conditions.push(eq(projectEvents.eventType, eventType as any));
      }

      // Transaction type filter
      if (transactionType) {
        conditions.push(eq(projectsCost.transactionType, transactionType as any));
      }

      // Build the query with JOIN
      const baseQuery = db
        .select({
          // Project Event fields
          id: projectEvents.id,
          projectId: projectEvents.projectId,
          userId: projectEvents.userId,
          parentId: projectEvents.parentId,
          name: projectEvents.name,
          description: projectEvents.description,
          eventType: projectEvents.eventType,
          extra: projectEvents.extra,
          sortOrder: projectEvents.sortOrder,
          path: projectEvents.path,
          depth: projectEvents.depth,
          createdAt: projectEvents.createdAt,
          updatedAt: projectEvents.updatedAt,
          // Cost fields
          transactionType: projectsCost.transactionType,
          budgetCurrency: projectsCost.budgetCurrency,
          budget: projectsCost.budget,
          actualCurrency: projectsCost.actualCurrency,
          actual: projectsCost.actual,
          hasActual: projectsCost.hasActual,
          actualCreatedAt: projectsCost.actualCreatedAt,
        })
        .from(projectEvents)
        .innerJoin(
          projectsCost,
          eq(projectsCost.projectEventId, projectEvents.id)
        )
        .where(and(...conditions));

      // Get total count
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projectEvents)
        .innerJoin(
          projectsCost,
          eq(projectsCost.projectEventId, projectEvents.id)
        )
        .where(and(...conditions));

      const total = totalResult?.count || 0;
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const events = await baseQuery
        .orderBy(orderBy(sortColumn))
        .limit(limit)
        .offset((page - 1) * limit);

      return {
        success: true,
        data: events.map(event => ({
          ...event,
          createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: event.updatedAt?.toISOString() ?? new Date().toISOString(),
          actualCreatedAt: event.actualCreatedAt?.toISOString() ?? null,
          sortOrder: event.sortOrder ?? 0,
          path: event.path ?? '',
          depth: event.depth ?? 0,
          parentId: event.parentId ?? null,
          extra: event.extra ?? {},
          transactionType: event.transactionType ?? null,
          budgetCurrency: event.budgetCurrency ?? null,
          budget: event.budget ?? null,
          actualCurrency: event.actualCurrency ?? null,
          actual: event.actual ?? null,
          hasActual: event.hasActual ?? null,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages,
          yearMonth,
          projectId,
          projectName: project.name
        }
      };
    })
  });
};

export default projectEventsRoutes;