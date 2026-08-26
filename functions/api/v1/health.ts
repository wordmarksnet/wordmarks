// ─── Health Check Endpoint ───────────────────────────────
// GET /api/v1/health — Public, no auth required

import { successResponse, errorResponse, AppError } from '../../lib/errors';

interface Env {
  DB: D1Database;
  WORDMARKS_KV: KVNamespace;
  KB_BUCKET?: R2Bucket;
  GENERATED_BUCKET?: R2Bucket;
}

interface FunctionContext {
  request: Request;
  env: Env;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

  try {
    if (request.method !== 'GET') {
      return errorResponse(new AppError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed'), requestId);
    }

    // Check D1 connectivity
    let dbOk = false;
    try {
      await env.DB.prepare('SELECT 1').first();
      dbOk = true;
    } catch {
      // D1 unavailable
    }

    // Check KV connectivity
    let kvOk = false;
    try {
      await env.WORDMARKS_KV.get('__health_check__');
      kvOk = true;
    } catch {
      // KV unavailable
    }

    // Check R2 KB bucket binding
    const r2KbOk = !!env.KB_BUCKET;

    // Check R2 Generated bucket binding
    const r2GenOk = !!env.GENERATED_BUCKET;

    return successResponse(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: dbOk ? 'up' : 'down',
          kv: kvOk ? 'up' : 'down',
          r2_kb: r2KbOk ? 'up' : 'down',
          r2_generated: r2GenOk ? 'up' : 'down',
        },
      },
      requestId,
    );
  } catch (err) {
    return errorResponse(err, requestId);
  }
};
