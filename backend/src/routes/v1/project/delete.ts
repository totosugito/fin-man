import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from "../../../db/index.ts";
import { eq } from 'drizzle-orm';
import { Type } from '@sinclair/typebox';
import { projects, projectEvents, projectsCost } from "../../../db/schema/index.ts";

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

const deleteProject: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id',
    method: 'DELETE',
    schema: {
      tags: ['Project'],
      summary: '',
      description: 'Deletes a project and all its associated data (events and costs)',
      params: paramsSchema,
      response: responseSchema,
    },
    handler: withErrorHandler(async (req, reply) => {
      const { id } = req.params as { id: string };

      // Check if project exists
      const existingProject = await db.query.projects.findFirst({
        where: eq(projects.id, id),
        columns: {
          id: true
        }
      });

      if (!existingProject) {
        return reply.status(404).send({
          success: false,
          message: 'Project not found'
        });
      }

      // Start a transaction to ensure data consistency
      await db.transaction(async (tx) => {
        // First, delete all project costs associated with this project's events
        await tx.delete(projectsCost)
          .where(
            eq(
              projectsCost.projectEventId,
              db.select({ id: projectEvents.id })
                .from(projectEvents)
                .where(eq(projectEvents.projectId, id))
            )
          );

        // Then delete all project events (cascade will handle related data)
        await tx.delete(projectEvents)
          .where(eq(projectEvents.projectId, id));

        // Finally, delete the project itself
        await tx.delete(projects)
          .where(eq(projects.id, id));
      });

      return {
        success: true,
        message: 'Project and all associated data deleted successfully'
      };
    })
  });
};

export default deleteProject;
