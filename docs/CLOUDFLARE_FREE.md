# Al Ghaly — Cloudflare Free deployment

This repository now contains a Cloudflare-native deployment path intended for the free tier:

- Public/Admin web: Next.js static export -> Cloudflare Pages.
- API: Express.js -> Cloudflare Workers.
- Database: Cloudflare D1.
- Small file storage: D1 BLOBs up to 1 MB per uploaded file in free mode; larger files are stored as external URLs unless R2 is intentionally enabled.
- Source control: GitHub private repository.

## 1. Create the D1 database

```bash
npx wrangler d1 create alghaly-db
```

Copy the returned `database_id` into `apps/api-cloudflare/wrangler.jsonc`.

## 2. Apply the database schema

```bash
npx wrangler d1 migrations apply alghaly-db --remote
```

The migration is in `apps/api-cloudflare/migrations/0001_initial.sql`.

## 3. Add secrets

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put MASTER_ADMIN_EMAIL
npx wrangler secret put MASTER_ADMIN_PHONE
npx wrangler secret put MASTER_ADMIN_PASSWORD
```

The Worker bootstraps the Master Super Admin and baseline settings on first request. No password is stored in GitHub.

## 4. Deploy the API

```bash
npm --prefix apps/api-cloudflare install
npm run db:generate --silent
npm run cf:api:generate
npm run cf:api:typecheck
npm run cf:api:deploy
```

The API will be available on the Worker URL printed by Wrangler.

## 5. Configure Cloudflare Pages

Connect the GitHub repository to Cloudflare Pages and use:

Build command:

```text
npm run build:web
```

Build output directory:

```text
apps/web/out
```

Set this Pages environment variable before building:

```text
NEXT_PUBLIC_API_URL=https://YOUR-API-WORKER.workers.dev/api
```

## 6. Free-plan boundaries

Cloudflare Workers Free is limited to 100,000 requests/day. D1 Free includes 5 million rows read/day, 100,000 rows written/day, and 5 GB total storage. D1 Time Travel on Free is 7 days. Keep dashboard queries paginated and avoid large polling loops.

For file uploads, the free-safe implementation stores embedded files in D1 only up to 1 MB each. Do not enable R2 unless you accept its post-free-tier billing behavior.

## 7. GitHub

Keep the repository private. Never commit `.env`, `.dev.vars`, API tokens, Cloudflare account secrets, JWT secrets, or the Master Super Admin password.
