# Migration guide

This was an incremental frontend refactor, not a rewrite.

1. Audit existing T3 routers and Prisma models.
2. Add the design system and `OsShell` under the `(os)` route group so legacy pages do not lose their nav.
3. Add `workspace` tRPC adapter. No schema migration.
4. Add OS routes that read existing records and deep-link into `/projects`, `/shop`, `/events`, `/feed`, `/Blog`, `/admin`.
5. Keep `/` as the classic Cloudus home with an entry banner into `/dashboard`.
6. Hide floating chrome on OS routes so the mobile tab bar is not covered.

## If a legacy page still needs the old nav

Leave it. The OS is additive. When a page is ready, delete its copied `Disclosure` bar and move it into `(os)/layout.tsx` or wrap it with `OsShell`.
