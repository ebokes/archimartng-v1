# Archimart coding rules

- Inspect existing code and project instructions before making changes. Follow the repository's current Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, and Better Auth conventions.
- Work on one small, testable task at a time. Avoid unnecessary dependencies and abstractions.
- Keep V1 changes within its approved admin-managed lead-generation scope. V2 work follows the approved Phase 1 direction and `docs/ARCHIMART_V2_PRD.md`; treat the PRD's proposed details as pending decisions. The V1 target launch is 31 December 2026.
- Never expose credentials, secrets, or full connection strings in code, logs, documentation, or replies.
- Use only the verified Neon `development` branch for development database work. Never access or modify production without explicit authorization.
- Never apply migrations without explicit approval. Generate and review SQL before requesting approval to apply it.
- Never enable public administrator registration. Every protected **administrator** server operation must validate the Better Auth session **and** an active record in `admins`. Future client and professional operations must validate the session, active account, required role, approval when needed, and record ownership. Middleware, layouts, and hidden UI are insufficient authorization.
- Run relevant tests, lint, and TypeScript checks after changes. Report files changed, validation results, and remaining issues.
- Update `docs/ARCHIMART_CONTEXT.md` after meaningful completed milestones, marking work complete only when verified.

See `docs/ARCHIMART_CONTEXT.md` for product scope and current progress.
