export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Erro interno do servidor') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = 'O serviço externo não respondeu a tempo') {
    super(message, 504, 'GATEWAY_TIMEOUT');
  }
}
