# Al Ghaly Platform

Al Ghaly is a real-data-first business platform for digital marketing and digital services. The repository keeps the original local/self-hosted PostgreSQL path and adds a Cloudflare Free deployment path so the production version can run without a separate paid SaaS database.

## Deployment options

### Cloudflare Free (recommended for the current goal)

- Web: Next.js static export on Cloudflare Pages.
- API: Express.js on Cloudflare Workers.
- Database: Cloudflare D1.
- Small embedded files: D1 BLOBs up to 1 MB per file in the free-safe implementation.
- Source control: private GitHub repository.
- No PostgreSQL server is required for this path.

See `docs/CLOUDFLARE_FREE.md` for the exact setup.

### Local / self-hosted

- Web: Next.js / React / TypeScript.
- API: Express / TypeScript.
- Database: PostgreSQL + Prisma.
- Docker Compose for PostgreSQL and Redis.

## Platform capabilities

- Master Super Admin protection.
- Roles and permissions.
- Users, clients and employees.
- Services and public content.
- Projects, tasks and support tickets.
- Files, conversations and in-app notifications.
- CRM: leads, deals and activities.
- Application-creation requests and delivery stages.
- Dynamic settings, pages and custom fields.
- Reports and audit log.
- Optional billing module.

## Free-first rules

The Cloudflare deployment does not require a paid database or storage service. Workers Free currently provides 100,000 requests/day; D1 Free provides 5 million row reads/day, 100,000 row writes/day and 5 GB total storage. D1 Free also has 7-day Time Travel. Keep expensive polling and large uploads disabled in the free mode.

R2 is deliberately optional. Its current free tier includes 10 GB-month storage, 1 million Class A requests/month and 10 million Class B requests/month, with billing beyond the included tier. Do not enable it unless you accept that behavior.

## Secrets

Never commit passwords or API tokens. Cloudflare secrets are set with Wrangler. The Worker creates the Master Super Admin on first request from `MASTER_ADMIN_EMAIL`, `MASTER_ADMIN_PHONE`, and `MASTER_ADMIN_PASSWORD` secrets.
