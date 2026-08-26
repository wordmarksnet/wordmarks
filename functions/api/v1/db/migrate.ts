// ─── D1 Migration Endpoint ──────────────────────────────
// Run: POST /api/v1/admin/migrate with admin auth

import { successResponse, errorResponse, ValidationError } from '../../../lib/errors';

interface Env {
  DB: D1Database;
  WORDMARKS_MCP_TOKEN?: string;
}

interface FunctionContext {
  request: Request;
  env: Env;
}

const SCHEMA_SQL = `
-- Wordmarks.net D1 Schema
-- Created: 2026-08-25

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  text_model TEXT NOT NULL DEFAULT 'gpt-4o',
  image_model TEXT NOT NULL DEFAULT 'dall-e-3',
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Logo Reference',
  tags TEXT DEFAULT '[]',
  description TEXT DEFAULT '',
  image_url TEXT,
  image_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,
  model TEXT,
  prompt TEXT,
  result_url TEXT,
  quality_score REAL,
  error TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS usage_counters (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created ON generation_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_counters_token ON usage_counters(token, action);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category ON knowledge_items(category);
`;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

  try {
    if (request.method !== 'POST') {
      throw new ValidationError('Only POST method is allowed');
    }

    // Execute schema
    // Strip SQL line comments before splitting, then filter empty statements
    const cleaned = SCHEMA_SQL
      .split('\n')
      .map((line) => line.replace(/--.*$/, ''))
      .join('\n');
    const statements = cleaned
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let executed = 0;
    for (const stmt of statements) {
      try {
        await env.DB.prepare(stmt).run();
        executed++;
      } catch (err) {
        // Log but don't fail on individual statement errors (e.g., index already exists)
        console.warn(`Migration statement warning: ${err}`);
      }
    }

    // Verify tables exist
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();

    return successResponse({
      migrated: true,
      statementsExecuted: executed,
      tables: tables.results?.map((t) => t.name) || [],
    }, requestId);
  } catch (err) {
    return errorResponse(err, requestId);
  }
};
