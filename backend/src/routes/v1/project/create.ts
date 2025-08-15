import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from '../../../db/index.ts';
import { Type } from '@sinclair/typebox';
import { and, eq } from 'drizzle-orm';
import { EnumProjectStatus, EnumProjectType, EnumProjectEventType, projects, projectEvents, projectsCost } from "../../../db/schema/index.ts";
import {randomUUID} from "node:crypto";

const projectRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/create',
    method: 'POST',
    schema: {
      tags: ['Project'],
      summary: 'Create a new project',
      description: 'Create a new project with the provided details',
      body: Type.Object({
        name: Type.String(),
        description: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.Optional(Type.String()),
            type: Type.String(),
            status: Type.String(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        409: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      const { name, description, type: ProjectType, status } = req.body as {
        name: string;
        description?: string;
        type?: string;
        status?: string;
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

      const userId = req.session?.user?.id;

      // Check if project with the same name already exists for this user
      const existingProject = await db.query.projects.findFirst({
        where: and(
          eq(projects.userId, userId),
          eq(projects.name, name)
        ),
      });

      if (existingProject) {
        return reply.status(409).send({
          success: false,
          message: 'A project with this name already exists',
        });
      }

      // Use a transaction to ensure all operations succeed or fail together
      const result = await db.transaction(async (tx) => {
        // 1. Create the new project
        const [newProject] = await tx.insert(projects).values({
          userId,
          name,
          description: description || null,
          status: EnumProjectStatus.draft,
        }).returning({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          type: projects.type,
          status: projects.status,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        });

        // 2. Create a root project event
        const projectEventId = randomUUID();
        await tx.insert(projectEvents).values({
          id: projectEventId,
          projectId: newProject.id,
          userId,
          name: '/',
          description: '',
          eventType: EnumProjectEventType.folder,
          path: projectEventId, // For root, path is just its own ID
          sortOrder: 0,
        });

        // 3. Create a default project cost entry
        await tx.insert(projectsCost).values({
          projectEventId,
          // Other fields can be left as null/default
        });

        return newProject;
      });

      return reply.status(201).send({
        success: true,
        data: {
          ...result,
          createdAt: result.createdAt!.toISOString(),
          updatedAt: result.updatedAt!.toISOString(),
        },
      });
    })
  });
};

export default projectRoutes;
