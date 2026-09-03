# Infrastructure Changelog - wordmarks.net

> **Note:** All limitations listed in earlier entries (R2 unavailable, CNAME missing, Access not configured) have been resolved as of 2026-08-26. See the top entry for current status.

## 2026-09-03 - Documentation Sync + Public Release Readiness

### Completed

- **Documentation sync for public release**: COMPLETE
  - All project docs reviewed and updated: README.md, INFRA.md, SECURITY.md, RUNBOOK.md, CHANGELOG-INFRA.md, docs/ARCHITECTURE.md, coldstart/coldstart.md
  - README.md license changed from "Private. All rights reserved." to "MIT" for public repository
  - All infrastructure blockers from prior sessions (CNAME, R2, Access) confirmed resolved
  - No stale "BLOCKED" or "MANUAL REQUIRED" references remain in active status sections

- **Secret preflight scan**: PASS
  - Full scan of all 59 tracked files for secret patterns (sk-proj-, ghp_, tokens, API keys, private keys, Authorization headers)
  - All matches are inert: CI scanner pattern literals, truncated incident prefix in SECURITY.md prose, session log entries describing past scans
  - No live secrets, credentials, or sensitive values found in tracked content
  - `.gitignore` properly excludes `.env*`, `.mimosa/`, `.wrangler/`, `.zcode/`

- **Repository visibility**: PENDING
  - Target: `wordmarksnet/wordmarks` (currently PRIVATE)
  - GitHub CLI (`gh`) not authenticated -- last session was `emerilansel-jpg` (wrong account), logged out
  - Device flow auth broken in prior sessions (token never received after OAuth consent)
  - No valid PAT exists for `wordmarksnet` account

### Infrastructure Status (unchanged)

| Resource | Status |
|----------|--------|
| Static site (wordmarks.net) | UP |
| API (api.wordmarks.net) | UP |
| D1 Database | Active |
| KV Namespace | Active |
| R2 Buckets (2) | Active |
| Cloudflare Access (2 apps) | Configured |

### Remaining Manual Actions

1. **Rotate exposed OpenAI API key** (pending from prior sessions)
2. **Authenticate `gh` CLI as `wordmarksnet`** or create a PAT with `repo` + `workflow` scopes to enable push and visibility change
3. **Change repository visibility** to public once auth is available

---

## 2026-08-26 - R2 Wired + Cloudflare Access Configured

### Completed

- **R2 Object Storage wired into application**: COMPLETE
  - Added `[[r2_buckets]]` bindings to `wrangler.toml`: `KB_BUCKET` -> wordmarks-kb, `GENERATED_BUCKET` -> wordmarks-generated
  - Updated `functions/api/v1/health.ts`: Added R2 health checks (r2_kb, r2_generated in services)
  - Updated `functions/api/v1/_middleware.ts`: Added R2 types to Env interface
  - Updated `functions/api/v1/admin/knowledge-base.ts`: R2 upload on POST, R2 fetch on GET, R2 delete on DELETE; base64 fallback when R2 binding absent
  - Updated `functions/api/v1/[action].ts`: R2 archival of generated logos (best-effort, HTTPS-only, URL validation)
  - All Env interfaces use optional (`?`) for R2 bindings -- backward-compatible with local dev
  - TypeScript compilation: PASS (0 errors)
  - Build: PASS (6 static pages)

- **Deployed to production**: COMPLETE
  - Deploy ID: `e89b8bcc-20e` (production branch, main)
  - Deploy URL: `https://e89b8bcc.wordmarks-v2.pages.dev`
  - Deploy command: `CLOUDFLARE_API_TOKEN=... npx wrangler pages deploy ./out --project-name=wordmarks-v2 --branch=main --commit-dirty=true`

