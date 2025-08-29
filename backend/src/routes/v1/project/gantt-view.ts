import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { and, asc, desc, eq, like, or, type SQL, sql, type SQLWrapper } from "drizzle-orm";
import { db } from "../../../db/index.ts";
import { projects, projectEvents, projectsCost } from "../../../db/schema/projects.ts";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { EnumProjectStatus, EnumProjectType, EnumUserRole, EnumProjectEventType, EnumTransactionType } from "../../../db/schema/index.ts";

const ganttViewRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/gantt-view',
    method: 'GET',
    schema: {
      tags: ['Projects'],
      summary: 'Get projects data for Gantt view',
      description: 'Get projects with cost events grouped by month for Gantt chart visualization',
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
        details: Type.Optional(Type.Boolean({ default: true, description: 'Include detailed events list for each month' })),
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
            type: Type.String({ enum: Object.values(EnumProjectType) }),
            extra: Type.Record(Type.String(), Type.Any()),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' }),
            monthlyData: Type.Array(Type.Object({
              yearMonth: Type.String(),
              cost: Type.Record(Type.String(), Type.Object({
                income: Type.Object({
                  budget: Type.String(),
                  actual: Type.String()
                }),
                expense: Type.Object({
                  budget: Type.String(),
                  actual: Type.String()
                })
              })),
              events: Type.Optional(Type.Array(Type.Object({
                id: Type.String({ format: 'uuid' }),
                name: Type.String(),
                description: Type.Union([Type.String(), Type.Null()]),
                eventType: Type.String({ enum: Object.values(EnumProjectEventType) }),
                cost: Type.Object({
                  transactionType: Type.String({ enum: Object.values(EnumTransactionType) }),
                  budgetCurrency: Type.Union([Type.String(), Type.Null()]),
                  budget: Type.Union([Type.String(), Type.Null()]),
                  actualCurrency: Type.Union([Type.String(), Type.Null()]),
                  actual: Type.Union([Type.String(), Type.Null()]),
                  hasActual: Type.Boolean(),
                  actualCreatedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
                }),
                path: Type.String()
              })))
            }))
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
        details = true,
      } = req.query as {
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
        search?: string;
        status?: string;
        type?: string;
        details?: boolean;
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

      // Get projects with basic info
      const projectsQuery = db
        .select({
          id: projects.id,
          userId: projects.userId,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          type: projects.type,
          extra: projects.extra,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt
        })
        .from(projects)
        .$dynamic();

      // Apply where conditions if any
      if (conditions.length > 0) {
        projectsQuery.where(and(...conditions));
        countQuery.where(and(...conditions));
      }

      // Apply sorting and pagination
      projectsQuery
        .orderBy(orderBy(sortColumn))
        .limit(limit)
        .offset(offset);

      // Execute queries in parallel
      const [projectsData, totalResult] = await Promise.all([
        projectsQuery,
        countQuery
      ]);

      const total = Number(totalResult[0]?.count || 0);
      const totalPages = Math.ceil(total / limit);

      // For each project, get the monthly cost event data
      const projectsWithMonthlyData = await Promise.all(
        projectsData.map(async (project) => {
          // Get all file-type events with costs for this project
          const costEventsQuery = db
            .select({
              eventId: projectEvents.id,
              eventName: projectEvents.name,
              eventDescription: projectEvents.description,
              eventType: projectEvents.eventType,
              eventPath: sql<string>`${projectEvents.path}::text`,
              transactionType: projectsCost.transactionType,
              budgetCurrency: projectsCost.budgetCurrency,
              budget: projectsCost.budget,
              actualCurrency: projectsCost.actualCurrency,
              actual: projectsCost.actual,
              hasActual: projectsCost.hasActual,
              actualCreatedAt: projectsCost.actualCreatedAt
            })
            .from(projectEvents)
            .innerJoin(
              projectsCost,
              eq(projectsCost.projectEventId, projectEvents.id)
            )
            .where(
              and(
                eq(projectEvents.projectId, project.id),
                eq(projectEvents.eventType, EnumProjectEventType.file),
                or(
                  eq(projectsCost.transactionType, EnumTransactionType.income),
                  eq(projectsCost.transactionType, EnumTransactionType.expense)
                )
              )
            );

          const costEvents = await costEventsQuery;

          // Group events by year-month based on actualCreatedAt and aggregate costs by currency
          const monthlyGroups = new Map<string, {
            costByCurrency: Map<string, {
              income: { budget: number; actual: number };
              expense: { budget: number; actual: number };
            }>;
            events: any[];
          }>();

          costEvents.forEach(event => {
            if (event.actualCreatedAt && event.hasActual) {
              const date = new Date(event.actualCreatedAt);
              const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              
              if (!monthlyGroups.has(yearMonth)) {
                monthlyGroups.set(yearMonth, {
                  costByCurrency: new Map(),
                  events: []
                });
              }
              
              const monthData = monthlyGroups.get(yearMonth)!;
              
              // Add event to events list if details are requested
              if (details) {
                monthData.events.push({
                  id: event.eventId,
                  name: event.eventName,
                  description: event.eventDescription,
                  eventType: event.eventType,
                  cost: {
                    transactionType: event.transactionType,
                    budgetCurrency: event.budgetCurrency,
                    budget: event.budget,
                    actualCurrency: event.actualCurrency,
                    actual: event.actual,
                    hasActual: event.hasActual,
                    actualCreatedAt: event.actualCreatedAt,
                  },
                  path: event.eventPath
                });
              }
              const budgetCurrency = event.budgetCurrency || 'IDR';
              const actualCurrency = event.actualCurrency || budgetCurrency;
              
              // Initialize currency data if not exists
              if (!monthData.costByCurrency.has(budgetCurrency)) {
                monthData.costByCurrency.set(budgetCurrency, {
                  income: { budget: 0, actual: 0 },
                  expense: { budget: 0, actual: 0 }
                });
              }
              
              const currencyData = monthData.costByCurrency.get(budgetCurrency)!;
              const budgetAmount = parseFloat(event.budget || '0');
              
              // Only compute actual amounts when hasActual is true
              const actualAmount = event.hasActual ? parseFloat(event.actual || '0') : 0;
              
              // Aggregate by transaction type
              if (event.transactionType === EnumTransactionType.income) {
                currencyData.income.budget += budgetAmount;
                if (event.hasActual) {
                  currencyData.income.actual += actualAmount;
                }
              } else if (event.transactionType === EnumTransactionType.expense) {
                currencyData.expense.budget += budgetAmount;
                if (event.hasActual) {
                  currencyData.expense.actual += actualAmount;
                }
              }
              
              // Handle different actual currency if different from budget currency
              if (actualCurrency !== budgetCurrency && event.hasActual) {
                if (!monthData.costByCurrency.has(actualCurrency)) {
                  monthData.costByCurrency.set(actualCurrency, {
                    income: { budget: 0, actual: 0 },
                    expense: { budget: 0, actual: 0 }
                  });
                }
                
                const actualCurrencyData = monthData.costByCurrency.get(actualCurrency)!;
                if (event.transactionType === EnumTransactionType.income) {
                  actualCurrencyData.income.actual += actualAmount;
                } else if (event.transactionType === EnumTransactionType.expense) {
                  actualCurrencyData.expense.actual += actualAmount;
                }
              }
            }
          });

          // Convert to array format sorted by year-month
          const monthlyData = Array.from(monthlyGroups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([yearMonth, data]) => {
              const cost: Record<string, any> = {};
              
              // Convert currency data to the expected format
              data.costByCurrency.forEach((currencyData, currency) => {
                cost[currency] = {
                  income: {
                    budget: currencyData.income.budget.toFixed(2),
                    actual: currencyData.income.actual.toFixed(2)
                  },
                  expense: {
                    budget: currencyData.expense.budget.toFixed(2),
                    actual: currencyData.expense.actual.toFixed(2)
                  }
                };
              });
              
              const monthlyEntry: any = {
                yearMonth,
                cost
              };
              
              // Include events list if details are requested
              if (details) {
                monthlyEntry.events = data.events.map(event => ({
                  ...event,
                  actualCreatedAt: event.actualCreatedAt?.toISOString() ?? null
                }));
              }
              
              return monthlyEntry;
            });

          return {
            ...project,
            monthlyData
          };
        })
      );

      return reply.status(200).send({
        success: true,
        data: projectsWithMonthlyData,
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

export default ganttViewRoutes;