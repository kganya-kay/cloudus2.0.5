# Cloudus repository audit

Scanned from [kganya-kay/cloudus2.0.5](https://github.com/kganya-kay/cloudus2.0.5.git) on 19 September 2026.

## Architecture

- **Stack:** T3 (`create-t3-app` 7.38.1): Next.js 15 App Router, TypeScript, tRPC 11, Prisma 6, NextAuth v5, Tailwind 3, TanStack Query.
- **Runtime:** React 18, `next dev --turbo`.
- **Database:** PostgreSQL via Prisma (`DATABASE_URL`). Models cover users, projects, shop, orders, rooms/bookings, creators, feed, events, careers, notifications, and admin review.
- **Auth:** JWT sessions. Credentials + Discord. Roles: `ADMIN`, `CARETAKER`, `SUPPLIER`, `CUSTOMER`, `DRIVER`. Super-admin emails bypass role checks.
- **Payments:** Paystack (primary), Stripe, Ozow. Webhooks in `src/app/api/webhooks` and project payment routes.
- **Uploads:** UploadThing.
- **AI:** `assistant.ask` via Vercel AI SDK (`generateText`).
- **CRM leftover:** `jsforce` is a dependency; calendar mentions Salesforce sync.

## Routing (before this refactor)

Public and commerce: `/`, `/shop`, `/shop/[itemId]`, `/projects`, `/feed`, `/rooms`, `/rentals`, `/laundry`, `/events`, `/careers`, `/calendar`, `/team`, `/Blog`.

Auth and profile: `/auth/login`, `/auth/register`, `/profile`, `/profile/[email]`.

Ops: `/admin/*`, `/suppliers/*`, `/drivers/*`, `/creators/dashboard`.

APIs: tRPC at `/api/trpc`, NextAuth, Paystack/Stripe/Ozow checkouts, UploadThing.

## UI audit

- Home is a large client `DashboardShell` with Headless UI + MUI buttons.
- Almost every page copies its own `Disclosure` navbar.
- Design is blue/gray SaaS, desktop-first, inconsistent spacing and contrast.
- Floating logo and role portal pills sit on every screen.
- Accessibility gaps: some icon buttons lack names, color contrast is uneven, reduced motion is not handled.
- Dead / thin surfaces: `/Blog` casing, unused MUI in places, `to-do: Shop Page` in README even though `/shop` exists.

## Technical debt

- Repeated navigation and notification menus.
- `any` in session and page props.
- No automated frontend test runner.
- Env validation requires Discord secrets even for local UI work.
- `sendgrid.env` is tracked in git and should be treated as a secret.

## Protection rules used for this refactor

- Do not rewrite Prisma models, payment webhooks, RBAC, or order/project/booking mutations.
- New OS routes consume existing data through a `workspace` adapter.
- Legacy routes stay online. `/` remains the classic Cloudus home.
