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

### 2026-08-26 -- GitHub Repo Push + Rafter Full Scan (E2E)

**Status:** IN PROGRESS

- **Step 1 DONE:** Sessions verified via CDP (screenshots cdp-gh-session.png / cdp-rafter-session.png). GitHub logged in as `wordmarksnet` (meta user-login confirmed; 0 repos). Rafter dashboard shows "Welcome, wordmarksnet!" (onboarding modal + cookie banner present).
- **Step 2 DONE:** Committed `docs: coldstart update` -> HEAD `b4b9394` (parent `e93c18f`). Secret grep (`sk-proj-|sk-ant-|cfut_|ghp_`) over committed tree (excl. node_modules/.next/out/.wrangler/.mimosa): only ALLOWED matches -- ci.yml scanner pattern literals, truncated incident prefix in SECURITY.md, prose pattern reference in coldstart.md. No real secrets.
- **Step 3a DONE:** Private repo created in browser: https://github.com/wordmarksnet/wordmarks (empty, no README/gitignore/license; screenshots cdp-gh-new-repo.png -> cdp-gh-created2.png).
- **Step 3 DONE:**
  - Repo created: https://github.com/wordmarksnet/wordmarks (PRIVATE, was empty; screenshots cdp-gh-created2.png).
  - PAT v1 (repo scope only, 7d): push REJECTED by GitHub -- repo contains `.github/workflows/ci.yml`, which requires `workflow` scope. Deleted immediately (verified list empty).
  - PAT v2 (repo + workflow scopes, 7-day expiry, note `temp-push-wordmarks-20260826-v2`): push SUCCEEDED. Token value handled ONLY via in-pipeline shell variable (page eval -> env var -> git http.extraheader Basic auth); never printed/logged/written. `credential.helper=` overridden so Git Credential Manager never stored it.
  - Remote verified: `git ls-remote` refs/heads/main = `b4b9394` (docs: coldstart update; parent e93c18f). Browser confirms main branch, 3 commits, full file tree.
  - PAT v2 REVOKED via settings; tokens list verified EMPTY ("No personal access token created", screenshot cdp-gh-tokens-revoked.png). `.git/config` grep for token patterns: CLEAN. No Windows credman trace.
  - Note: local branch renamed master -> main. Commit author avatar shows old account `emerilansel-jpg` (cosmetic; update git user email later if desired).
- **Step 4 (in progress):** Rafter Security GitHub App installed on wordmarksnet with ONLY wordmarksnet/wordmarks selected (screenshots cdp-gh-app-install2 -> cdp-gh-app-selected). Repo+branch selected in dashboard (Fast mode = free tier; Plus is paid). Free scan confirmed unused beforehand ("No scans yet") then SPENT: scan submitted 2026-08-26 8:40 PM, status=processing. Banner confirms next free scan in 30 days. Polling for completion.
- **Next:** poll scan to completion, retrieve severity summary (no secret values in docs), final report.

---

### 2026-08-26 -- GitHub Signup Email Switch + Rafter.so Recon + Rafter CLI Install

**Status:** ALL 3 TASKS COMPLETE (both browser tasks paused BY DESIGN at safe boundaries)

**What Was Done**

