import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from "../../../db/index.ts";
import { eq } from 'drizzle-orm';
import { Type } from '@sinclair/typebox';
import { projectEvents, projectsCost } from "../../../db/schema/index.ts";
import { computeParentCost } from "../../../services/project-event/update-cost.ts";

const paramsSchema = Type.Object({
  id: Type.String({ format: 'uuid' })
});

const responseSchema = {
  200: Type.Object({
    success: Type.Boolean(),
    message: Type.String()
  }),
  404: Type.Object({
    success: Type.Boolean(),
    message: Type.String()
  })
};

const deleteProjectEvent: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id',
    method: 'DELETE',
    schema: {
      tags: ['Project Event'],
      summary: '',
      description: 'Deletes a project event and its associated cost data',
      params: paramsSchema,
      response: responseSchema,
    },
    handler: withErrorHandler(async (req, reply) => {
      const { id } = req.params as { id: string };

      // Check if event exists and get its parentId for cost recalculation
      const existingEvent = await db.query.projectEvents.findFirst({
        where: eq(projectEvents.id, id),
        columns: {
          id: true,
          parentId: true,
          projectId: true
        }
      });

      if (!existingEvent) {
        return reply.status(404).send({
          success: false,
          message: 'Project event not found'
        });
      }

      // Store parent ID for cost recalculation
      const parentId = existingEvent.parentId;

      // Start a transaction
      await db.transaction(async (tx) => {
        // Delete the project cost first (if exists) due to foreign key constraint
        await tx.delete(projectsCost)
          .where(eq(projectsCost.projectEventId, id));

        // Delete the project event
        await tx.delete(projectEvents)
          .where(eq(projectEvents.id, id));

        // Recalculate parent costs if this event had a parent
        if (parentId) {
          await computeParentCost(parentId);
        }
      });

      return {
        success: true,
        message: 'Project event deleted successfully'
      };
    })
  });
};

export default deleteProjectEvent;
