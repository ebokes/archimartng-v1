# Archimart V2 Phase 1: account lifecycle and schema proposal

**Status:** Design proposal, 18 November 2026. No schema or authentication change has been made. This plan covers identity, account status, professional approval and profile ownership only. The [V2 PRD](ARCHIMART_V2_PRD.md) is still a draft; its five confirmed product decisions are inputs, while other stakeholder choices remain open.

## Existing boundary

- Better Auth owns `auth.user`, `auth.account`, `auth.session` and `auth.verification`; its user IDs are text. `auth.user.email` is unique and has `email_verified`. Password hashes remain in Better Auth's credential table.
- `src/lib/auth.ts` disables public email sign-up and checks for an active `admins` row before creating a session. `requireAdmin()` repeats the active allow-list check for each protected administrator operation. The first administrator is created by an operator-only command. These protections must stay effective throughout rollout.
- `professionals` holds administrator-managed public content, publication and verification states. `professional_applications` holds applicant details, review status and an optional linked profile. Neither table proves account ownership. The existing marketplace authorization helper is a policy primitive with no database or route integration.
- No separate V2 implementation plan was present in the repository before this file. The IDE's `docs/ff.md` and the older `PLAN.md` were not present in the checked workspace.

## Proposed identity model

Use the existing Better Auth identity and sessions. Add an application-owned `marketplace_accounts` row for each **non-administrator** identity, with exactly one role: `client` or `professional`. The role is server-assigned; it is never accepted from a sign-up request or mutable by the account holder. An auth identity with an active `admins` row cannot acquire a marketplace account. An identity with a marketplace account cannot be added to `admins` by public operations. Administrator provisioning remains private and must reject an existing marketplace identity.

Public registration may create a **client** identity only. A user who wants to practice as a professional starts professional onboarding from that verified identity; the server changes its role to `professional` when onboarding is accepted for review. This is a proposed one-role policy that needs approval, since it removes client-only privileges from that identity. It avoids exposing a role-selecting Better Auth sign-up endpoint. A direct call to Better Auth sign-up must never create an administrator or an approved professional. If the Better Auth user is created but the application account row is not, it is inert: session creation and every marketplace operation reject the missing row. Implement a tested, idempotent account creation and recovery path and inspect the installed Better Auth hooks/transaction behavior before enabling sign-up. Do not assume its user-create hook and a separate application write commit atomically. Do not attach an unconditional `user.create.after` client-row insert: the operator-only administrator provisioner also creates a Better Auth user and must not receive a marketplace role.

The current session-create hook must eventually admit a user with **either** an active administrator allow-list row **or** an eligible marketplace account row, and reject an identity with both or neither. It must reject suspended/closed accounts and require verified email for marketplace sessions. `requireAdmin()` stays unchanged in meaning and continues checking `admins` on every protected administrator read and write. Client/professional operations use a separate session, account, role and object ownership check on every server operation. A pre-existing admin whose Better Auth `email_verified` flag is false must not be locked out by a blanket verification setting; inspect existing administrator identity state in an approved development-only verification step before changing global Better Auth options.

