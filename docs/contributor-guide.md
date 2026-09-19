# Contributor guide

Cloudus is a place where builders leave with something shipped.

## Local setup

```bash
cd cloudus-src
npm install
cp .env.example .env   # if present; otherwise set DATABASE_URL and AUTH_* 
npm run db:generate
npm run dev
```

If env validation blocks you: `SKIP_ENV_VALIDATION=1 npm run dev`.

## Rules

- Preserve checkout, webhooks, RBAC, and Prisma models unless you are adding a backward-compatible field.
- Put new creator-facing screens in `src/app/(os)` and reuse `src/components/os`.
- Talk about principles in content. Never expose Merchant Capital or client IP.
- One hour, one shipped thing. Open a PR that a collaborator can demo in a Build Night.

## Tests

```bash
npm test
npm run typecheck
```