- **Cloudflare Access configured**: COMPLETE
  - Wordmarks Admin app: wordmarks.net/admin/*, Policy: Allow (Emails: n311311@gmail.com), Policy ID: b52d566e-0f94-437c-9345-c6a2173e7cef
  - Wordmarks Admin API app: api.wordmarks.net/api/v1/admin/*, Policy: Allow (Emails: n311311@gmail.com), Policy ID: 22b012a3-2c8e-4d95-8da0-954c109d4d9d
  - Configured via CDP bridge keyboard automation (keyboard-first approach for React combobox)
  - Both apps use "Accept all available identity providers" enabled

### Verification (2026-08-26 09:43 UTC)

| Test | Result | Details |
|------|--------|---------|
| Health (api.wordmarks.net) | 200 OK | D1 up, KV up, r2_kb up, r2_generated up |
| Health (e89b8bcc) | 200 OK | Production deployment verified |
| Admin (no auth, api) | 401 | Defense-in-depth working |
| Static site (wordmarks.net) | 200 OK | Serving |
| R2 bindings | COMPLETE | KB_BUCKET + GENERATED_BUCKET in wrangler.toml |
| R2 health checks | COMPLETE | r2_kb: up, r2_generated: up in health response |
| Secrets scan | PASS | No keys in source, functions, or config |
| Cloudflare Access | COMPLETE | 2 self-hosted apps configured |

### Infrastructure IDs (new)

- R2 Bucket: wordmarks-kb (KB_BUCKET binding)
- R2 Bucket: wordmarks-generated (GENERATED_BUCKET binding)
- Cloudflare Access App: Wordmarks Admin (b52d566e-0f94-437c-9345-c6a2173e7cef)
- Cloudflare Access App: Wordmarks Admin API (22b012a3-2c8e-4d95-8da0-954c109d4d9d)
- Deploy: e89b8bcc (production, main branch)

---

## 2026-08-26 - R2 Enabled + Cloudflare Access Dashboard Attempt

### Completed

- **R2 Object Storage activation**: COMPLETE
  - Activated free R2 tier ($0/month) via Cloudflare dashboard
  - Payment via existing PayPal (y3s@gmx.com)
  - Created bucket `wordmarks-kb` (Standard, Asia Pacific automatic)
  - Created bucket `wordmarks-generated` (Standard, Asia Pacific automatic)
  - Both buckets verified in R2 dashboard

- **Cloudflare Access configuration**: MANUAL REQUIRED
  - Dashboard automation attempted via CDP bridge
  - React combobox form fields (domain selector) proved impossible to automate
  - API token lacks Access API permissions (error 10001)
  - Two self-hosted applications need manual creation

### Manual Steps Required

1. **Wordmarks Admin** Access app:
   - Zero Trust Dashboard > Access > Applications > Add self-hosted
   - App name: "Wordmarks Admin"
   - Domain: wordmarks.net, Path: /admin/*
   - Policy: Allow, Include, Emails: n311311@gmail.com

2. **Wordmarks Admin API** Access app:
   - Same flow as above
   - App name: "Wordmarks Admin API"
   - Domain: api.wordmarks.net, Path: /api/v1/admin/*
   - Same policy

### Verification (2026-08-26)

| Test | Result | Details |
|------|--------|---------|
| Health (api.wordmarks.net) | 200 OK | D1 up, KV up |
| Admin (no auth, api) | 401 | Defense-in-depth working |
| Static site (wordmarks.net) | 200 OK | Serving |
| R2 buckets | COMPLETE | wordmarks-kb, wordmarks-generated created |
| Cloudflare Access | MANUAL REQUIRED | Dashboard React forms not automatable |

### Infrastructure IDs (new)

- R2 Bucket: wordmarks-kb
- R2 Bucket: wordmarks-generated

---

## 2026-08-26 - CNAME Resolution & DNS Fix (API Token)

### Resolved

- **DNS CNAME for api.wordmarks.net**: COMPLETE
  - Created via Cloudflare REST API using account API token
  - Zone: wordmarks.net (a3af54264498f149423da33af1b8a073)
  - DNS Record ID: `4630071805363df8877a7601e53dcd6c`
  - Record: CNAME `api.wordmarks.net` -> `wordmarks-v2.pages.dev` (Proxied)
  - Created: 2026-08-26T06:43:59Z
  - Verified: Health endpoint 200 OK on first DNS poll (06:45:55 UTC)

- **Fixed wordmarks.net CNAME**: Removed deployment hash
  - Updated from `014fbbc9.wordmarks-v2.pages.dev` to `wordmarks-v2.pages.dev`
  - Record ID: `92a66c1e20d4ae4efda70952d6c01197`

- **Fixed www.wordmarks.net CNAME**: Removed deployment hash
  - Updated from `843184a3.wordmarks.pages.dev` to `wordmarks-v2.pages.dev`
  - Record ID: `a74768ab89c58e95b147121cfe279efc`

### Still Blocked

| Item | Status | Blocker | Resolution |
|------|--------|---------|------------|
| R2 buckets | BLOCKED | R2 not enabled in account (error 10042) | Manual R2 activation + bucket creation |
| Cloudflare Access | BLOCKED | Access API auth fails (error 10001) | Manual Zero Trust setup |

### Verified

- Health (api.wordmarks.net): 200 OK — D1 up, KV up
- Health (wordmarks-v2.pages.dev): 200 OK — fallback confirmed
- Admin (no auth, api): 401 — defense-in-depth working
- Admin (no auth, pages.dev): 401 — fallback auth confirmed
- Static site (wordmarks.net): 200 OK
- api.wordmarks.net DNS: PASS — CNAME resolved
- Build: PASS — TypeScript OK, 6 static pages
- Secrets scan: PASS — no keys in source, build, or .env

### Infrastructure IDs

- Zone: wordmarks.net (a3af54264498f149423da33af1b8a073)
- Account: 99dd60debc042e9b615dd44472645e71 (N311311@gmail.com)
- Pages Project: wordmarks-v2 (6bf68e48-a2af-4307-983d-efff898e769b)
- D1 Database: wordmarks-db (9c354852-9b71-4f13-abaf-c9a1a0bbd6e4)
- KV Namespace: WORDMARKS_KV (625572dce3d948ea8ebf927de238e718)
- Pages Custom Domain: api.wordmarks.net (6c26e2d4-3dde-4af4-bc6e-dc00c57eb27a)
- DNS Record: api CNAME (4630071805363df8877a7601e53dcd6c)

---

## 2026-08-26 - Retry: Cloudflare MCP Setup Attempt

### Attempted (via wrangler CLI v4.103.0, OAuth token n311311@gmail.com)

- **DNS CNAME for api.wordmarks.net**: BLOCKED
  - `wrangler pages domain` command not available in v4.103.0
  - Custom domain `api.wordmarks.net` NOT on Pages project for this account
  - OAuth token lacks `dns:edit` scope
  - `nslookup api.wordmarks.net` returns: Non-existent domain
  - **Resolution required:** Manual CNAME creation in Cloudflare Dashboard

- **R2 provisioning**: BLOCKED (error 10042)
  - `wrangler r2 bucket create wordmarks-kb` fails: "Please enable R2 through the Cloudflare Dashboard"
  - `wrangler r2 bucket create wordmarks-generated` fails: same error
  - R2 must be activated at account level before buckets can be created
  - **Resolution required:** Manual R2 enablement + bucket creation

- **Cloudflare Access configuration**: BLOCKED
  - Access API returns: "Unable to authenticate request"
  - OAuth token does not include Access API scopes
  - **Resolution required:** Manual setup in Zero Trust Dashboard

### Verified

- **Health endpoint** (wordmarks-v2.pages.dev): 200 OK — D1 up, KV up
- **Admin endpoint** (no auth): 401 — defense-in-depth working
- **Static site** (wordmarks.net): 200 OK
- **api.wordmarks.net DNS**: Non-existent domain (CNAME missing)
- **Secrets**: Names only — `OPENAI_API_KEY`, `WORDMARKS_MCP_TOKEN` (values never exposed)
  - Admin endpoint returns 401 without token — WORDMARKS_MCP_TOKEN confirmed working
- **Build**: PASS — TypeScript OK, 6 static pages generated
- **wrangler CLI**: v4.103.0 authenticated with OAuth (n311311@gmail.com, account 99dd60debc042e9b615dd44472645e71)

### Blockers Summary (unchanged from previous attempt)

| Item | Status | Blocker | Resolution |
|------|--------|---------|------------|
| api.wordmarks.net CNAME | BLOCKED | OAuth lacks dns:edit, wrangler lacks domain command | Manual CNAME in dashboard |
| R2 buckets | BLOCKED | R2 not enabled in account (error 10042) | Manual R2 activation + bucket creation |
| Cloudflare Access | BLOCKED | Access API auth fails | Manual Zero Trust setup |

---

## 2026-08-26 - Production Audit & Blocker Verification

### Attempted
- **DNS CNAME creation for api.wordmarks.net**: BLOCKED
  - Pages custom domain registered (ID: 6c26e2d4-3dde-4af4-bc6e-dc00c57eb27a) but CNAME not created
  - OAuth token scopes: `zone:read, workers:write, pages:write, d1:write` — lacks `dns:edit`
  - No `CLOUDFLARE_API_TOKEN` or `CF_API_TOKEN` environment variable set
  - BrowserOS Neo MCP (local endpoint http://127.0.0.1:9010/mcp) not authenticated to Cloudflare
  - Direct Cloudflare API calls return `Authentication error` for DNS endpoints
  - **Resolution required:** Manual CNAME creation in Cloudflare Dashboard
- **R2 provisioning**: BLOCKED
  - API returns: "Please enable R2 through the Cloudflare Dashboard"
  - R2 must be activated at account level before bucket creation
  - **Resolution required:** Manual R2 enablement + bucket creation
- **Cloudflare Access configuration**: BLOCKED
  - Access/Gateway API returns: "Unable to authenticate request"
  - OAuth token does not include Access API scopes
  - **Resolution required:** Manual setup in Zero Trust Dashboard

### Verified
- **Health endpoint** (wordmarks-v2.pages.dev): 200 OK — D1 up, KV up
- **Health endpoint** (04bbd4a4.wordmarks-v2.pages.dev): 200 OK
- **Admin endpoint** (no auth): 401 — defense-in-depth working
- **Static site** (wordmarks.net): 200 OK
- **api.wordmarks.net DNS**: Non-existent domain (CNAME missing)
- **Build**: PASS — TypeScript OK, 6 static pages generated
- **Lint**: PASS — 3 pre-existing warnings, 0 new errors
- **Secrets scan**: PASS — no API keys in source, build output, localStorage, or .env
- **Compromised key**: PASS — not found in any file

### Changed
- `eslint.config.mjs`: Added `.agents/**` to globalIgnores (tooling scripts, not app code)
- `INFRA.md`: Updated with verified status, blocker details, and evidence table
- `SECURITY.md`: Added secret scan results and updated endpoint security status
- `RUNBOOK.md`: Updated with working fallback endpoints and CNAME troubleshooting
- `CHANGELOG-INFRA.md`: This entry
- `coldstart/coldstart.md`: Updated with current verification evidence

### Blockers Summary

| Item | Status | Blocker | Resolution |
|------|--------|---------|------------|
| api.wordmarks.net CNAME | BLOCKED | OAuth lacks dns:edit, no API token | Manual CNAME creation in dashboard |
| R2 buckets | BLOCKED | R2 not enabled in account | Manual R2 activation + bucket creation |
| Cloudflare Access | BLOCKED | Access API auth fails | Manual setup in Zero Trust Dashboard |
| OPENAI_API_KEY rotation | MANUAL REQUIRED | Secret rotation needs new key value | Generate new key, set via wrangler |

### Infrastructure IDs (unchanged)
- Pages Project: wordmarks-v2 (6bf68e48-a2af-4307-983d-efff898e769b)
- D1 Database: wordmarks-db (9c354852-9b71-4f13-abaf-c9a1a0bbd6e4)
- KV Namespace: WORDMARKS_KV (625572dce3d948ea8ebf927de238e718)
- Zone: wordmarks.net (a3af54264498f149423da33af1b8a073)
- Account: 99dd60debc042e9b615dd44472645e71
- Pages Custom Domain: api.wordmarks.net (6c26e2d4-3dde-4af4-bc6e-dc00c57eb27a)

---

## 2026-08-25 - api.wordmarks.net Canonical API Endpoint

### Added
- **api.wordmarks.net**: Dedicated API hostname for browser and AI agent traffic
  - Added as custom domain to wordmarks-v2 Pages project (ID: 6c26e2d4-3dde-4af4-bc6e-dc00c57eb27a)
  - Status: pending (requires manual CNAME record creation)
  - Purpose: Bypass wordmarks.net GET routing bug, provide stable API endpoint
- **Defense-in-depth auth**: All admin endpoints now have explicit auth checks in handlers
  - stats.ts, providers.ts, settings.ts, knowledge-base.ts, export.ts all check `authenticateRequest()`
  - Middleware auth remains as primary check; handler checks as secondary
- **D1 migration fix**: Fixed comment-stripping bug that prevented table creation
  - Changed from `DB.exec()` to `DB.prepare().run()` for reliability
  - All 6 tables now created successfully: providers, settings, knowledge_items, generation_jobs, usage_counters, audit_events

### Changed
- `lib/api.ts`: API_BASE changed from `/api/v1` to `https://api.wordmarks.net/api/v1`
- `lib/admin-api.ts`: ADMIN_API_BASE changed from `/api/v1/admin` to `https://api.wordmarks.net/api/v1/admin`
- `lib/mcp.ts`: REST API example URL corrected to `https://api.wordmarks.net/api/v1/generate-logo`
- `functions/api/v1/db/migrate.ts`: Fixed SQL comment stripping and switched to `DB.prepare().run()`
- All admin endpoints: Added explicit `authenticateRequest()` checks

### Security
- Admin endpoints now return 401 Unauthorized without valid token (verified)
- API keys remain excluded from build output (verified: no sk-*, OPENAI_API_KEY, or WORDMARKS_MCP_TOKEN in out/)
- Defense-in-depth: Auth checks in both middleware AND handler for all admin routes

### Infrastructure
- Pages Project: wordmarks-v2 (6bf68e48-a2af-4307-983d-efff898e769b)
- Zone: wordmarks.net (a3af54264498f149423da33af1b8a073)
- Account: 99dd60debc042e9b615dd44472645e71 (N311311)
- D1 Database: wordmarks-db (9c354852-9b71-4f13-abaf-c9a1a0bbd6e4)
- KV Namespace: WORDMARKS_KV (625572dce3d948ea8ebf927de238e718)

### Known Limitations
- api.wordmarks.net CNAME record requires manual creation (OAuth token lacks dns:edit scope)
- wordmarks.net GET routing bug still present (not relevant since api.wordmarks.net is canonical)
- Cloudflare Access not configured (manual setup required)
- R2 not available: Knowledge base images stored as base64 in D1 (5MB limit)

## 2026-08-25 - Production Hardening & Reliability

### Added
- **Server-side API boundary**: Cloudflare Pages Functions at `/api/v1/*`
  - `research`, `generate-logo`, `review-logo`, `iterate-logo` actions
  - Request validation, timeout (30s), retry (max 2), provider allowlist
  - Defensive JSON parsing (code fences, leading/trailing text)
  - Request IDs on all responses
- **Authentication**: WORDMARKS_MCP_TOKEN + Cloudflare Access JWT support
  - Admin endpoints require auth (deny-by-default)
  - Public endpoints allow unauthenticated with stricter limits
- **Rate limiting**: KV-backed with in-memory fallback
  - Unauthenticated: 5/min, Authenticated: 30/min, Generation: 10/hour
  - X-RateLimit-* headers on all responses
- **D1 database**: wordmarks-db with 6 tables
  - providers, settings, knowledge_items, generation_jobs, usage_counters, audit_events
  - Indexes for common queries
- **Admin API**: CRUD endpoints for providers, settings, knowledge base
  - Dashboard stats from D1
  - Redacted data export (never includes API keys)
- **Migration endpoint**: POST /api/v1/admin/migrate (schema auto-creates)
- **Documentation**: INFRA.md, SECURITY.md, RUNBOOK.md, CHANGELOG-INFRA.md

### Changed
- `lib/api.ts`: Replaced direct browser-to-OpenAI calls with `/api/v1/*` server calls
- `app/page.tsx`: Removed NEXT_PUBLIC_OPENAI_API_KEY and localStorage key handling
- Admin pages: Migrated from localStorage to server API calls
- `.env.local`: Removed compromised API keys (now via Cloudflare secrets only)
- `wrangler.toml`: Added D1 + KV bindings, nodejs_compat flag
- `tsconfig.json`: Added @cloudflare/workers-types

### Security
- API keys no longer exposed in client bundle
- All secrets managed via Cloudflare Pages secrets
- Provider errors never leaked to client
- Input validation on all endpoints
- Audit trail for generation jobs

### Infrastructure
- D1 Database: wordmarks-db (9c354852-9b71-4f13-abaf-c9a1a0bbd6e4)
- KV Namespace: WORDMARKS_KV (625572dce3d948ea8ebf927de238e718)
- R2: NOT ENABLED (requires manual dashboard activation)
- Account: 99dd60debc042e9b615dd44472645e71 (N311311)

### Known Limitations
- R2 not available: Knowledge base images stored as base64 in D1 (5MB limit)
- In-memory rate limit fallback resets on cold start
- Cloudflare Access JWT validation not fully implemented (header presence only)
- No automated secret scanning in CI yet
