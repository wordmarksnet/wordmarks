# Infrastructure - wordmarks.net

## Architecture Overview

```
Browser / AI Agents
    |
    | POST /api/v1/*
    v
api.wordmarks.net (Cloudflare Pages Functions)  [COMPLETE]
    |                                              wordmarks-v2.pages.dev (fallback)
    +-- Auth middleware (WORDMARKS_MCP_TOKEN / CF Access JWT)
    +-- Rate limiting (KV or in-memory fallback)
    +-- Provider allowlist + timeout/retry
    +-- D1 database (providers, settings, KB, jobs, audit)
    +-- OpenAI API (proxied, key never exposed to client)

Static site served from:
    wordmarks.net -> wordmarks-v2 (Pages project)
```

## Canonical API Endpoint

**`https://api.wordmarks.net`** is the intended dedicated API hostname for browser and AI agent traffic.

**Current status: COMPLETE** — DNS CNAME resolved 2026-08-26.

**Verified endpoints** (2026-08-26):
- Health: `GET https://api.wordmarks.net/api/v1/health` — 200 OK (D1 up, KV up)
- Health: `GET https://wordmarks-v2.pages.dev/api/v1/health` — 200 OK (fallback)
- Admin: `GET https://api.wordmarks.net/api/v1/admin/stats` — 401 (auth required)
- Static: `GET https://wordmarks.net` — 200 OK

The `wordmarks.net` domain serves the static site only. API calls MUST NOT use `wordmarks.net` due to the known GET routing bug (returns Next.js 404 for `/api/v1/*` paths).

## Cloudflare Resources

| Resource | Name | ID | Binding | Status |
|----------|------|----|---------|--------|
| Pages Project | wordmarks-v2 | 6bf68e48-a2af-4307-983d-efff898e769b | — | Active |
| D1 Database | wordmarks-db | 9c354852-9b71-4f13-abaf-c9a1a0bbd6e4 | DB | Active |
| KV Namespace | WORDMARKS_KV | 625572dce3d948ea8ebf927de238e718 | WORDMARKS_KV | Active |
| R2 Bucket | wordmarks-kb | — | KB_BUCKET | Active — Created 2026-08-26, wired 2026-08-26 |
| R2 Bucket | wordmarks-generated | — | GENERATED_BUCKET | Active — Created 2026-08-26, wired 2026-08-26 |

## Custom Domains

| Domain | Pages Project | Status | Purpose |
|--------|--------------|--------|---------|
| wordmarks-v2.pages.dev | wordmarks-v2 | Active | Default Pages domain (staging/backup) |
| api.wordmarks.net | wordmarks-v2 | **Active** | Canonical API — CNAME resolved 2026-08-26 |
| wordmarks.net | wordmarks-v2 | Active | Static site (has GET routing bug for /api/v1/*) |
| www.wordmarks.net | wordmarks | Active | Legacy project (separate) |

**api.wordmarks.net**: Pages custom domain registered (ID: 6c26e2d4-3dde-4af4-bc6e-dc00c57eb27a), CNAME record created 2026-08-26 via Cloudflare REST API using account API token. DNS record ID: `4630071805363df8877a7601e53dcd6c`. Status: Active.

## Secrets (via Cloudflare Pages)

| Secret | Purpose | Set via |
|--------|---------|---------|
| OPENAI_API_KEY | OpenAI API access | `wrangler pages secret put OPENAI_API_KEY --project-name=wordmarks-v2` |
| WORDMARKS_MCP_TOKEN | Auth token for MCP agents | `wrangler pages secret put WORDMARKS_MCP_TOKEN --project-name=wordmarks-v2` |

## D1 Schema

Tables: providers, settings, knowledge_items, generation_jobs, usage_counters, audit_events.

Run migration: `POST https://api.wordmarks.net/api/v1/db/migrate` (requires admin auth)

## Deployment

```bash
# Build static export
npm run build

# Deploy to Cloudflare Pages (production)
CLOUDFLARE_ACCOUNT_ID=99dd60debc042e9b615dd44472645e71 wrangler pages deploy out --project-name=wordmarks-v2 --branch=main
```

## DNS

- wordmarks.net CNAME -> wordmarks-v2.pages.dev (Proxied)
- api.wordmarks.net CNAME -> wordmarks-v2.pages.dev (Proxied)
- www.wordmarks.net CNAME -> wordmarks-v2.pages.dev (Proxied)

DNS records are NOT modified during routine deployments.

## Verification Evidence (2026-08-26 09:43 UTC)

| Test | Result | Details |
|------|--------|---------|
| Build | PASS | TypeScript OK, 6 static pages generated |
| Lint | PASS (3 pre-existing warnings) | 2 setState-in-effect, 1 `<a>` vs `<Link>` |
| Health (api.wordmarks.net) | 200 OK | `{"ok":true,"database":"up","kv":"up","r2_kb":"up","r2_generated":"up"}` |
| Health (e89b8bcc) | 200 OK | Production deployment verified |
| Admin (no auth, api) | 401 | Auth required, defense-in-depth working |
| Static site (wordmarks.net) | 200 OK | Serving |
| api.wordmarks.net DNS | PASS | CNAME resolved, health 200 OK |
| Secrets in source | PASS | No API keys, tokens, or env vars in source |
| Secrets in build output | PASS | No `sk-*`, `NEXT_PUBLIC_*`, or compromised keys |
| R2 bindings | COMPLETE | KB_BUCKET + GENERATED_BUCKET in wrangler.toml, wired in code |
| Cloudflare Access | COMPLETE | 2 self-hosted apps configured |

## Manual Actions Required

### Rotate exposed OpenAI API key
The previously compromised key was found in `.env.local`. Generate a new key at https://platform.openai.com and set it:
```bash
wrangler pages secret put OPENAI_API_KEY --project-name=wordmarks-v2
```
