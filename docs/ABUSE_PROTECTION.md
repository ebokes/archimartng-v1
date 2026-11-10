# Public form abuse protection

The professional application and enquiry forms validate input on the server and use a hidden honeypot field. They do not currently limit request frequency. Archimart is intended to run on Vercel, so its WAF can count submissions at the edge without a new application dependency or database table.

## Proposed Vercel rule (pending approval and deployment)

Create **one** rate-limiting rule for the two public Server Actions. Vercel's Hobby plan permits one rate-limiting rule per project.

| Setting | Proposed value |
| --- | --- |
| Condition | Server Action Name **is any of** the deployed names for `submitProfessionalApplication` in `src/app/professionals/apply/actions.ts` and `submitEnquiry` in `src/app/enquiries/actions.ts` |
| Additional condition | Environment **equals** Production |
| Strategy | Fixed window |
| Counting key | IP address |
| Window and limit | 10 matching requests per 60 seconds per IP, shared across both forms |
| Response after limit | Default HTTP 429 |

Confirm the exact Server Action Name values in the Vercel Firewall traffic view before using them. The source paths above are identifiers for the intended actions, not verified WAF values. Matching action names requires Next.js 15.5 or later; the project declares Next.js 16.4.4. Counted requests include invalid or honeypot submissions because the rule runs before the Server Actions. A shared IP can affect several users, so review legitimate traffic before lowering the limit.

Start with a **Log** follow-up action, inspect which requests match, then change to the 429 response after confirming the condition. Vercel's dashboard requires **Review Changes → Publish** to activate a rule; this changes production traffic and requires explicit approval under `AGENTS.md`. The dashboard may present a rate-limiting pricing dialog. Check the current allowance and price before publishing.

After activation, verify that ordinary applications and enquiries succeed, that unrelated GET requests and admin actions are unaffected, and that excess matching requests from one test IP receive 429. Use disposable form data for this check and review the Firewall overview for false positives. The application honeypot remains useful but is not a substitute for the rate limit.

Sources: [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [rule parameters](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration), and [custom rule workflow](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules).
