import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from "../../../db/index.ts";
import { eq, asc, inArray } from "drizzle-orm";
import {
  projects,
  projectEvents,
  projectsCost,
} from "../../../db/schema/index.ts";

// Schema definitions
const CurrencySummary = Type.Object({
  budgetIncome: Type.String(),
  budgetExpense: Type.String(),
  realIncome: Type.String(),
  realExpense: Type.String(),
});

const EventCost = Type.Object({
  projectEventId: Type.String({ format: 'uuid' }),
  budgetIncomeCurrency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
  budgetIncome: Type.Optional(Type.String()),
  budgetExpenseCurrency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
  budgetExpense: Type.Optional(Type.String()),
  realIncomeCurrency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
  realIncome: Type.Optional(Type.String()),
  realIncomeCreatedAt: Type.Optional(Type.String({ format: 'date-time' })),
  realExpenseCurrency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
  realExpense: Type.Optional(Type.String()),
  realExpenseCreatedAt: Type.Optional(Type.String({ format: 'date-time' })),
});

// First define the recursive type
const ProjectEvent = Type.Recursive((Self) =>
  Type.Object({
    id: Type.String({ format: 'uuid' }),
    parentId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
    name: Type.String(),
    eventType: Type.Union([
      Type.Literal('folder'),
      Type.Literal('file')
    ]),
    sortOrder: Type.Number(),
    path: Type.String(),
    depth: Type.Number(),
    cost: Type.Union([
      Type.Record(Type.String(), CurrencySummary), // For folders
      EventCost,                                   // For files
      Type.Null()
    ]),
    children: Type.Array(Self)
  })
);

const ProjectDetailsResponse = Type.Object({
  success: Type.Boolean(),
  data: Type.Object({
    id: Type.String({ format: 'uuid' }),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    events: Type.Array(ProjectEvent)
  })
});

const ErrorResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.String()
});

export const getProjectDetails = async (id: string) => {
  // 2. Fetch all events for the project
  const events = await db
    .select({
      id: projectEvents.id,
      parentId: projectEvents.parentId,
      name: projectEvents.name,
      eventType: projectEvents.eventType,
      sortOrder: projectEvents.sortOrder,
      path: projectEvents.path,
      depth: projectEvents.depth,
    })
    .from(projectEvents)
    .where(eq(projectEvents.projectId, id))
    .orderBy(asc(projectEvents.path));

  // 3. Fetch all cost data for these events (safe inArray usage)
  const eventIds = events.map((e) => e.id);
  const costs = eventIds.length
    ? await db
      .select({
        projectEventId: projectsCost.projectEventId,
        budgetIncomeCurrency: projectsCost.budgetIncomeCurrency,
        budgetIncome: projectsCost.budgetIncome,
        budgetExpenseCurrency: projectsCost.budgetExpenseCurrency,
        budgetExpense: projectsCost.budgetExpense,
        realIncomeCurrency: projectsCost.realIncomeCurrency,
        realIncome: projectsCost.realIncome,
        realIncomeCreatedAt: projectsCost.realIncomeCreatedAt,
        realExpenseCurrency: projectsCost.realExpenseCurrency,
        realExpense: projectsCost.realExpense,
        realExpenseCreatedAt: projectsCost.realExpenseCreatedAt,
        eventSummary: projectsCost.eventSummary,
      })
      .from(projectsCost)
      .where(inArray(projectsCost.projectEventId, eventIds))
    : [];

  // Map costs by projectEventId
  const costMap: Record<string, any> = {};
  for (const c of costs) {
    costMap[c.projectEventId] = c;
  }

  // 4. Build tree with cost info
  const eventMap: Record<string, any> = {};
  const tree: any[] = [];

  for (const ev of events) {
    const costData = costMap[ev.id] || null;
    let extraCostInfo = null;

    if (costData) {
      if (ev.eventType === "folder") {
        extraCostInfo = costData.eventSummary;
      } else {
        const { eventSummary, ...rest } = costData;
        extraCostInfo = rest;
      }
    }

    eventMap[ev.id] = {
      ...ev,
      cost: extraCostInfo,
      children: [],
    };
  }

  for (const ev of events) {
    if (ev.parentId && eventMap[ev.parentId]) {
      eventMap[ev.parentId].children.push(eventMap[ev.id]);
    } else {
      tree.push(eventMap[ev.id]);
    }
  }

  return tree;
}

const projectRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: "/:id",
    method: "GET",
    schema: {
      tags: ["Project"],
      summary: "Get project details with its events structured as a tree",
      description: "Returns the project details along with a hierarchical tree of its events and their associated costs",
      params: Type.Object({
        id: Type.String({ format: "uuid" }),
      }),
      response: {
        200: ProjectDetailsResponse,
        404: ErrorResponse,
        500: ErrorResponse
      },
    },
    handler: withErrorHandler(async (req, reply) => {
      const { id } = req.params as { id: string };

      // 1. Fetch project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
        columns: {
          id: true,
          name: true,
          description: true,
        },
      });

      if (!project) {
        return reply.status(404).send({
          success: false,
          message: "Project not found",
        });
      }

      // 5. Return combined result
      const tree = await getProjectDetails(id);
      const data = {
        id: project.id,
        name: project.name,
        description: project.description,
        events: tree,
      };

      return {
        success: true,
        data: data,
      };
    }, 422),
  });
};

export default projectRoutes;
