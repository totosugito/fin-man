import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import {withErrorHandler} from "../../../utils/withErrorHandler.ts";
import { getAuthInstance } from '../../../decorators/auth.decorator.ts';
import { db } from "../../../db/index.ts";
import { Type } from '@sinclair/typebox';
import { fromNodeHeaders } from 'better-auth/node';
import {accounts, users, EnumUserRole} from "../../../db/schema/index.ts";

const protectedRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/create',
    method: 'POST',
    schema: {
      tags: ['Admin/User'],
      summary: '',
      description: 'Create user',
      body: Type.Object({
        email: Type.String({
          format: 'email',
        }),
        password: Type.String({
          minLength: 8,
        }),
        name: Type.String({
          minLength: 1,
        }),
        role: Type.Optional(Type.String({
          minLength: 1,
          description: 'User role (e.g., admin, user, etc.)',
        })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            email: Type.String({ format: 'email' }),
            name: Type.String(),
            role: Type.String(),
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
          error: Type.Optional(Type.String())
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      const auth = getAuthInstance(app);
      const { email, password, name, role: inputRole } = req.body as {
        email: string;
        password: string;
        name: string;
        role: string;
      };

      // Validate required fields
      if (!email || !password || !name || !inputRole) {
        return reply.status(400).send({
          success: false,
          message: 'All fields are required: email, password, name, role, phone',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid email format',
        });
      }

      // Validate and set role
      if (!Object.values(EnumUserRole).includes(inputRole as keyof typeof EnumUserRole)) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid role',
        });
      }
      const role = inputRole as keyof typeof EnumUserRole;

      // Check if user with this email already exists
      const { users: usersList } = await auth.api.listUsers({
        query: { searchValue: email, searchField: 'email' },
        headers: fromNodeHeaders(req.headers),
      });

      if (usersList && usersList.length > 0) {
        return reply.status(409).send({
          success: false,
          message: 'User with this email already exists',
        });
      }

      const context = await auth.$context;
      const hashedPassword = await context.password.hash(password);

      try {
        // Start a transaction
        const result = await db.transaction(async (tx) => {
          // Insert user
          const [user] = await tx.insert(users).values({
            email,
            name,
            emailVerified: false,
            role: EnumUserRole[role as keyof typeof EnumUserRole],
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            banned: false,
            banReason: null,
            banExpires: null,
          }).returning();

          if (!user) {
            return reply.status(500).send({
              success: false,
              message: 'Failed to create user: No user data returned',
            });
          }

          // Insert account
          const [account] = await tx.insert(accounts).values({
            providerId: 'credential',
            accountId: user.id,
            userId: user.id,
            password: hashedPassword,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            scope: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();

          if (!account) {
            return reply.status(500).send({
              success: false,
              message: 'Failed to create user account',
            });
          }

          // Return the created user data
          return {
            success: true,
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }
          };
        });

        return reply.status(200).send(result);
      } catch (error) {
        req.log.error(error, 'Error creating user');
        return reply.status(500).send({
          success: false,
          message: 'An error occurred while creating the user',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 422),

  });
}
export default protectedRoute;
