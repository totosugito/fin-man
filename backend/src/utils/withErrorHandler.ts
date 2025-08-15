import type {FastifyRequest, FastifyReply} from 'fastify';

export function withErrorHandler<
  Req extends FastifyRequest = FastifyRequest,
  Res extends FastifyReply = FastifyReply,
  Return = unknown
>(
  handler: (req: Req, reply: Res) => Promise<Return>,
  defaultErrorStatusCode = 400
): (req: Req, reply: Res) => Promise<Return> {
  return async (req: Req, reply: Res): Promise<Return> => {
    try {
      return await handler(req, reply);
    } catch (err: unknown) {
      // req.log.error(err);

      const isErrorWithProps = (
        error: unknown
      ): error is { statusCode?: number; code?: number; message?: string } =>
        error !== null && typeof error === 'object';

      const statusCode = isErrorWithProps(err)
        ? err.statusCode ?? err.code ?? defaultErrorStatusCode
        : defaultErrorStatusCode;

      const errorMessage =
        isErrorWithProps(err) && err.message ? err.message : 'Unexpected error';

      // Send error response
      reply.status(statusCode).send({
        success: false,
        error: errorMessage,
      });

      // Prevent reaching the end of function without return
      throw err;
    }
  };
}
