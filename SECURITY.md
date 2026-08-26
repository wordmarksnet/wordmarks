# Security - wordmarks.net

## Secrets Management

- API keys are stored as Cloudflare Pages secrets (never in code or env files)
- `.env.local` contains NO secrets (only reference config)
- Export endpoint redacts all API keys
- Admin UI never displays raw API keys

### Secret Scan Results (2026-08-26)

| Scan Target | Result |
|-------------|--------|
| Source code (app/, lib/, functions/) | PASS — No hardcoded API keys, tokens, or secrets |
| Build output (out/) | PASS — No `sk-*`, `NEXT_PUBLIC_*`, or compromised key patterns |
| `.env.local` | PASS — Contains only model config, no API keys |
| localStorage/sessionStorage | PASS — No references in source code |
| Compromised key (`EuGiHUwMx...`) | PASS — Not found in source or build output |
| Frontend bundle | PASS — `api.wordmarks.net` correctly embedded in 5 files |

## Authentication

- Admin endpoints require `WORDMARKS_MCP_TOKEN` bearer token OR Cloudflare Access JWT
- Public generation endpoints allow unauthenticated access (stricter rate limits)
- All responses include `X-Request-ID` for audit trail
- **Defense-in-depth**: Admin endpoints have explicit auth checks in handlers (not just middleware)

### API Endpoint Security

- **api.wordmarks.net**: Canonical API endpoint for all traffic — **COMPLETE** (DNS CNAME resolved 2026-08-26)
  - Health: 200 OK (D1 up, KV up)
  - Admin endpoints: 401 Unauthorized without valid token
- **wordmarks-v2.pages.dev**: Working fallback endpoint (verified 2026-08-26)
  - Admin endpoints: 401 Unauthorized without valid token
  - Health endpoint: Public, no auth required
  - Generation endpoints: Allow unauthenticated with stricter rate limits
- **wordmarks.net**: Static site only (known GET routing bug for /api/v1/* — returns Next.js 404)

## Rate Limiting

- Unauthenticated: 5 requests/minute
- Authenticated: 30 requests/minute
- Generation: 10 requests/hour
- Storage: KV (persistent) with in-memory fallback

## Provider Security

- Only whitelisted provider hosts are allowed (api.openai.com, openrouter.ai, api.together.xyz, api.groq.com)
- Provider URLs validated before any API call
- 30-second timeout on all provider calls
- Max 2 retries with exponential backoff
- Provider errors never leaked to client (generic messages only)

## Input Validation

- All request bodies validated with runtime checks (Zod-like)
- brandName: 1-100 chars
- description: max 500 chars
- imageData: max 5MB
- referenceImages: max 5 items
- JSON responses defensively parsed (code fences, leading/trailing text)

## Audit Trail

- All generation jobs logged to D1 (brand, status, model, duration)
- Request IDs on every response
- IP addresses captured on admin actions

## Compromised Keys

A previously exposed OpenAI API key (prefix `sk-proj-EuGiHUwMx...`) must NOT be reused. Generate a new key at https://platform.openai.com and set it via:
```bash
wrangler pages secret put OPENAI_API_KEY --project-name=wordmarks-v2
```

## Cloudflare Access (Configured 2026-08-26)

Cloudflare Access is now configured with two self-hosted applications:

| Application | Destination | Policy ID | Action |
|-------------|-------------|-----------|--------|
| Wordmarks Admin | wordmarks.net/admin/* | b52d566e-0f94-437c-9345-c6a2173e7cef | Allow (Emails: n311311@gmail.com) |
| Wordmarks Admin API | api.wordmarks.net/api/v1/admin/* | 22b012a3-2c8e-4d95-8da0-954c109d4d9d | Allow (Emails: n311311@gmail.com) |

- Configured via CDP bridge keyboard automation (React combobox resolved via keyboard-first approach)
- Both apps: "Accept all available identity providers" enabled
- The app-side `hasCfAccessJwt()` check in auth.ts recognizes `Cf-Access-Jwt-Assertion` header
- Admin auth now has defense-in-depth: WORDMARKS_MCP_TOKEN + Cloudflare Access JWT

## R2 Storage (Configured and Wired 2026-08-26)

R2 Object Storage is active with free tier (10GB, 1M Class A ops, 10M Class B ops).

- **wordmarks-kb** (KB_BUCKET): Knowledge base image storage
- **wordmarks-generated** (GENERATED_BUCKET): Generated logo storage
- Storage class: Standard
- Location: Asia Pacific (automatic)
- Bindings: `[[r2_buckets]]` in wrangler.toml
- Code: knowledge-base.ts (upload/fetch/delete with base64 fallback), [action].ts (archival), health.ts (health checks)
- R2 bindings are optional (`?` in Env) -- base64 fallback works when R2 absent (local dev)
