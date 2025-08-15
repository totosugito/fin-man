import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import { Type } from '@fastify/type-provider-typebox';
import {withErrorHandler} from "../../utils/withErrorHandler.ts";
import { db } from '../../db/index.ts';
import { users } from '../../db/schema/index.ts';
import { eq } from 'drizzle-orm';
import { getUserAvatarUrl } from '../../utils/app-utils.ts';

// Response schemas
const ErrorResponse = Type.Object({
  success: Type.Boolean({ default: false }),
  message: Type.String(),
});

const UserResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.Union([Type.String(), Type.Null()]),
  image: Type.Union([Type.String(), Type.Null()]),
  emailVerified: Type.Boolean(),
  role: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

const AuthResponse = Type.Object({
  success: Type.Boolean({ default: true }),
  user: Type.Omit(UserResponse, ['password']),
  token: Type.String(),
});

const publicRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/sign-in-email',
    method: 'POST',
    schema: {
      tags: ['Auth'],
      summary: 'Sign in with email and password',
      description: 'Authenticate user with email and password and return user data with access token',
      consumes: ['multipart/form-data'],
      response: {
        200: AuthResponse,
        400: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      // Parse form data into a key-value object
      const formData = new Map<string, string>();
      if (typeof req.parts === 'function') {
        for await (const part of req.parts()) {
          if (part.type === 'field') {
            formData.set(part.fieldname, part.value as string);
          }
        }
      }
      const { email, password } = Object.fromEntries(formData);

      // Validate required fields
      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Email and password are required',
        } as const);
      }

      // Use Fastify's built-in inject method
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        payload: JSON.stringify({
          email: email,
          password: password
        }),
        headers: {
          'content-type': 'application/json'
        }
      });

      const authData = response.json();

      if (!authData.user) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication failed: Invalid email or password'
        } as const);
      }

      // Fetch the user with role from the database
      const userWithRole = await db.query.users.findFirst({
        where: eq(users.id, authData.user.id),
        columns: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!userWithRole) {
        return reply.status(404).send({
          success: false,
          message: 'User not found in database'
        } as const);
      }

      // Forward the response
      return reply
        .status(response.statusCode)
        .headers(response.headers)
        .send({
          ...authData,
          user: {
            ...authData.user,
            ...userWithRole,
            image: getUserAvatarUrl(userWithRole.image),
          }
        });
    }),
  });
};

export default publicRoute;
