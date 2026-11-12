# Archimart data retention procedure

Approved by the operator on 12 November 2026. This is a manual operating policy for professional applications, client enquiries, and their internal notes. No automated deletion or admin deletion UI exists. No records were deleted when this document was written. Keep the review log and approvals in a restricted operator-controlled location; do not commit personal information or case logs to the repository.

## Schedule

| Record                                          | Review or deletion point                                             | Evidence for the date                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `submitted` or `under_review` application       | Review at least every 90 days until resolved                         | Restricted review log; application `reviewed_at` may help, but is updated when a review is saved         |
| `approved` application without a linked profile | Review at least every 90 days                                        | Restricted review log                                                                                    |
| `rejected` application                          | Delete 12 months after final review                                  | `reviewed_at` if it identifies the final decision; otherwise restricted review log                       |
| `approved` application with a profile           | Delete 12 months after profile creation                              | Linked `professionals.created_at`; keep the profile under its own listing policy                         |
| `new` or `in_progress` enquiry                  | Review at least every 90 days until resolved                         | Restricted review log                                                                                    |
| `spam` enquiry                                  | Delete 30 days after it was marked spam                              | Restricted status-change log; do not infer the transition date from `updated_at` if later edits occurred |
| `closed` enquiry                                | Delete 12 months after closure or last follow-up, whichever is later | Restricted closure/follow-up log and any `enquiry_notes.created_at` dates                                |
| Internal notes                                  | Delete with the parent application or enquiry                        | Application `review_notes` is on the parent row; `enquiry_notes` is linked to the enquiry                |

Do not invent missing decision, closure, or follow-up dates. Where existing timestamps cannot establish a date, record the verified event in the restricted log and leave the record for review until its due date can be established. A later meaningful follow-up resets the closed-enquiry 12-month clock. A new status decision can reset an application's final-review date only when an administrator records that decision.

## Quarterly review and holds

1. A designated active administrator reviews the pending/open records at least every 90 days and records the review date, case type and ID, status, outcome, responsible administrator, and next review date. Do not copy contact details, messages, biographies, or note contents into the log.
2. For records approaching deletion, check their current status and linked profile, the latest follow-up, privacy requests, and any legal dispute, unresolved complaint, or other lawful reason to keep them. Record a hold's reason, responsible administrator, and next review date. Reassess holds at that date; they are not indefinite by default.
3. Handle requests received at `archimartng@gmail.com` manually. Verify identity proportionately using details already held or the existing correspondence channel. Do not request identification documents by default. Record the request and outcome without copying unnecessary personal information into the log.

## Manual deletion approval and audit record

1. The designated administrator prepares a candidate list of case IDs, record type, due-date evidence, linked records, and any hold. Check that the selected records are eligible and that a linked professional profile will remain under its separate listing policy.
2. An active Archimart administrator approves the exact case IDs and expected related-note count before any deletion. Record the approver and approval date in the restricted log. A coding agent or operator must obtain separate explicit authorization before executing a destructive database operation.
3. After authorization, use a reviewed, environment-specific, transactional procedure that targets only those approved IDs. Recheck eligibility inside the transaction and verify the resulting counts. Deleting an enquiry also removes its linked `enquiry_notes` under the existing foreign key; deleting an application removes its `review_notes` field with the row. Do not delete a professional profile merely because its application is due for deletion.
4. Keep a minimal audit entry: case type and ID, policy reason, due-date evidence, hold decision, reviewer, approver, execution date, result, related-note count, and next review date if retained. Do not retain the deleted record's contact information or message in the audit entry.

This document authorizes no deletion by itself. No SQL or script for production deletion is included.

## Backups and restoration

The current Neon restore-history window, snapshots, exports, and any independent backups have **not** been inspected. Before operating deletion, the designated administrator must record the configured retention/expiry for each copy type and who can access and restore it. Do not promise immediate erasure from historical backups; copies may remain until their configured expiry. Review older branches and exports as separate copies.

Before making restored data available to the application or other users, compare it with the restricted deletion log and reapply approved deletions to the restored copy. Keep the restored copy isolated until that check is complete, then record the reconciliation. This prevents a restore from silently reintroducing removed records. [Neon describes restore history and snapshots as separate recovery mechanisms](https://neon.com/blog/three-ways-to-use-your-snapshots); the actual Archimart settings still need operator verification.
