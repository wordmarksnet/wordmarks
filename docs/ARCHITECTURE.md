# Architecture -- wordmarks.net

## Overview

Wordmarks.net is an AI-powered logo and wordmark generator. Users provide a brand name and description; the system generates logo concepts via OpenAI, reviews them, and iterates until a result is accepted.

The system is built entirely on Cloudflare's edge platform. There is no traditional server -- all compute runs as Cloudflare Pages Functions.

## System Diagram

```
+------------------+          +---------------------+
|   Browser /      |  HTTPS   |   api.wordmarks.net |
|   AI Agents      +--------->+   (Pages Functions) |
+------------------+          +----------+----------+
                                         |
                    +--------------------+--------------------+
                    |                    |                    |
              +-----v-----+      +------v------+     +------v------+
              | D1 (DB)    |      | KV (cache)  |     | R2 (storage)|
              | wordmarks- |      | WORDMARKS_  |     | wordmarks-  |
              | db         |      | KV          |     | kb          |
              +------------+      +-------------+     | wordmarks-  |
                                                      | generated   |
                                                      +-------------+
                                         |
                                         v
                                +--------+--------+
                                | OpenAI API      |
                                | (proxied, key   |
                                |  in secret)     |
                                +-----------------+
```

## Data Flow

1. **User submits brand** via the static frontend at `wordmarks.net`
2. **Frontend calls API** at `api.wordmarks.net/api/v1/*` (Pages Functions)
3. **Middleware** authenticates (if admin), applies rate limiting (KV-backed), validates input
4. **Handler** calls OpenAI API with the provider key (never exposed to client)
5. **Response** is logged to D1 (generation_jobs table), stored in R2 (generated logos), and returned to the user
6. **Review/iterate cycle** allows the user to refine the generated logo

## Key Design Decisions

### Static Export + Pages Functions

The frontend is a Next.js static export (`next build` with `output: 'export'`). This eliminates SSR complexity and server costs. All dynamic logic runs in Cloudflare Pages Functions under `functions/api/v1/*`.

This means `wordmarks.net` serves static files only. API calls must go to `api.wordmarks.net`.

### API Hostname Separation

- `wordmarks.net` -- static site (HTML/CSS/JS)
- `api.wordmarks.net` -- API endpoints (Pages Functions)

The separation avoids a known Next.js GET routing bug where `/api/v1/*` paths return 404 on the static domain. Both domains resolve to the same Pages project (`wordmarks-v2`).

### Defense-in-Depth Auth

Admin endpoints have two layers of authentication:
1. **Middleware check** -- blocks unauthenticated requests early
2. **Handler check** -- explicit `authenticateRequest()` in every admin handler

This means even if middleware is bypassed, handlers still enforce auth.

### R2 with Base64 Fallback

R2 bindings are optional in the Env interface (`?` suffix). When R2 is unavailable (local dev), the code falls back to base64 storage in D1. In production, R2 is always available.

### KV Rate Limiting with In-Memory Fallback

KV provides persistent rate limiting across cold starts. When KV is unavailable (local dev), an in-memory Map is used as a fallback. The fallback resets on function restart.

## File Structure

```
functions/
  api/v1/
    [action].ts          -- Main API handler (research, generate-logo, review, iterate)
    _middleware.ts        -- Auth, CORS, rate limiting, request IDs
    auth.ts               -- Token + Cloudflare Access JWT authentication
    health.ts             -- Health check endpoint (D1, KV, R2 status)
    providers.ts          -- Provider allowlist, timeout, retry logic
    rate-limit.ts         -- KV-backed rate limiting
    db/
      migrate.ts          -- D1 schema migration
      schema.sql          -- Database schema
    admin/
      providers.ts        -- Provider CRUD
      settings.ts         -- Settings management
      knowledge-base.ts   -- Knowledge base CRUD (R2 + base64 fallback)
      stats.ts            -- Dashboard statistics
      export.ts           -- Redacted data export
lib/
  api.ts                  -- Frontend API client (calls api.wordmarks.net)
  admin-api.ts            -- Admin API client
  mcp.ts                  -- MCP integration helpers
  types.ts                -- TypeScript types
  validation.ts           -- Input validation
  errors.ts               -- Error handling
  prompts.ts              -- AI prompt templates
app/
  page.tsx                -- Main logo generator UI
  admin/
    page.tsx              -- Admin dashboard
    providers/page.tsx    -- Provider management
    settings/page.tsx     -- Settings management
    knowledge-base/page.tsx -- Knowledge base management
```

## See Also

- [INFRA.md](../INFRA.md) -- Cloudflare resources, DNS, deployment
- [SECURITY.md](../SECURITY.md) -- Secrets, auth, rate limiting
- [RUNBOOK.md](../RUNBOOK.md) -- Health checks, troubleshooting