1. TASK A -- GitHub signup tab (tab [0], https://github.com/signup, LEFT OPEN):
   - Email field replaced: `github@teak.email` -> `n311311+github@gmail.com` (green validation check visible, no errors).
   - This SUPERSEDES the teak.email routing blocker from the earlier session (no longer relevant; gmail receives verification mail directly).
   - Username `wordmarksnet` intact with green availability check. Password EMPTY. `Create account` NOT clicked (leads to captcha). Country=Indonesia, Copilot checkbox checked (pre-existing defaults, untouched).
   - Final screenshot: `D:\Claude Cowork\Research site for press releases\.agents\skills\edge-browser-default\screenshots\cdp-github-after-email.png`

2. TASK B -- Rafter.so signup recon (tab [2], restored to https://rafter.so/):
   - Homepage: `Sign in with GitHub` button + `Start Free Scan` / `Dashboard` links -> `/dashboard`.
   - `/dashboard` AUTO-REDIRECTS to GitHub OAuth (`github.com/login?client_id=Iv23liULzr6oasdYpdMf...` Supabase callback). NO email/password form exists on rafter.so.
   - CONCLUSION: Rafter signup is GitHub-OAuth-only -> QUEUED behind completing the GitHub account (TASK A tab). No credentials entered, no OAuth consent given.
   - FAQ (free plan): free tier = 1 scan/month, full findings + fix recommendations, no credit card. Agent security features (secret scanning, command interception, pre-commit hooks) free and work offline.
   - Screenshots: `cdp-rafter-dashboard.png` (OAuth redirect), `cdp-rafter-faq.png` (free plan answer), same screenshots dir.

3. TASK C -- Rafter CLI installed locally (no account needed):
   - `npm install -g @rafter-security/cli` -> version **0.10.0** (148 packages).
   - Commands inventoried via `rafter --help`: run, get, usage, sites, scan, secrets, agent, skill, ci, hook, mcp, policy, docs, issues, brief, notify, report.
   - `rafter agent init` NOT run (per instruction).
   - Local offline scan run: `rafter secrets "D:/Claude Cowork/Logo Maker" --json --no-auto-update` -> scan_mode=local, 1 finding: package-lock.json:5058 "AWS Secret Access Key" = **FALSE POSITIVE** (npm sha512 integrity SRI hash, verified by inspection).
   - Free/offline (no API key): `secrets`, `agent scan/exec/status/verify/list`, hooks, `skill review`, `policy`, `mcp`, `brief`, `report` (local input).
   - Needs account + RAFTER_API_KEY (remote): `run`/`scan` (full SAST/SCA + agentic triage), `get`, `usage`, `sites` (live-app monitoring), `notify`, `issues`.

**Next Manual Steps (user)**

1. In the open GitHub signup tab: type a password, solve the human-verification puzzle, click `Create account`; confirm verification email at n311311+github@gmail.com.
2. Once GitHub account exists: complete Rafter signup in tab [2] via `Sign in with GitHub` (OAuth will then succeed), or run `rafter agent init` to wire agent security.
3. Optional: `git remote add origin <new-repo-url>` and push baseline commit `e93c18f`.

---

### 2026-08-26 -- Git Baseline Commit + teak.email Routing Check + GitHub Signup (Paused)

**Status:** ALL 3 TASKS COMPLETE (GitHub signup paused BY DESIGN before human-verification step)

**What Was Done**

1. Cloudflare read-only check (zone `teak.email`, id `c581403864e1bcdd8269c7754b3d7b80`, status active):
   - Email Routing: `enabled=false`, `status=unconfigured`
   - MX records: count = 0 (none exist)
   - **BLOCKER for signup:** `github@teak.email` cannot receive GitHub's verification email until Email Routing is enabled (this auto-provisions MX records) and a routing address/rule for `github@teak.email` exists.

2. Git baseline commit:
   - Hash: `e93c18ffb0e4369b37007373b916a9e2c00c103d` (`e93c18f`)
   - Message: `wordmarks.net production hardening: server-side API, R2/D1/KV, Access, docs`
   - 53 files committed. Working tree clean after commit.
   - Secret safety verified BEFORE staging: `.gitignore` covers `.env*` (line 34); `.env.local` NOT in index; full index content scan for `sk-proj-|sk-ant-|cfut_` returned only ALLOWED placeholder matches (scanner pattern literals in `.github/workflows/ci.yml`; truncated prefix reference in SECURITY.md incident note).
   - New `.gitignore` exclusions added for tool/session state: `.mimosa/`, `.wrangler/`, `.zcode/`. Reason: `.mimosa/hook-state` baselines embed snapshots of workspace files including secrets.
   - NOT pushed (no remote yet; new-account credentials pending).

3. GitHub signup via user's Edge CDP bridge (tab LEFT OPEN at https://github.com/signup):
   - No active session detected (old account emerilansel-jpg NOT logged in) -- sign-out unnecessary.
   - Filled: email `github@teak.email` (client validation green check), username `wordmarksnet` (no availability error shown).
   - Password left EMPTY per instruction; `Create account` NOT clicked (clicking it leads to the captcha puzzle).
   - UI note: current GitHub signup is a single-page form (Email+Password+Username all visible). There is NO per-step Continue button anymore.

**Next Manual Steps (user)**

1. Cloudflare dashboard -> teak.email -> Email -> Email Routing: enable it (auto-adds MX), verify a destination inbox, add catch-all or address rule for `github@teak.email`.
2. In the still-open Edge tab: type a password, complete the human-verification puzzle, click `Create account`, then confirm the verification email arrives at `github@teak.email`.
3. Once the new GitHub account exists: `git remote add origin <url>` and push commit `e93c18f`.

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
