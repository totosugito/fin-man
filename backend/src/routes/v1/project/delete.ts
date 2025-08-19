import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from "../../../db/index.ts";
import { eq } from 'drizzle-orm';
import { Type } from '@sinclair/typebox';
import { projects } from "../../../db/schema/index.ts";

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

      // Delete the project
      await db.delete(projects)
        .where(eq(projects.id, id));

      return {
        success: true,
        message: 'Project and all associated data deleted successfully'
      };
    })
  });
};

export default deleteProject;
