import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import {withErrorHandler} from "../../../utils/withErrorHandler.ts";
import {db} from "../../../db/index.ts";
import {eq} from 'drizzle-orm';
import {Type} from '@sinclair/typebox';
import {projectEvents, projectsCost, EnumProjectEventType} from "../../../db/schema/index.ts";
import {computeParentCost} from "../../../services/project-event/update-cost.ts";
import {eventCost} from "../../../types/project-event.ts";

const bodySchema = Type.Object({
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  sortOrder: Type.Optional(Type.Number({minimum: 0})),
  extra: Type.Optional(Type.Record(Type.String(), Type.Any())),
  eventCost: eventCost
});

const updateProjectEvent: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id',
    method: 'PUT',
    schema: {
      tags: ['Project Event'],
      summary: '',
      description: 'Update an existing project event with the provided details',
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      body: bodySchema,
    },
    handler: withErrorHandler(async (req, reply) => {
      const { id } = req.params as { id: string };
      const {name, description="", sortOrder=0, extra={}, eventCost} = req.body as typeof bodySchema;

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
          if (eventCost.transactionType !== undefined) costUpdate.transactionType = eventCost.transactionType;
          if (eventCost.budgetCurrency !== undefined) costUpdate.budgetCurrency = eventCost.budgetCurrency;
          if (eventCost.budget !== undefined) costUpdate.budget = eventCost.budget;
          if (eventCost.actualCurrency !== undefined) costUpdate.actualCurrency = eventCost.actualCurrency;
          if (eventCost.actual !== undefined) costUpdate.actual = eventCost.actual;
          if (eventCost.hasActual !== undefined) costUpdate.hasActual = eventCost.hasActual;
          if (eventCost.actualCreatedAt !== undefined) costUpdate.actualCreatedAt = new Date(eventCost.actualCreatedAt);

          await tx.update(projectsCost)
            .set(costUpdate)
            .where(eq(projectsCost.projectEventId, id));
        }

        // Recalculate parent costs using the transaction
        await computeParentCost(id, tx);
      });

      // Fetch and return the updated event
      const updatedEvent = await db.query.projectEvents.findFirst({
        where: eq(projectEvents.id, id),
      });

      return {
        success: true,
        data: updatedEvent
      };
    }, 422),
  });
};

export default updateProjectEvent;
