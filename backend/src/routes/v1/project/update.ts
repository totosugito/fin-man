import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from "../../../db/index.ts";
import { projects, EnumProjectStatus, EnumProjectType } from "../../../db/schema/index.ts";
import { eq } from "drizzle-orm";

const updateProject: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/:id',
    method: 'PUT',
    schema: {
      tags: ['Project'],
      summary: '',
      description: 'Update project details',
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      body: Type.Object({
        name: Type.String(),
        description: Type.String(),
        type: Type.String(),
        status: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.Optional(Type.String()),
            type: Type.String(),
            status: Type.String(),
            extra: Type.Record(Type.Any(), Type.Any()),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        401: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        403: Type.Object({
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
      const { id } = req.params as { id: string };
      const { name, description, type: ProjectType, status } = req.body as {
        name: string;
        description: string;
        type: string;
        status: string;
      };

      // Validate project type
      if (!Object.values(EnumProjectType).includes(ProjectType as keyof typeof EnumProjectType)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid project type',
        });
      }

      // Validate project status
      if (!Object.values(EnumProjectStatus).includes(status as keyof typeof EnumProjectStatus)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid project status',
        });
      }

      // Check if project exists
      const project = await db.query.projects.findFirst({
        where: (projectTable, { eq }) => eq(projectTable.id, id)
      });

      if (!project) {
        return reply.status(404).send({
          success: false,
          message: 'Project not found'
        });
      }

      // Prepare update data
      const updateFields: Record<string, any> = {
        name,
        description,
        type: ProjectType,
        status,
        updatedAt: new Date() // Always update the updatedAt timestamp
      };

      // Update the project
      const [updatedProject] = await db
        .update(projects)
        .set(updateFields)
        .where(eq(projects.id, id))
        .returning({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          type: projects.type,
          status: projects.status,
          extra: projects.extra,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        });

      return {
        success: true,
        data: {
          ...updatedProject,
          description: updatedProject.description || undefined, // Convert null to undefined
          extra: updatedProject.extra || {},
          createdAt: updatedProject.createdAt!.toISOString(),
          updatedAt: updatedProject.updatedAt!.toISOString(),
        }
      };
    })
  });
};

export default updateProject;
