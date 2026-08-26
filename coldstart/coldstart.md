# Coldstart -- Wordmarks.net

## CURRENT STATE (2026-08-26)

**All infrastructure is COMPLETE.** The system is live and serving production traffic.

### Services

| Service | Endpoint | Status |
|---------|----------|--------|
| Static site | https://wordmarks.net | UP |
| API (canonical) | https://api.wordmarks.net | UP |
| API (fallback) | https://wordmarks-v2.pages.dev | UP |
| Health check | GET https://api.wordmarks.net/api/v1/health | 200 OK |

### Health Response

```json
{"ok":true,"database":"up","kv":"up","r2_kb":"up","r2_generated":"up"}
```

### Cloudflare Resources

| Resource | Name | ID | Binding | Status |
|----------|------|----|---------|--------|
| Pages Project | wordmarks-v2 | `6bf68e48-a2af-4307-983d-efff898e769b` | -- | Active |
| D1 Database | wordmarks-db | `9c354852-9b71-4f13-abaf-c9a1a0bbd6e4` | DB | Active |
| KV Namespace | WORDMARKS_KV | `625572dce3d948ea8ebf927de238e718` | WORDMARKS_KV | Active |
| R2 Bucket | wordmarks-kb | -- | KB_BUCKET | Active |
| R2 Bucket | wordmarks-generated | -- | GENERATED_BUCKET | Active |

### Authentication

- Cloudflare Access: 2 self-hosted apps configured
  - `wordmarks.net/admin/*` (Policy: `b52d566e-0f94-437c-9345-c6a2173e7cef`)
  - `api.wordmarks.net/api/v1/admin/*` (Policy: `22b012a3-2c8e-4d95-8da0-954c109d4d9d`)
  - Policy: Allow, Email: n311311@gmail.com
- API auth: `WORDMARKS_MCP_TOKEN` bearer token for non-interactive agents
- Admin endpoints return 401 unauthenticated (defense-in-depth verified)

### Secrets

| Secret | Purpose | Status |
|--------|---------|--------|
| `OPENAI_API_KEY` | OpenAI API access | SET (needs rotation -- see manual action below) |
| `WORDMARKS_MCP_TOKEN` | Auth token for API/MCP agents | SET |

### Remaining Manual Action

**Rotate exposed OpenAI API key.** The previously compromised key was found in `.env.local` and must be replaced at https://platform.openai.com. Then update the secret:

```bash
wrangler pages secret put OPENAI_API_KEY --project-name=wordmarks-v2
```

### Latest Deployment

- Deploy ID: `e89b8bcc` (production, main branch)
- Deploy URL: https://e89b8bcc.wordmarks-v2.pages.dev

### Documentation

- [README.md](../README.md) -- Project overview, quick start, API usage
- [INFRA.md](../INFRA.md) -- Infrastructure details, DNS, resources
- [SECURITY.md](../SECURITY.md) -- Secrets, auth, rate limiting
- [RUNBOOK.md](../RUNBOOK.md) -- Health checks, common issues, rollback
- [CHANGELOG-INFRA.md](../CHANGELOG-INFRA.md) -- Infrastructure change history
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) -- Architecture overview

---

## Session History

---

### 2026-08-26 -- R2 Wired + Cloudflare Access Configured

**Status:** ALL COMPLETE

**What Was Done**

1. R2 Object Storage wired into application
   - Bindings: `KB_BUCKET` -> wordmarks-kb, `GENERATED_BUCKET` -> wordmarks-generated
   - health.ts: R2 health checks
   - knowledge-base.ts: R2 upload/fetch/delete with base64 fallback
   - [action].ts: R2 archival of generated logos
   - _middleware.ts: R2 types in Env interface

2. Deployed to production
   - Deploy ID: `e89b8bcc-20e` (production, main branch)

3. Cloudflare Access configured
   - Wordmarks Admin app: wordmarks.net/admin/*
   - Wordmarks Admin API app: api.wordmarks.net/api/v1/admin/*
   - Policy: Allow, Email: n311311@gmail.com

**Verification Results (2026-08-26 09:43 UTC)**

| Test | Result |
|------|--------|
| Health (api.wordmarks.net) | 200 OK |
| Admin (no auth, api) | 401 |
| Static site (wordmarks.net) | 200 OK |
| R2 bindings | COMPLETE |
| Secrets scan | PASS |
| Cloudflare Access | COMPLETE |

---

### 2026-08-26 -- CNAME Resolution & DNS Fix

**Status:** 1 of 3 BLOCKERS RESOLVED (R2 and Access later resolved above)

**What Was Done**

1. DNS CNAME for api.wordmarks.net -- Created via Cloudflare REST API
   - DNS Record ID: `4630071805363df8877a7601e53dcd6c`
   - CNAME: `api.wordmarks.net` -> `wordmarks-v2.pages.dev` (Proxied)

2. Fixed wordmarks.net CNAME -- Removed deployment hash
3. Fixed www.wordmarks.net CNAME -- Removed deployment hash

---

### 2026-08-26 -- Retry: Cloudflare MCP Setup Attempt

**Status:** DEPLOYED (3 blockers confirmed, all later resolved)

Attempted via wrangler CLI (v4.103.0). R2, CNAME, and Access all blocked at this time. All resolved in subsequent sessions.

---

### 2026-08-25 -- Production Hardening & Reliability

**Status:** DEPLOYED

Complete production hardening: server-side API boundary, authentication, rate limiting, D1 database, admin API, documentation.

---

### 2026-08-06 -- FIX: "unknown parameter response format" error

- **Status:** COMPLETED
- **Fix:** Added conditional response_format, parseJsonResponse, isOfficialOpenAI detection
- **Files:** lib/api.ts, wrangler.toml

### 2026-08-06 -- FIX: Failed to fetch error

- **Status:** COMPLETED
- **Fix:** Moved API key to NEXT_PUBLIC env var, refresh on every load
- **Files:** app/page.tsx, lib/api.ts, .env.local
