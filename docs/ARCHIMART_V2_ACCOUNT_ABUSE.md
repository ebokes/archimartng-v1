# V2 Phase 1 account request protection proposal

**Status:** Neon PostgreSQL selected by the operator; additive migration `drizzle/0004_legal_mole_man.sql` and counter integration prepared offline for review. The migration is **not applied** and `ACCOUNT_RATE_LIMIT_ENABLED` remains false. Starting thresholds and rollout still need review. Public client registration and marketplace sessions remain disabled. V1 professional application and enquiry throttling remains **Deferred — Unresolved** under F1; this work does not replace it.

## Existing boundary

The client registration Server Action calls a private Better Auth instance, so Better Auth's HTTP rate limiter cannot count those calls. The mounted Better Auth instance also exposes `/send-verification-email`, `/request-password-reset`, `/reset-password`, and `/sign-in/email`. Better Auth 1.7.15 defaults to process-memory counters in production and disables them in development. Process memory does not provide a shared serverless limit. A honeypot and input validation do not limit valid automated requests. The prepared resend/recovery functions are server-only and unmounted; they call Better Auth's supported APIs and use fixed, trusted callbacks. There is no public resend or password-reset form yet.

## Prepared shared limiter

Migration `0004` adds one public `account_rate_limits` table with a 64-character keyed-hash primary key, positive attempt count, window start and expiry timestamps, and an expiry index. It adds no foreign keys or personal-data columns. One parameterized `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` statement rolls over or increments a counter while PostgreSQL locks the conflicting row. The counter saturates at max + 1 until the fixed window expires. The application uses the same store for registration and Better Auth's supported `customStorage.consume` hook. Keys are HMAC-SHA-256 hashes with a domain separator; raw IPs, email addresses, passwords and tokens are not stored in this table. The current Better Auth secret is used only as the HMAC key; rotating it effectively resets counters.

The registration action fails closed unless its existing local gate **and** the separate `ACCOUNT_RATE_LIMIT_ENABLED` flag are on. With both on, it counts 5 requests per trusted IP per hour and 3 per normalized email per hour before calling the identity coordinator. The mounted Better Auth handler is prepared to use the same PostgreSQL store for HTTP requests, including direct sign-in, resend, reset-initiation and token endpoints. The direct resend/reset POST wrapper also counts 3 requests per normalized email per hour. The private server-side resend/reset helper counts the same email budget because `auth.api` calls bypass HTTP middleware. A missing table or storage error denies sensitive operations; no fallback to memory is configured when the flag is on. **The flag is off**, so none of these new limits is active and existing administrator sign-in behavior remains unchanged.

For deployment, Vercel's `x-vercel-forwarded-for` is the intended IP source; [Vercel documents that it sets the forwarded address](https://vercel.com/docs/headers/request-headers). A comma-separated or invalid address fails closed for the registration action. Local development uses one shared local bucket. Better Auth's own IP extraction for mounted endpoints must be verified on a development deployment before production activation. Avoid deploying the flag before the table exists in the target environment.

Do not use per-process memory or an arbitrary client-supplied IP header. Test shared-network false positives and database connection/cost impact before expanding the gate beyond local development. Do not log passwords, tokens, email addresses, raw IPs, or full links.

## Starting limits for review

| Operation | Proposed independent starting ceiling | Counter scope |
| --- | --- | --- |
| Client registration action | 5 attempts per IP per hour, plus 3 per normalized email per hour | Count before identity creation, including failed or duplicate attempts. |
| Verification resend | 3 per normalized email per hour, plus 10 per IP per hour | Count before the Better Auth send API. |
| Password-reset initiation | 3 per normalized email per hour, plus 10 per IP per hour | Count before the Better Auth request API. |
| Better Auth email sign-in | 5 attempts per IP per 15 minutes; account-key ceiling still pending privacy review | Preserve administrator access; test shared-office false positives before enforcement. |
| Password reset completion | 10 requests per IP per 15 minutes | Better Auth still validates and consumes its own token. |
| Verification callback | 20 requests per IP per 15 minutes | Better Auth still validates its own token. |

These numbers are configured **only behind the disabled flag** and remain proposals for activation. Shared networks and mobile IP changes can cause false positives or bypasses. Return a generic accepted response for existing and unknown addresses; a rate-limit response must not reveal account existence. The registration action currently returns a generic accepted result for duplicate identities. Better Auth's reset API also uses a generic unknown-address response; review its operational logs before exposure.

**Expiration and cleanup:** Expiry is enforced on every atomic consume, so an expired row starts a new window. Expired rows remain stored until cleaned. Before rollout, approve a restricted scheduled or operator-run daily cleanup of rows more than 24 hours past `expires_at`, with a bounded batch size and observed row counts. No cleanup job or deletion SQL was run or enabled in this task. The proposed retention period for counters and other V2 account/security records remains pending stakeholder approval in the Phase 1 plan.

## Activation checklist

1. Review migration `0004` and approve its application to the verified Neon development branch separately. Confirm its table/index/check and no changes to V1 or Better Auth structures. Run a real PostgreSQL concurrency and expiry check before setting `ACCOUNT_RATE_LIMIT_ENABLED=true` locally; mocked concurrency tests are not enough.
2. The gated same-origin `/account/reset-password` page now uses Better Auth's `resetPassword` API. Test its invalid, expired and valid token paths with a disposable development identity and separately approved email send. No real recovery email was sent in this task.
3. Review account privacy and retention decisions. Keep client registration and marketplace session flags off until an approved, disposable development end-to-end test. Keep Vercel Production flags off until a separate rollout review.
4. Observe attempted and limited counts without recording sensitive request contents. Confirm direct Better Auth endpoint requests are counted and fail closed when storage is unavailable. Start with isolated development traffic, then review false positives and cost before a separately approved deployment. Never turn on the flag in Vercel Production before its schema and admin sign-in impact are reviewed.
