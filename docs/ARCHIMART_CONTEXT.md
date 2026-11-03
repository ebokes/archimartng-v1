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
- Authentication migration `drizzle/0001_empty_energizer.sql` was applied to the verified Neon development branch after explicit approval. Read-only verification confirmed the `auth.account`, `auth.session`, `auth.user`, and `auth.verification` tables and two Drizzle migration journal entries.
- The first administrator was provisioned on development after explicit approval using the operator-only command at `scripts/provision-first-admin.ts`. Read-only verification confirmed one auth user, one credential account, one matching active `admins` allow-list record, and no session. The command uses an interactive hidden password prompt and Better Auth's password hashing.
- Administrator sign-in UI exists at `/admin/sign-in`. A small `/admin` landing page calls `requireAdmin()` on the server and supports sign-out. Authorization tests cover missing sessions, missing allow-list records, inactive admins, and active admins. HTTP smoke checks confirmed anonymous `/admin` redirects to sign-in, the sign-in page loads, and public sign-up remains closed. The administrator confirmed a successful sign-in and sign-out with the private credential.
- `/admin` now provides a read-only dashboard with publication counts, new and in-progress enquiry counts, applications awaiting review, and the five latest open enquiries and applications. The data operation calls `requireAdmin()` before any dashboard query. Read-only development queries, anonymous redirect, lint, TypeScript, authorization tests, and the Webpack build passed. Listing and enquiry management actions are later tasks.
- The architectural plan catalogue is implemented at `/plans` and `/plans/[slug]`. Public queries return published listings only; unknown or unpublished slugs return 404. The administrator can create drafts, edit listings and cover images, and set draft, published, or archived status through `/admin/plans`. Every protected read and write checks the current session and active `admins` record. Plan and cover changes use one transaction. Publishing requires a described HTTPS cover image. No plan write or migration was executed during this task.
- Plan input tests, lint, TypeScript, and the Webpack production build passed. A read-only development connection check passed. HTTP smoke checks returned 200 for `/plans`, 404 for an unknown plan, and a sign-in redirect for anonymous `/admin/plans`. These checks did not exercise the authenticated administrator form.
- A follow-up code review corrected cover replacement handling: clearing a saved cover URL now returns an error before any update, and the form explains how to replace it. Lint, TypeScript, plan input tests, and the Webpack build passed after this change. No development database write was made during the review.
- With explicit approval, `scripts/check-plan-transaction.ts` verified the development database write path: it inserted a draft plan, confirmed draft privacy, edited it, added a cover, published it, and confirmed the published row and cover. The transaction was rolled back, and a separate query confirmed the temporary plan was absent. The script unconditionally checks the verified development endpoint before connecting. This tests the database path, not an authenticated browser submission; administrator UI create/edit/publish still needs a manual session check.

## Security and compatibility review

- Completed on 3 November 2026: Next.js and `eslint-config-next` were updated from 16.4.0 to 16.4.4. The critical Next.js audit finding cleared; 22 moderate dependency findings remained.
- Plan input now uses Zod 4.6.7 for server-side validation. Plan validation tests, lint, TypeScript, and the Webpack production build passed.
- The session hook rejects sign-in unless the auth identity has a matching active `admins` record. The first administrator was provisioned through the operator-only process.
- Turbopack production build still fails when its PostCSS worker tries to bind a local port (`Operation not permitted`). The sandboxed build also cannot fetch the existing Google font. Recheck Turbopack in deployment CI.

## Progress

- **Last completed task:** Verified the plan draft, edit, and publication database path in an approved development transaction and confirmed rollback.
- **Current task:** Awaiting an administrator browser check of the authenticated plan form.
- **Known blockers:** Turbopack build is blocked by the local worker port restriction.
- **Next recommended task:** Confirm the administrator plan form in a signed-in browser, then build the professional directory and applications.

## Remaining development

1. Verify authenticated plan create, edit, and publication in an administrator browser session.
2. Build the professional directory and applications.
3. Build enquiry submission and management.
4. Replace remaining mocked landing page marketplace cards and out-of-scope marketing claims.
5. Complete testing, SEO, and production launch preparation.

After each meaningful milestone, update the progress section. Never mark functionality complete without verification. Never apply a migration automatically or access production without explicit approval. Every protected server operation must check both the Better Auth session and an active `admins` record.
