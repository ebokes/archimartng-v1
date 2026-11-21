# V2 Phase 1 account request protection proposal

**Status:** Prepared 21 November 2026; storage choice and thresholds need operator approval. No limiter is active. Public client registration and marketplace sessions remain disabled. V1 professional application and enquiry throttling remains **Deferred — Unresolved** under F1; this proposal does not replace that work.

## Existing boundary

The client registration Server Action calls a private Better Auth instance, so Better Auth's HTTP rate limiter cannot count those calls. The mounted Better Auth instance also exposes `/send-verification-email`, `/request-password-reset`, `/reset-password`, and `/sign-in/email`. Better Auth 1.7.15 defaults to process-memory counters in production and disables them in development. Process memory does not provide a shared serverless limit. A honeypot and input validation do not limit valid automated requests. The prepared resend/recovery functions are server-only and unmounted; they call Better Auth's supported APIs and use fixed, trusted callbacks. There is no public resend or password-reset form yet.

## Shared limiter decision needed

Choose **one** durable store before any public account email or registration route is enabled:

1. **Neon PostgreSQL, preferred with current infrastructure:** Review an additive rate-limit table and migration. Use one atomic increment with a window expiry for the registration action; configure Better Auth's documented database-backed limiter for its HTTP endpoints, which requires its own Drizzle rate-limit schema. Review write volume, cleanup, and connection capacity. Migration generation and application require separate approval. No rate-limit SQL was prepared or run in this task.
2. **Managed key-value store:** Configure a dedicated shared store with atomic increment and expiry, then use Better Auth's supported secondary/custom storage and the same service for the registration action. This adds a provider and operational configuration, so it also requires approval.

Do not use per-process memory. Do not trust an arbitrary client-supplied IP header. Decide which Vercel-provided client address is trustworthy in the deployed request path, normalize IPv6, and use a keyed hash for stored address/email limit keys. Define a safe fallback when the address or limiter is unavailable: fail closed on account creation and email initiation, while preserving administrator sign-in through its separately reviewed control. Do not log passwords, tokens, email addresses, raw IPs, or full links.

## Starting limits for review

| Operation | Proposed independent starting ceiling | Counter scope |
| --- | --- | --- |
| Client registration action | 5 attempts per IP per hour, plus 3 per normalized email per hour | Count before identity creation, including failed or duplicate attempts. |
| Verification resend | 3 per normalized email per hour, plus 10 per IP per hour | Count before the Better Auth send API. |
| Password-reset initiation | 3 per normalized email per hour, plus 10 per IP per hour | Count before the Better Auth request API. |
| Better Auth email sign-in | 5 attempts per IP per 15 minutes, with a separate account-key ceiling after privacy review | Preserve administrator access; test shared-office false positives before enforcement. |
| Password reset completion and verification callback | A modest IP ceiling for invalid requests; valid one-time tokens remain Better Auth-managed | Avoid blocking normal link opening; verify actual path behavior first. |

These numbers are proposals, not configured limits. Shared networks and mobile IP changes can cause false positives or bypasses. Return a generic accepted response for existing and unknown addresses; a rate-limit response must not reveal account existence. The registration action currently returns a generic accepted result for duplicate identities. Better Auth's reset API also uses a generic unknown-address response; review its operational logs before exposure.

## Activation checklist

1. Approve storage and the additive schema/provider change. Implement atomic counters and Better Auth HTTP limits, including direct endpoint calls. Test concurrency, expiry, disabled gates, and failure behavior without sending mail or creating accounts.
2. Complete a same-origin reset-password page and token-completion flow using Better Auth's `resetPassword` API. The prepared request uses a fixed `/account/reset-password` redirect, but that page does not yet exist; do not send reset emails before it does.
3. Review account privacy and retention decisions. Keep client registration and marketplace session flags off until an approved, disposable development end-to-end test. Keep Vercel Production flags off until a separate rollout review.
4. Observe attempted and limited counts without recording sensitive request contents. Start with isolated development traffic, then review false positives and cost before a separately approved deployment.
