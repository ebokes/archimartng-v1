# Archimart coding rules

- Inspect existing code and project instructions before making changes. Follow the repository's current Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, and Better Auth conventions.
- Work on one small, testable task at a time. Avoid unnecessary dependencies and abstractions.
- Keep features within the approved admin-managed lead-generation MVP. Obtain approval before expanding its scope. The target launch is 31 December 2026.
- Never expose credentials, secrets, or full connection strings in code, logs, documentation, or replies.
- Use only the verified Neon `development` branch for development database work. Never access or modify production without explicit authorization.
- Never apply migrations without explicit approval. Generate and review SQL before requesting approval to apply it.
- Never enable public administrator registration. Every protected server operation must validate the Better Auth session **and** an active record in `admins`; middleware, layouts, and hidden UI are insufficient authorization.
- Run relevant tests, lint, and TypeScript checks after changes. Report files changed, validation results, and remaining issues.
- Update `docs/ARCHIMART_CONTEXT.md` after meaningful completed milestones, marking work complete only when verified.

See `docs/ARCHIMART_CONTEXT.md` for product scope and current progress.
