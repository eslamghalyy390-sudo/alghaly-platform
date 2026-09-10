# Al Ghaly Cloudflare API

Cloudflare Workers + Express + D1 + Prisma driver adapter.

The worker is designed for the Cloudflare Free plan and does not require a separate PostgreSQL server.

Generate the Prisma D1 client from `packages/db/prisma/schema.cloudflare.prisma`, apply `migrations/0001_initial.sql` to D1, add Wrangler secrets, then deploy with Wrangler.
