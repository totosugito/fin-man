import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import {withErrorHandler} from "../../../utils/withErrorHandler.ts";
import {db} from "../../../db/index.ts";
import {eq} from 'drizzle-orm';
import {Type} from '@sinclair/typebox';
import {projectEvents, projectsCost, EnumProjectEventType} from "../../../db/schema/index.ts";
import {computeParentCost} from "../../../services/project-event/update-cost.ts";
import {eventCost} from "../../../types/project-event.ts";

const bodySchema = Type.Object({
  id: Type.String({format: 'uuid'}),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  sortOrder: Type.Optional(Type.Number({minimum: 0})),
  extra: Type.Optional(Type.Record(Type.String(), Type.Any())),
  eventCost: eventCost
});

const updateProjectEvent: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/update',
    method: 'PUT',
    schema: {
      tags: ['Project Event'],
      summary: '',
      description: 'Update an existing project event with the provided details',
      body: bodySchema,
    },
    handler: withErrorHandler(async (req, reply) => {
      const body = req.body;
      const {id, name, description, sortOrder, extra, eventCost} = body as typeof bodySchema;

      // Check if event exists
      const existingEvent = await db.query.projectEvents.findFirst({
        where: eq(projectEvents.id, id),
        columns: {
          id: true,
          eventType: true,
          projectId: true
        }
      });

      if (!existingEvent) {
        return reply.status(404).send({
          success: false,
          message: 'Project event not found'
        });
      }

      // Start a transaction
      await db.transaction(async (tx) => {
        // Update the project event
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        if (extra !== undefined) updateData.extra = extra;

        if (Object.keys(updateData).length > 0) {
          await tx.update(projectEvents)
            .set(updateData)
            .where(eq(projectEvents.id, id));
        }

        // Update project cost if provided
        if ((eventCost) && (existingEvent.eventType === EnumProjectEventType.file)) {
          // For files, update all cost fields
          const costUpdate: any = {};
          if (eventCost.budgetIncomeCurrency !== undefined) costUpdate.budgetIncomeCurrency = eventCost.budgetIncomeCurrency;
          if (eventCost.budgetIncome !== undefined) costUpdate.budgetIncome = eventCost.budgetIncome;
          if (eventCost.budgetExpenseCurrency !== undefined) costUpdate.budgetExpenseCurrency = eventCost.budgetExpenseCurrency;
          if (eventCost.budgetExpense !== undefined) costUpdate.budgetExpense = eventCost.budgetExpense;
          if (eventCost.realIncomeCurrency !== undefined) costUpdate.realIncomeCurrency = eventCost.realIncomeCurrency;
          if (eventCost.realIncome !== undefined) costUpdate.realIncome = eventCost.realIncome;
          if (eventCost.realIncomeCreatedAt !== undefined) costUpdate.realIncomeCreatedAt = new Date(eventCost.realIncomeCreatedAt);
          if (eventCost.realExpenseCurrency !== undefined) costUpdate.realExpenseCurrency = eventCost.realExpenseCurrency;
          if (eventCost.realExpense !== undefined) costUpdate.realExpense = eventCost.realExpense;
          if (eventCost.realExpenseCreatedAt !== undefined) costUpdate.realExpenseCreatedAt = new Date(eventCost.realExpenseCreatedAt);

          await tx.update(projectsCost)
            .set(costUpdate)
            .where(eq(projectsCost.projectEventId, id));
        }

        // Recalculate parent costs
        await computeParentCost(id);
      });

      // Fetch and return the updated event
      const updatedEvent = await db.query.projectEvents.findFirst({
        where: eq(projectEvents.id, id),
        with: {
          cost: true
        }
      });

      return {
        success: true,
        data: updatedEvent
      };
    }, 422),
  });
};

export default updateProjectEvent;
