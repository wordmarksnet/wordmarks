// ─── Error Classes ──────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly retryAfter?: number;

  constructor(statusCode: number, code: string, message: string, retryAfter?: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(429, 'RATE_LIMITED', `Rate limited. Retry after ${retryAfter}s`, retryAfter);
  }
}

export class ProviderError extends AppError {
  constructor(message?: string) {
    // Never expose provider details to client
    super(502, 'PROVIDER_ERROR', message || 'Upstream provider error. Please try again.');
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message);
  }
}

// ─── Response Builder ───────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  requestId: string;
}

export function successResponse<T>(data: T, requestId: string, status = 200): Response {
  const body: ApiResponse<T> = { ok: true, data, requestId };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}

export function errorResponse(error: unknown, requestId: string): Response {
  if (error instanceof AppError) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    };
    if (error.retryAfter !== undefined) {
      headers['Retry-After'] = String(error.retryAfter);
    }
    const body: ApiResponse = {
      ok: false,
      error: error.message,
      code: error.code,
      requestId,
    };
    return new Response(JSON.stringify(body), {
      status: error.statusCode,
      headers,
    });
  }

  // Never leak internal error details
  const body: ApiResponse = {
    ok: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId,
  };
  return new Response(JSON.stringify(body), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}
