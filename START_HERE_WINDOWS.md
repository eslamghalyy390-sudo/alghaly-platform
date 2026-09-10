# Al Ghaly Platform — Complete Cloudflare Free + GitHub Setup (Windows)

This guide deploys the web platform using the project in this ZIP:
- GitHub: private source repository
- Cloudflare Pages: web UI
- Cloudflare Workers: API
- Cloudflare D1: database

No paid SaaS database is required for this deployment path.

## 0) Before you start

Install:
1. Node.js LTS: https://nodejs.org/
2. Git for Windows: https://git-scm.com/download/win
3. A GitHub account.
4. A Cloudflare account.

Use PowerShell or Windows Terminal.

## 1) Extract the ZIP

Extract the ZIP to a simple folder, for example:

C:\Projects\AlGhaly

Open PowerShell in that folder.

## 2) Test the repository files

Run:

```powershell
node -v
git --version
npm -v
```

Then install the root dependencies:

```powershell
npm install
```

## 3) Create the private GitHub repository

On GitHub create a NEW private repository named:

`alghaly-platform`

Do not add a README, .gitignore, or license if the ZIP already contains them.

Then from the project folder run:

```powershell
git init
git branch -M main
git add .
git commit -m "Initial Al Ghaly Platform"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/alghaly-platform.git
git push -u origin main
```

Never commit `.env`, `.dev.vars`, passwords, JWT secrets, or API tokens.

## 4) Login to Cloudflare from the terminal

Run:

```powershell
npx wrangler login
```

A browser window will open. Authorize Wrangler with the same Cloudflare account that owns your project.

## 5) Create the D1 database

From the project folder run:

```powershell
npx wrangler d1 create alghaly-db
```

Cloudflare will return a database ID.

Open:

`apps\api-cloudflare\wrangler.jsonc`

Replace:

`REPLACE_WITH_YOUR_D1_DATABASE_ID`

with the real database ID.

Save the file.

Then commit and push:

```powershell
git add apps/api-cloudflare/wrangler.jsonc
git commit -m "Configure Al Ghaly D1 database"
git push
```

## 6) Apply the D1 schema

Run:

```powershell
npx wrangler d1 migrations apply alghaly-db --remote
```

When prompted, choose the remote/production database operation.

## 7) Configure Master Super Admin secrets

DO NOT put the password in GitHub.

Set the secrets interactively:

```powershell
npx wrangler secret put JWT_SECRET --config apps/api-cloudflare/wrangler.jsonc
npx wrangler secret put MASTER_ADMIN_EMAIL --config apps/api-cloudflare/wrangler.jsonc
npx wrangler secret put MASTER_ADMIN_PHONE --config apps/api-cloudflare/wrangler.jsonc
npx wrangler secret put MASTER_ADMIN_PASSWORD --config apps/api-cloudflare/wrangler.jsonc
```

Use your own strong password for `MASTER_ADMIN_PASSWORD`.

Recommended JWT secret: use a long random value (at least 32 characters).

The Worker creates the Master Super Admin automatically on first request if no master account exists.

## 8) Deploy the Cloudflare Worker API

Install the Worker dependencies:

```powershell
npm --prefix apps/api-cloudflare install
```

Generate the Prisma D1 client:

```powershell
npm run cf:api:generate
```

Run the type check:

```powershell
npm run cf:api:typecheck
```

Deploy:

```powershell
npm run cf:api:deploy
```

Cloudflare will print a URL similar to:

`https://alghaly-api.YOUR_SUBDOMAIN.workers.dev`

Copy this URL. The API base URL is:

`https://alghaly-api.YOUR_SUBDOMAIN.workers.dev/api`

## 9) Test the API before creating the website

Open in your browser:

`https://alghaly-api.YOUR_SUBDOMAIN.workers.dev/api/health`

You should receive JSON showing the API is healthy.

If `/api/health` is not reachable, stop here and fix the Worker before deploying Pages.

## 10) Create Cloudflare Pages from GitHub

In Cloudflare:

Workers & Pages → Create application → Pages → Import an existing Git repository.

Choose:

`YOUR_GITHUB_USERNAME/alghaly-platform`

Use these build settings:

- Production branch: `main`
- Root directory: repository root (leave blank/default)
- Build command:

```text
npm run build:web
```

- Build output directory:

```text
apps/web/out
```

Cloudflare Pages supports GitHub integration and automatically deploys new pushes to the connected branch.

## 11) Add the web API URL to Pages

In the Pages project settings, add the environment variable:

`NEXT_PUBLIC_API_URL`

Value:

`https://YOUR-WORKER.workers.dev/api`

Add it for the Production environment. Add the same variable to Preview only if you intend to use preview deployments.

Trigger a new Pages deployment.

## 12) Get your Pages URL

