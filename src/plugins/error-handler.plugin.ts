import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError, GatewayTimeoutError } from '../shared/errors/app.error.js';

function handleValidationError(error: FastifyError, _request: FastifyRequest, reply: FastifyReply) {
  const issues = error.validation?.map((v) => ({
    field:
      String(v.instancePath).replace('/', '') || String(v.params?.missingProperty ?? 'unknown'),
    message: v.message ?? 'Erro de validação',
  }));

  return reply.status(400).send({
    code: 'VALIDATION_ERROR',
    message: 'Dados inválidos',
    details: { issues: issues ?? [] },
  });
}

function handleAppError(
  error: AppError,
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) {
  if (error.statusCode >= 500) {
    app.log.error({ err: error, reqId: request.id }, error.message);
  }

  if (error.statusCode === 401 || error.statusCode === 403) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
    });
  }

  return reply.status(error.statusCode).send({
    code: error.code,
    message: error.message,
    ...(error.details && { details: error.details }),
  });
}

function handleFastifyError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) {
  if (error.statusCode === 401 || error.statusCode === 403) {
    return reply.status(error.statusCode).send({
      code: error.code ?? (error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'),
      message: error.message,
    });
  }

  if (error.code === 'FST_ERR_RESPONSE_SERIALIZATION') {
    app.log.error({ err: error, reqId: request.id }, 'Schema/DB mismatch on response');
    return reply.status(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
    });
  }

  return reply.status(error.statusCode ?? 500).send({
    code: error.code ?? 'FASTIFY_ERROR',
    message: error.message,
  });
}

function handleNativeError(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) {
  const isTimeout = error.message.toLowerCase().includes('timeout');

  if (isTimeout) {
    const timeout = new GatewayTimeoutError(error.message);
    app.log.warn({ err: error, reqId: request.id }, 'Gateway timeout');
    return reply.status(timeout.statusCode).send({
      code: timeout.code,
      message: timeout.message,
    });
  }

  app.log.error({ err: error, reqId: request.id }, 'Unhandled native error');
  return reply.status(500).send({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno do servidor',
  });
}

export default fp(
  async (app) => {
    app.setErrorHandler((error: FastifyError, request, reply) => {
      if (error.validation) {
        return handleValidationError(error, request, reply);
      }
      if (error instanceof AppError) {
        return handleAppError(error, request, reply, app);
      }
      if (error.statusCode) {
        return handleFastifyError(error, request, reply, app);
      }
      return handleNativeError(error, request, reply, app);
    });
  },
  {
    name: 'error-handler',
  },
);