Better Auth documents email verification callbacks and `emailAndPassword.requireEmailVerification`, password-reset callbacks, and session revocation. The implementation must select and configure a reliable transactional email sender before requiring verification or recovery; no sender is configured today. Keep sign-up `autoSignIn: false`; send verification only through the reviewed mail path, use bounded tokens and safe redirect origins, and revoke other sessions after password reset. Because the existing administrator may be unverified, prefer explicit marketplace session/operation verification checks until the global setting is proven compatible with current administrators. Recheck the installed Better Auth 1.7.x API and direct sign-up behavior during implementation. See [email verification](https://better-auth.com/docs/concepts/email), [email/password and reset](https://better-auth.com/docs/authentication/email-password), and [sessions](https://better-auth.com/docs/concepts/session-management).

## Proposed lifecycle

| Actor | State / transition | Authorized actor and effect |
| --- | --- | --- |
| Client | Registration → unverified | Public email/password registration creates an auth identity and a server-assigned client row; no automatic session. Duplicate-email responses remain generic. |
| Client | Unverified → active | Verified email permits sign-in and client operations. Profile and future records remain scoped to the auth subject. |
| Client | Active → suspended → active | Administrator suspends or restores access with a recorded reason. Revoke sessions on suspension; every operation still checks status. |
| Client | Active/suspended → closed | Verified request and administrator-reviewed closure; revoke sessions, block sign-in, and follow the approved privacy/retention process. Closure does not imply immediate erasure of records with lawful retention needs. |
| Professional | Verified client → onboarding | Authenticated user chooses professional onboarding. Server converts the role to professional and creates a pending professional account. No professional capability is granted. Existing public application submissions remain separate from this step. |
| Professional | Pending → approved or rejected | Administrator reviews identity, qualifications and any application, records decision/reason, and may approve or reject. Approval alone neither publishes nor verifies a public profile. |
| Professional | Rejected → pending | Revised submission may be considered after administrator review; record the new review event. No automatic approval. |
| Professional | Approved → suspended → approved | Administrator controls suspension/restoration and revokes sessions on suspension. Approved-only operations remain denied while suspended. |
| Professional | Pending/rejected/approved/suspended → closed | Administrator-reviewed closure and retention handling; revoke sessions and remove active ownership capabilities without silently deleting the public listing or review evidence. |

Email verification is a separate Better Auth identity property, not a professional approval state. Account activity, professional approval, public listing publication, and manual verification are independent checks. An unverified email cannot use marketplace operations; a pending/rejected professional may see only their own onboarding and decision status after email verification. A suspended/closed account cannot use protected operations even with a still-valid cookie. The existing helper's `approvalStatus: 'suspended'` value is a defensive code state; the proposed persistent design puts suspension in account status and uses `pending | approved | rejected` for approval. Align the helper to the approved schema before wiring it to a route.

## Proposed additive PostgreSQL schema

No SQL is generated by this document. Names and constraints are for migration review.

| Table / change | Fields and constraints | Purpose |
| --- | --- | --- |
| `marketplace_accounts` | `id uuid` PK; `auth_subject text` NOT NULL UNIQUE FK → `auth.user.id` **RESTRICT**; `role` enum (`client`, `professional`) NOT NULL; `status` enum (`active`, `suspended`, `closed`) NOT NULL; `created_at`, `updated_at`, nullable `suspended_at`, `closed_at`; index `(role, status)`. | One role and lifecycle per non-admin identity. The FK type matches Better Auth's text ID. An administrator exclusion requires guarded provisioning and server checks; a cross-table exclusion is not supplied by this FK. |
| `professional_accounts` | `account_id uuid` PK/FK → `marketplace_accounts.id` **RESTRICT**; `approval_status` enum (`pending`, `approved`, `rejected`) NOT NULL; nullable `profile_id uuid` UNIQUE FK → `professionals.id` **RESTRICT**; nullable `application_id uuid` UNIQUE FK → `professional_applications.id` **SET NULL**; `created_at`, `updated_at`, nullable `reviewed_at`, `reviewed_by_admin_id uuid` FK → `admins.id` **RESTRICT**. Index `(approval_status, created_at)`. | One professional onboarding/approval record per account; at most one account per public profile and at most one live account link per legacy application. Application deletion under V1 retention will clear its pointer without deleting the account or profile. |
| `professional_account_events` | `id uuid` PK; `account_id uuid` FK → `professional_accounts.account_id` **RESTRICT**; `actor_admin_id uuid` nullable FK → `admins.id` **RESTRICT**; `event_type` constrained text/enum; `reason` text where required; `created_at`; index `(account_id, created_at)`. | Minimal restricted review, suspension, restoration, closure and profile-claim evidence. Automated creation events may have no admin actor; sensitive decisions require one. Define retention and access rules before release. |

`auth.user` already stores name and unique email; do not duplicate them merely to create a `client_profiles` table. Add a client profile only when Phase 1 needs independently editable client-specific fields. Do not put password hashes, admin status, public verification, or publication in the new tables. Existing `professionals`, `professional_applications`, and V1 enquiries stay intact. The professional account's `profile_id` is the single source of profile ownership; do not add a second owner column to `professionals` without a later reason. Enforce `professional_accounts` → professional-role consistency in the transaction and server authorization; review a database-level enforcement option before migration approval. Unique nullable `profile_id` prevents two accounts from claiming one profile.

## Existing profile claim and migration path

1. Keep all existing listings and applications unowned. No automatic link by email, name, phone, slug, or portfolio URL; these are evidence for review, not proof of control.
2. An email-verified professional requests association with a specific existing profile or an approved application. If an application already links to a profile, use that ID only as a candidate. If there is no application, an administrator-created profile can still be claimed after separate identity evidence review.
3. An active administrator checks identity/qualification evidence through a restricted process, confirms the profile has no owner, and records the decision. Profile publication and verification remain administrator-controlled and unchanged by the claim.
4. In one database transaction, re-read account, application and profile; require professional role, eligible approval, no existing account/profile link, and any application/profile match. Conditionally set `professional_accounts.profile_id` only when null; the UNIQUE constraint rejects races. Write a claim event with administrator ID and timestamp in the same transaction. Never accept a `profile_id` supplied by an untrusted request as sufficient authority.
5. Until an approved claim exists, the professional cannot edit a listing. An approved account with no profile may use account/status pages only. A legacy application may still be deleted on its approved V1 schedule; preserve the minimal claim decision event and separately define its retention.

The exact evidence standard, sensitive-field review, and ability to reclaim a disputed profile require stakeholder approval. For the first release, keep public verification status, publication status, slug, and sensitive contact fields administrator-controlled. Treat professional editing of other fields as a later, reviewed permission rather than inheriting the V1 administrator form.

## Decisions to review before implementation

- Approve or revise the proposed single marketplace role per identity, including what a client loses when becoming a professional. If simultaneous client and professional capabilities are required, revise the account model before migration.
- Choose a transactional email sender and delivery/operational plan for verification and recovery; none exists today. Confirm how existing administrator identities with unverified Better Auth email flags are handled without lockout.
- Define acceptable evidence for claiming existing profiles, who reviews it, whether rejected professionals can resubmit, and which professional profile fields may be edited without administrator review.
- Define account/claim-event retention and closure handling consistently with `DATA_RETENTION.md`, and review how the V2 privacy notice will describe the new account data. Existing V1 enquiries remain unlinked until the PRD's separate ownership decision is made.

## Server permission checks

| Operation | Required checks |
| --- | --- |
| Administrator operations | Better Auth session, active `admins` row, and the existing `requireAdmin()` inside each read/action. Public account role is never an admin grant. |
| Client own account | Better Auth session, verified email, matching active client account; object ID must belong to that account. No email-based ownership lookup. |
| Professional onboarding/status | Better Auth session, verified email, matching active professional account; read only that account's application/review state. |
| Approved professional profile view/edit | All onboarding checks plus `approval_status = approved`, `profile_id = requested profile.id`, and allowed field policy. Publication and manual verification fields remain admin-only. |
| Suspension, approval, claim, restoration, closure | Active administrator, current-state precondition, reason where applicable, transaction and audit event; revoke affected sessions for suspension/closure. |

`requireAdmin()` and the marketplace authorization helpers are policy checks, not a replacement for record ownership checks. Every server action and data loader must re-read the current state. UI hiding and middleware redirects are convenience only.

## Rollout, compatibility and rollback

1. Review this proposal and open stakeholder decisions. Test pure lifecycle and ownership policy before touching a database. Choose an email sender and verify Better Auth 1.7.x hooks, transaction support and session revocation against the installed package and isolated development tests.
2. Prepare an **additive** Drizzle migration for the new tables and constraints. Review generated SQL for changes to existing seven app tables and four auth tables. Apply only to the verified Neon development branch after explicit approval. Do not backfill an owner from V1 contact data.
3. Keep the existing admin-only auth behavior until the new tables exist, a safe account-creation path is tested, and verification emails work. Enable public registration behind a reviewed deployment gate. Test direct Better Auth endpoints, including malformed or bypassed onboarding requests. The gate is a proposed implementation device, not a currently configured feature.
4. Test existing administrator sign-in and `requireAdmin()`, unverified/client/professional sign-in, missing-row denial, role crossover, suspension, claims, race conditions and publication/verification independence on development. Only then consider a separately approved production migration and deployment.
5. Roll back application access first: disable public registration and V2 routes while preserving V1 admin sign-in. Revoke or block marketplace sessions if needed. Leave additive tables in place during the immediate rollback; do **not** drop them or discard personal data without a reviewed retention/migration plan. A schema rollback is a separate approved operation.

## Acceptance criteria before Phase 1 release

- Anonymous/direct sign-up cannot create an administrator, assign a professional role, or produce an approved account. Admin provisioning cannot reuse a marketplace identity.
- New clients verify email, sign in/out, recover passwords, and reach only their own account and dashboard. Missing and unverified account rows deny access.
- Professionals can register, complete onboarding and see only their own review state. Pending/rejected/suspended accounts cannot use approved capabilities; administrators can review and record decisions.
- No profile is auto-claimed from V1 data. Only a reviewed admin transaction links one account to one profile; cross-profile edits and simultaneous claims are denied.
- Professional approval, profile publication, and verification badges remain separate; professionals cannot set publication or verification. Existing administrators retain their allow-list access.
- Suspension/closure blocks every protected operation, revokes sessions, and produces a restricted audit event. Privacy notice and account-data retention rules are reviewed before collecting new V2 data.

## First independently testable implementation task

Implement a **pure lifecycle transition policy** with unit tests for client/professional states, actor permissions, approval versus suspension, and ownership preconditions. It should have no route, Better Auth, or database write and can be reviewed before a migration. Then review this schema proposal and the email delivery decision; do not generate or apply a migration until separately authorized.