Cloudflare will provide a URL similar to:

`https://alghaly-platform.pages.dev`

Open it.

## 13) Lock CORS to your real Pages URL

After Pages is live, update the Worker secret:

```powershell
npx wrangler secret put CORS_ORIGIN --config apps/api-cloudflare/wrangler.jsonc
```

Enter your exact Pages URL, for example:

`https://alghaly-platform.pages.dev`

Then redeploy the Worker:

```powershell
npm run cf:api:deploy
```

Do not leave `CORS_ORIGIN=*` in the production environment unless you intentionally need it.

## 14) First login

Open the Pages URL and go to the login page.

Use the same Master Super Admin email/phone and password you entered in Cloudflare secrets.

The Worker bootstraps:
- Master Super Admin
- baseline permissions
- baseline services
- baseline settings

No demo password should be used.

## 15) Configure the platform from Super Admin

Inside the platform, configure:

1. Branding: name, logo, icon, colors, light/dark mode.
2. Contact details and social links.
3. Services and service statuses.
4. Roles and permissions.
5. Employees.
6. Customers.
7. Pages and public content.
8. Custom fields.
9. Projects, tasks and support workflow.
10. CRM settings.
11. Application-request workflow.
12. Notifications and integrations as needed.
13. Billing only if you later want to enable it.

## 16) Important free-tier rules

Keep the first deployment conservative:

- Avoid high-frequency polling from the dashboard.
- Paginate large lists.
- Keep embedded D1 file uploads at or below the project's free-safe limit of 1 MB per file.
- Use external file URLs for larger files unless you intentionally configure R2.
- Do not add paid third-party APIs unless you knowingly want them.

Cloudflare Free limits change over time. Check the current Cloudflare pricing/limits page before enabling heavy workloads.

## 17) Backups

D1 Free includes Time Travel for a limited retention period, but do not treat that as a full disaster-recovery strategy.

For an exported SQL snapshot, run from the repository root:

```powershell
npx wrangler d1 export alghaly-db --remote --output=alghaly-backup.sql
```

Store backup files outside the Git repository unless you intentionally encrypt and manage them securely.

## 18) Recommended Git workflow

Make development changes locally, test, then:

```powershell
git add .
git commit -m "Describe the change"
git push
```

Pages can automatically deploy from GitHub after pushes.

If you only changed the Worker, deploy the Worker after pushing:

```powershell
npm run cf:api:deploy
```

## 19) Final verification checklist

Before calling the platform production-ready, verify all of these manually:

- [ ] `/api/health` works.
- [ ] Login by email works.
- [ ] Login by phone works.
- [ ] Master Super Admin is active.
- [ ] Master Super Admin cannot be deleted.
- [ ] Master Super Admin cannot be demoted/deactivated by another admin.
- [ ] Admin/Manager/Supervisor permissions are enforced by the API.
- [ ] Clients CRUD works.
- [ ] Employees CRUD works.
- [ ] Services CRUD works.
- [ ] Projects CRUD works.
- [ ] Tasks CRUD works.
- [ ] Tickets CRUD works.
- [ ] CRM works.
- [ ] Application requests work.
- [ ] Pages and custom fields work.
- [ ] Files work within free-safe size limits.
- [ ] Notifications load.
- [ ] Audit log records sensitive actions.
- [ ] Reports export as intended.
- [ ] CORS is restricted to the real Pages domain.
- [ ] No secret/password is present in GitHub.
- [ ] A D1 backup/export procedure has been tested.

## 20) What this deployment does NOT provide automatically

A zero-cost deployment does not magically include paid communication providers. These may require separate third-party accounts or fees when you actually enable them:

- WhatsApp Business API messaging
- Commercial email delivery at scale
- SMS/OTP provider
- Large object storage beyond included free quotas
- Paid custom domains, if you choose a registrar/provider that charges for one

The core platform is designed so these are optional integrations rather than mandatory dependencies.

## 21) If a build fails

Run these commands locally and copy the full error text:

```powershell
npm install
npm run cf:api:generate
npm run cf:api:typecheck
npm --prefix apps/web install
npm --prefix apps/web run build
```

Also verify:
- Node.js is an LTS version.
- `wrangler login` is authorized.
- `apps/api-cloudflare/wrangler.jsonc` contains the real D1 ID.
- Cloudflare secrets were created.
- `NEXT_PUBLIC_API_URL` points to the Worker `/api` URL.

---

## Official references

Cloudflare Pages Git integration:
https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/

Cloudflare Pages build configuration:
https://developers.cloudflare.com/pages/configuration/build-configuration/

Cloudflare Workers secrets:
https://developers.cloudflare.com/workers/configuration/secrets/

Cloudflare D1:
https://developers.cloudflare.com/d1/

GitHub repositories:
https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories
