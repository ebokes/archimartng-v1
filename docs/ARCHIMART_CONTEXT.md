# Archimart project context

## Product

Archimart is a Nigerian architecture marketplace targeting a functional MVP launch by 31 December 2026. Its business model is lead generation. Audiences are clients, architects, and builders. Clients browse plans and professionals and submit enquiries; professionals can apply for listings.

## Confirmed MVP decisions

- Administrators manage all plan listings and professional profiles.
- Professional verification and dashboard enquiry review are manual; there are no automated notifications.
- There are no client or professional accounts, online payments, escrow, subscriptions, ARCHI AI, BUILDTRACK, or ARCHIVE memberships in the MVP.

## Technical architecture and infrastructure

- Next.js App Router `^16.4.4`, React `^19.2.0`, TypeScript `^5.8.3`, Tailwind CSS `^4.2.1`, and Zod `^4.6.7`, per `package.json`. npm is the package manager.
- Neon PostgreSQL project `archimart`, with `development` and `production` branches.
- Drizzle ORM `^0.45.4` for application and authentication schemas; Better Auth `^1.7.15` for administrator email/password sessions.
- Local configuration uses `DATABASE_URL` (pooled), `DATABASE_URL_DIRECT` (direct), `NEON_DEVELOPMENT_ENDPOINT_ID`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET`. Keep values in ignored local environment files; never record credentials here.

## Database and authentication progress

- Previous work verified development database connectivity and application of `drizzle/0000_round_maestro.sql` to development. This documentation task did not reconnect to the database. The schema defines seven application tables: `admins`, `plans`, `plan_images`, `professionals`, `professional_applications`, `enquiries`, and `enquiry_notes`.
- The repository contains the Better Auth configuration, authentication schema, route handler, transactional PostgreSQL connection, and `requireAdmin()` helper. `disableSignUp: true` and the disabled sign-up path close public email/password registration. Session creation and `requireAdmin()` check the active `admins` allow-list.
- Authentication migration `drizzle/0001_empty_energizer.sql` is generated and reviewed. It creates an `auth` schema with four auth tables, foreign keys, and indexes. Per the prior handover, it is **not applied**. No administrator provisioning path or sign-in UI has been implemented.

## Security and compatibility review

- Completed on 3 November 2026: Next.js and `eslint-config-next` were updated from 16.4.0 to 16.4.4. The critical Next.js audit finding cleared; 22 moderate dependency findings remained.
- No direct Zod API imports were found under `src`; lint, TypeScript, and the Webpack production build passed with Zod 4.6.7. Zod-based application validation has not been implemented yet.
- The session hook will reject sign-in until an auth identity has a matching active `admins` record. First-admin provisioning needs a reviewed operator-only process.
- Turbopack production build still fails when its PostCSS worker tries to bind a local port (`Operation not permitted`). The sandboxed build also cannot fetch the existing Google font. Recheck Turbopack in deployment CI.

## Progress

- **Last completed task:** Updated and verified persistent project context in `AGENTS.md` and this file. The preceding task completed the security and compatibility review.
- **Current task:** Awaiting approval for the next development task; no implementation is in progress.
- **Known blockers:** Authentication migration awaits explicit approval for development; no administrator provisioning path exists; Turbopack build is blocked by the local worker port restriction.
- **Next recommended task:** After explicit approval, apply the reviewed authentication migration to the verified development branch. Then design administrator provisioning and authorization tests.

## Remaining development

1. Apply the reviewed authentication migration to development after approval.
2. Implement administrator provisioning.
3. Build administrator sign-in and authorization tests.
4. Build the protected administrator dashboard.
5. Build the architectural plan catalogue.
6. Build the professional directory and applications.
7. Build enquiry submission and management.
8. Complete testing, SEO, and production launch preparation.

After each meaningful milestone, update the progress section. Never mark functionality complete without verification. Never apply a migration automatically or access production without explicit approval. Every protected server operation must check both the Better Auth session and an active `admins` record.
