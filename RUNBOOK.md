# Runbook -- wordmarks.net

## Service Health Check

```bash
# Check static site
curl -s -o /dev/null -w "%{http_code}" https://wordmarks.net

# Check API (canonical)
curl -s https://api.wordmarks.net/api/v1/health

# Check API (fallback)
curl -s https://wordmarks-v2.pages.dev/api/v1/health

# Check admin stats (requires auth)
curl -s https://api.wordmarks.net/api/v1/admin/stats \
  -H "Authorization: Bearer $WORDMARKS_MCP_TOKEN"

# Check latest deployment directly
curl -s https://e89b8bcc.wordmarks-v2.pages.dev/api/v1/health
```

## Common Issues

### 401 Unauthorized on admin endpoints
- Ensure WORDMARKS_MCP_TOKEN secret is set
- Check token format: `Authorization: Bearer <token>`
- Verify token matches: `wrangler pages secret list --project-name=wordmarks-v2`

### 502 Provider Error
- Check OPENAI_API_KEY secret is set and valid
- Check provider is in allowlist
- Check OpenAI status: https://status.openai.com

### Rate Limited (429)
- Check X-RateLimit-Remaining header
- Wait for Retry-After seconds
- KV rate limits are per-IP (unauthenticated) or per-token (authenticated)

### D1 Migration Failed
- Run `POST https://api.wordmarks.net/api/v1/db/migrate` to re-apply schema
- Schema uses IF NOT EXISTS, safe to re-run

### Cold Start (Functions not responding)
- First request after idle may take 1-3 seconds
- Subsequent requests are fast
- Consider enabling "always on" in Cloudflare dashboard if needed

### api.wordmarks.net Not Resolving (RESOLVED 2026-08-26)

**Root cause:** CNAME record was missing. Pages custom domain was registered but DNS record not created.

**Resolution:** CNAME record created via Cloudflare REST API using account API token.
- DNS Record ID: `4630071805363df8877a7601e53dcd6c`
- Created: 2026-08-26T06:43:59Z
- Verified: Health endpoint returns 200 OK on first DNS poll

**Diagnosis (for future reference):**
```bash
nslookup api.wordmarks.net
# Expected: resolves to wordmarks-v2.pages.dev
```

## Deployment Rollback

```bash
# List recent deployments
CLOUDFLARE_ACCOUNT_ID=99dd60debc042e9b615dd44472645e71 \
  wrangler pages deployment list --project-name=wordmarks-v2

# Rollback to specific deployment
CLOUDFLARE_ACCOUNT_ID=99dd60debc042e9b615dd44472645e71 \
  wrangler pages deployment rollback <deployment-id> --project-name=wordmarks-v2
```

## Secret Rotation

```bash
# Rotate OpenAI key
wrangler pages secret put OPENAI_API_KEY --project-name=wordmarks-v2
# Enter new key when prompted

# Rotate MCP token
wrangler pages secret put WORDMARKS_MCP_TOKEN --project-name=wordmarks-v2
# Enter new token when prompted
```

## Database Backup

D1 data can be exported:
```bash
CLOUDFLARE_ACCOUNT_ID=99dd60debc042e9b615dd44472645e71 \
  wrangler d1 export wordmarks-db --output=backup.sql
```

## Monitoring

- Generation jobs: query `generation_jobs` table in D1
- Rate limit hits: check KV keys with `rl:` prefix
- Errors: check Cloudflare Pages function logs in dashboard

## Verified Endpoints (2026-08-26)

| Endpoint | URL | Auth | Status |
|----------|-----|------|--------|
| Health (canonical) | https://api.wordmarks.net/api/v1/health | None | 200 OK (D1 up, KV up, r2_kb up, r2_generated up) |
| Health (deploy) | https://e89b8bcc.wordmarks-v2.pages.dev/api/v1/health | None | 200 OK |
| Admin Stats (canonical) | https://api.wordmarks.net/api/v1/admin/stats | Required | 401 without token |
| Static Site | https://wordmarks.net | None | 200 OK |

### R2 Buckets

| Bucket | Binding | Purpose | Storage Class | Location |
|--------|---------|---------|---------------|----------|
| wordmarks-kb | KB_BUCKET | Knowledge base images | Standard | Asia Pacific (automatic) |
| wordmarks-generated | GENERATED_BUCKET | Generated logos | Standard | Asia Pacific (automatic) |

R2 bindings are configured in `wrangler.toml` and wired in code. Health endpoint reports `r2_kb: up, r2_generated: up`.

### Cloudflare Access

| Application | Destination | Policy | Policy ID |
|-------------|-------------|--------|-----------|
| Wordmarks Admin | wordmarks.net/admin/* | Allow (n311311@gmail.com) | b52d566e-0f94-437c-9345-c6a2173e7cef |
| Wordmarks Admin API | api.wordmarks.net/api/v1/admin/* | Allow (n311311@gmail.com) | 22b012a3-2c8e-4d95-8da0-954c109d4d9d |

### Verification Evidence

```
Health (api.wordmarks.net): HTTP 200 -- {"database":"up","kv":"up","r2_kb":"up","r2_generated":"up"}
Admin (no auth, api): HTTP 401
Static site: HTTP 200
R2 bindings: COMPLETE (KB_BUCKET, GENERATED_BUCKET)
Cloudflare Access: COMPLETE (2 self-hosted apps configured)
Secrets scan: PASS (no keys in source or config)
```
