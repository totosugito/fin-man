import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import {withErrorHandler} from "../../../utils/withErrorHandler.ts";
import {db} from "../../../db/index.ts";
import {sql} from 'drizzle-orm';
import {type Static, Type} from '@sinclair/typebox';
import {projectEvents, projects, EnumProjectEventType, projectsCost} from "../../../db/schema/index.ts";
import {and, eq} from 'drizzle-orm';
import {randomUUID} from "node:crypto";
import {computeParentCost} from "../../../services/project-event/update-cost.ts";
import {eventCost} from "../../../types/project-event.ts";

const bodySchema = Type.Object({
  projectId: Type.String({format: 'uuid'}),
  parentId: Type.String({format: 'uuid'}),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  eventType: Type.Optional(Type.Enum(EnumProjectEventType)),
  sortOrder: Type.Optional(Type.Number({minimum: 0})),
  extra: Type.Optional(Type.Record(Type.String(), Type.Any())),
  eventCost: eventCost
});

const projectEventRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/create',
    method: 'POST',
    schema: {
      tags: ['Project Event'],
      summary: 'Create a new project event',
      description: 'Create a new project event with the provided details',
      body: bodySchema,
    },
    handler: withErrorHandler(async (req, reply) => {
      const body = req.body as Static<typeof bodySchema>;
      const {projectId, parentId, name, description, eventType, sortOrder, extra, eventCost} = body;

      if (!projectId || !parentId) {
        return reply.status(400).send({
          success: false,
          message: 'Project and parent ID is required'
        });
      }

      // Check if project exists
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        return reply.status(404).send({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      // check if parent id is valid
      const parentEvent = await db.query.projectEvents.findFirst({
        where: eq(projectEvents.id, parentId)
      });
      if (!parentEvent) {
        return reply.status(404).send({
          success: false,
          message: 'Parent event not found'
        });
      }
      if (parentEvent.eventType !== EnumProjectEventType.folder) {
        return reply.status(400).send({
          success: false,
          message: 'Parent event must be a folder'
        });
      }

      // If parentId is provided, verify it exists and belongs to the same project
      const parent = await db.query.projectEvents.findFirst({
        where: and(
          eq(projectEvents.id, parentId),
          eq(projectEvents.projectId, projectId)
        ),
        columns: {
          path: true
        }
      });

      if (!parent) {
        return reply.status(404).send({
          success: false,
          message: 'Parent event not found or does not belong to this project'
        });
      }
      let parentPath = parent.path;

      const userId = req.session?.user?.id;

      // Generate a UUID for the path if needed
      const newId = randomUUID();
      const newPath = parentPath ? `${parentPath}.${newId}` : newId;

      // Create the new project event
      const [newEvent] = await db.insert(projectEvents).values({
        projectId,
        userId,
        parentId,
        name,
        description: description || null,
        eventType: eventType || EnumProjectEventType.folder,
        sortOrder: sortOrder || 0,
        path: sql`${newPath}::ltree`,
        extra: extra || {},
      }).returning({
        id: projectEvents.id,
        eventType: projectEvents.eventType
      });

      if (!newEvent) {
        return reply.status(500).send({
          success: false,
          message: 'Failed to create event'
        });
      }

      if (eventType === EnumProjectEventType.folder) {
        const result = await db.insert(projectsCost).values({
          projectEventId: newEvent.id
        }).returning();

        if (!result || result.length === 0) {
          reply.status(500).send({
            success: false,
            message: 'Failed to create event cost'
          });
        }
      }
      else {
        const result = await db.insert(projectsCost).values({
          projectEventId: newEvent.id,
          budgetIncomeCurrency: eventCost?.budgetIncomeCurrency || 'IDR',
          budgetIncome: eventCost?.budgetIncome || '0',
          budgetExpenseCurrency: eventCost?.budgetExpenseCurrency || 'IDR',
          budgetExpense: eventCost?.budgetExpense || '0',
          realIncomeCurrency: eventCost?.realIncomeCurrency || 'IDR',
          realIncome: eventCost?.realIncome || '0',
          realIncomeCreatedAt: eventCost?.realIncomeCreatedAt ? new Date(eventCost.realIncomeCreatedAt) : new Date(),
          realExpenseCurrency: eventCost?.realExpenseCurrency || 'IDR',
          realExpense: eventCost?.realExpense || '0',
          realExpenseCreatedAt: eventCost?.realExpenseCreatedAt ? new Date(eventCost.realExpenseCreatedAt) : new Date(),
        }).returning();

        if (!result || result.length === 0) {
          reply.status(500).send({
            success: false,
            message: 'Failed to create event cost'
          });
        }

        await computeParentCost(parentId);
      }

      // Return the new project event
      const event = await db.query.projectEvents.findFirst({
        where: eq(projectEvents.id, newEvent.id),
        columns: {
          id: true,
          projectId: true,
          parentId: true,
          userId: true,
          name: true,
          description: true,
          eventType: true,
          sortOrder: true,
          path: true,
          depth: true,
          extra: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!event) {
        return reply.status(500).send({
          success: false,
          message: 'Failed to create project event'
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          ...event,
          createdAt: event.createdAt!.toISOString(),
          updatedAt: event.updatedAt!.toISOString(),
        },
      });
    })
  });
};

export default projectEventRoutes;
