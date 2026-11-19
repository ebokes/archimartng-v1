# ARCHIMART V2
## Product Requirements Document (PRD)

**Version:** 1.0 — Draft  
**Date:** 12 November 2026  
**Product:** Archimart  
**Release:** V2  
**Status:** Proposed — Pending stakeholder approval  
**Existing platform:** Next.js, TypeScript, Better Auth, Neon PostgreSQL, Drizzle ORM and Vercel

---

## 1. Executive Summary

Archimart V2 will expand the existing administrator-managed lead-generation platform into a managed marketplace connecting three account types:

1. **Administrator** — manages the platform, approves professionals, monitors engagements and intervenes when necessary.
2. **Client** — creates an account, discovers plans and professionals, submits enquiries, communicates with professionals and tracks engagements.
3. **Professional** — registers for approval, manages an approved profile, receives and responds to enquiries, communicates with clients and updates engagement progress.

Clients and professionals will communicate directly through Archimart once a professional accepts an enquiry.

Administrators will have access to all platform conversations for routine monitoring, moderation, support and dispute management. This access must be disclosed to users, limited to authorized administrative roles and recorded in audit logs.

The goal is to reduce manual coordination while maintaining accountability and centralized platform control.

## 2. Product Objectives

### Primary objectives

- Introduce secure client and professional accounts.
- Allow professionals to manage their own profiles and enquiries.
- Establish direct, platform-based client–professional communication.
- Give administrators oversight of all engagements and conversations.
- Track engagements from enquiry submission through completion.
- Maintain professional verification and marketplace quality standards.
- Preserve compatibility with existing V1 data and administrator operations.

### Success indicators

Proposed measures to review after launch:

- Percentage of enquiries accepted or declined by professionals.
- Median time to first professional response.
- Percentage of accepted engagements reaching a recorded outcome.
- Percentage of completed engagements confirmed by clients.
- Number of disputes and reports requiring intervention.
- Number of unauthorized access incidents, with a target of zero.
- Share of enquiries requiring manual administrative coordination.

Initial performance targets should be established after observing baseline usage rather than assumed in advance.

## 3. Confirmed Product Decisions

| Decision | Approved requirement |
|---|---|
| Communication | Messaging starts only after professional acceptance |
| Administrator visibility | Authorized administrators can access all conversations for routine monitoring |
| Engagement updates | Professionals update progress; clients confirm completion |
| Registration | Clients self-register; professionals require approval |
| Contact sharing | Early communication remains on Archimart; formal sharing policy required |

These decisions are the foundation of V2. Any change requires stakeholder review.

## 4. User Roles and Responsibilities

### 4.1 Administrator

Administrators must be able to:

- Manage client and professional accounts.
- Review, approve, reject and suspend professional accounts.
- Manage professional verification and publication.
- Monitor engagement activity.
- Access conversation contents for routine oversight.
- Review and resolve reported communications.
- Suspend messaging or engagements where justified.
- View engagement history and progress.
- Record actions and reasons for sensitive interventions.
- Access operational performance reports.

Administrative permissions must be restricted by responsibility. Full conversation access must not automatically be granted to every future support or content-management employee.

### 4.2 Client

Clients must be able to:

- Register and sign in.
- Verify their email address.
- Update their personal profile.
- Browse plans and professional listings.
- Submit enquiries about architectural plans or professional services.
- View their own enquiry history.
- See whether a professional has accepted or declined an enquiry.
- Communicate after acceptance.
- Track engagement progress.
- Confirm or dispute reported completion.
- Report inappropriate activity.
- Manage notification preferences.
- Request account or personal data deletion, subject to applicable obligations.

### 4.3 Professional

Professionals must be able to:

- Register and verify their email.
- Submit profile and qualification details for approval.
- View application and account approval status.
- Manage approved profile content, subject to review rules.
- Receive enquiries associated with their profile or assigned by administrators.
- Accept or decline eligible enquiries.
- Communicate with clients after acceptance.
- Update engagement progress.
- Propose completion.
- Report abusive or suspicious activity.
- View their own engagement history.

A professional's approval, listing publication and verification badge must remain separate states.

## 5. Phased Implementation Scope

### Phase 1 — Identity, Accounts and Professional Ownership

**Objective:** Support all three account types securely.

**Requirements**

- Client registration, email verification, login, logout and password recovery.
- Professional registration and onboarding.
- Administrator professional approval and rejection.
- Secure professional account-to-profile association.
- Separate client and professional dashboards.
- Account suspension and access restrictions.
- Role-specific server authorization.
- Preservation of existing administrator authentication.
- Migration strategy for previously submitted professional applications.

**Important architectural constraint**

V1 Better Auth currently restricts authentication to approved administrators. V2 must introduce client and professional access without weakening the existing administrator allow-list or protected routes.

**Acceptance criteria**

- Clients can create and access their own accounts.
- Unapproved professionals cannot access approved professional capabilities.
- Administrators can approve or reject professional accounts.
- Verified professionals cannot assign themselves verification status.
- Clients cannot access another client's private data.
- Professionals cannot manage another professional's profile.
- Existing V1 administrators retain secure access.
- Account suspension blocks protected actions and invalidates or revokes sessions as appropriate.

**Phase exit condition:** All three roles authenticate correctly and pass authorization tests.

### Phase 2 — Enquiries and Engagement Management

**Objective:** Convert enquiries into trackable client–professional engagements.

**Requirements**

- Authenticated client enquiry submission.
- Professional enquiry inbox.
- Accept and decline actions.
- Enquiry ownership and access checks.
- Engagement creation and status tracking.
- Client and professional engagement dashboards.
- Administrator engagement directory.
- Engagement activity records.
- Reassignment or cancellation through controlled administrator actions.

**Proposed enquiry lifecycle**

New → Pending Professional Response → Accepted → In Progress → Completion Proposed → Completed

Alternative outcomes: Declined, Cancelled, Disputed and Administratively Closed.

**Rules**

- An enquiry must reference a valid published listing or an explicitly assigned professional.
- Only the designated professional can accept or decline it.
- Acceptance must be atomic to prevent duplicate engagements.
- Acceptance creates or activates exactly one engagement conversation.
- Declined enquiries do not activate messaging.
- Professional progress updates are recorded with timestamps.
- Only the client may confirm ordinary completion.
- Administrators can intervene, with a documented reason and audit record.

**Acceptance criteria**

- Clients can submit enquiries from relevant listings.
- Assigned professionals receive and can respond to enquiries.
- Unauthorized professionals cannot accept another professional's enquiry.
- Accepted enquiries generate an engagement record.
- Declined enquiries remain unavailable for messaging.
- Engagement history survives refresh and sign-in.
- Administrators can inspect every engagement's current status and history.

**Phase exit condition:** An enquiry can be accepted, managed and completed without manual administrator coordination.

### Phase 3 — Direct Messaging

**Objective:** Enable secure conversations between linked clients and professionals.

**Requirements**

- A conversation associated with each accepted engagement.
- Text-based messaging.
- Persistent message history.
- Chronological display and pagination.
- Unread message indicators.
- Basic message delivery and failure states.
- Server-side content and length validation.
- Participant-specific message access.
- Reporting and moderation.
- Administrator conversation access.
- Administrator message-access audit logs.
- Clear notice that conversations are accessible to authorized Archimart administrators.

**Messaging rules**

- No client–professional messaging before professional acceptance.
- Messages cannot be submitted to an unrelated engagement.
- Suspended users cannot send messages.
- The client and assigned professional can access their engagement conversation.
- Authorized administrators can view all conversations.
- Administrator interventions must be identified as administrative actions.
- Message access must be checked on every server request.
- Conversation contents must not appear in public pages, search results or routine notification previews.
- Messaging must not be described as end-to-end encrypted because the platform requires administrator access.

**Initial implementation approach**

Use PostgreSQL-backed messaging with periodic refresh. Real-time infrastructure can be introduced later if usage justifies it.

**Acceptance criteria**

- Accepted engagements support messaging.
- Pending and declined enquiries do not.
- Messages persist and display in the correct order.
- Unauthorized users cannot retrieve or submit messages.
- Authorized administrators can view conversation contents.
- Every administrator conversation-access event records the actor, timestamp and accessed conversation.
- Users receive clear notice about administrator access before messaging.
- Reporting and messaging suspension work.

**Phase exit condition:** Clients and professionals can communicate securely, with functional administrator oversight.

### Phase 4 — Administrator Monitoring and Intervention

**Objective:** Give Archimart operational control without requiring administrators to coordinate routine engagements manually.

**Requirements**

- Engagement monitoring dashboard.
- Filters by professional, client, status and activity date.
- Conversation viewing.
- Message and engagement reporting.
- Response-delay indicators.
- Suspension and intervention actions.
- Administrative notes.
- Privileged-action audit history.
- Dispute resolution workflow.
- Basic marketplace reporting.

**Acceptance criteria**

- Administrators can locate any engagement.
- Administrators can inspect its conversation and activity history.
- Reports are visible in a centralized queue.
- Administrators can restrict further messaging.
- Sensitive actions require a reason and generate an audit record.
- Clients and professionals cannot see confidential administrative notes.
- All administrative access follows least-privilege rules.

**Phase exit condition:** Administrators can monitor, investigate and resolve engagement issues using built-in controls.

### Phase 5 — Notifications and Usability Improvements

**Objective:** Improve response times and reduce missed engagement activity.

**Requirements**

- In-app notifications.
- Email alerts for new enquiries, acceptance, new messages and completion requests.
- Basic notification preferences.
- Responsive dashboards.
- Engagement and message search within authorized data.
- Accessible loading, error and empty states.
- Pagination of large inboxes and activity lists.

**Acceptance criteria**

- Important actions create appropriate notifications.
- No notifications expose unauthorized private content.
- Notification failures do not prevent enquiry or message persistence.
- Users can open the related authorized record from a notification.
- Dashboards work on supported desktop and mobile layouts.

**Phase exit condition:** The platform supports practical day-to-day use without relying on manual administrator reminders.

## 6. Permissions Matrix

| Operation | Client | Professional | Administrator |
|---|---|---|---|
| Register account | Self | Apply | Provisioned |
| Edit personal details | Own | Own | Authorized management |
| Approve professional | No | No | Yes |
| Publish professional profile | No | Subject to approval | Yes |
| Verify professional | No | No | Yes |
| Create enquiry | Yes | No | Controlled admin action |
| Accept enquiry | No | Assigned only | Controlled intervention |
| View engagement | Own | Assigned only | All, by permission |
| Send messages | Accepted engagement | Accepted engagement | Identified intervention |
| Read conversations | Own | Assigned only | All, by permission |
| Update progress | View | Assigned only | Override with reason |
| Confirm completion | Own | No | Dispute resolution only |
| Suspend engagement | No | No | Yes |
| View audit records | No | No | Authorized administrators |

All permissions must be enforced on the server and checked against the actual record, not merely the user's role.

## 7. Contact-Sharing Policy

The first V2 messaging release should retain early client–professional communication within Archimart.

Proposed policy:

- Do not display private phone numbers or email addresses automatically in engagements.
- Allow professional public business information only where the listing policy explicitly permits it.
- Explain why initial communication should remain on the platform.
- Establish a controlled process for sharing contact details after engagement acceptance.
- Record applicable participant agreement where needed.
- Discourage attempts to circumvent platform safeguards.
- Support reporting of unwanted contact requests.
- Do not promise that text filtering can prevent every attempt to exchange contact information.

**Pending stakeholder decision:** Whether contact details can be shared immediately after acceptance or only at a later mutually agreed engagement stage.

## 8. Data Model — Proposed Additions

The exact schema requires technical design and migration review.

Likely new or extended entities:

| Entity | Purpose |
|---|---|
| `client_profiles` | Client-specific account details |
| `professional_accounts` | Professional identity, ownership and approval |
| `engagements` | Links client, professional and enquiry |
| `engagement_events` | Status and significant activity history |
| `conversations` | One conversation per accepted engagement |
| `messages` | Participant messages and timestamps |
| `message_access_audit` | Administrative conversation access |
| `notifications` | In-app notification records |
| `reports` | User-submitted complaints and concerns |
| `admin_audit_log` | Sensitive administrative actions |

Reuse Better Auth and existing application entities where appropriate. Avoid duplicating identities or creating competing authentication systems.

Existing enquiries, professional applications, professional profiles and administrator records must remain consistent during migration.

## 9. Security and Privacy Requirements

- Secure email verification and password recovery.
- Server-side authentication and authorization.
- Engagement-specific access checks.
- Role and permission separation.
- Rate limiting on authentication, enquiries and messaging.
- Anti-spam and abuse reporting.
- Session revocation on suspension.
- Protected administrator access.
- Audit logs for sensitive actions and message inspection.
- Defined retention and deletion rules for conversations and engagements.
- Secure storage of personal information.
- Clear disclosure of administrator access to conversations.
- Controlled production migrations and environment isolation.
- No unrestricted public access to private attachments or messages.

Before launching administrator-readable messaging, review the lawful basis, transparency obligations and security controls under applicable Nigerian data protection requirements.

The existing V1 privacy notice and retention documentation must be updated for the additional account, engagement and conversation data.

## 10. Non-Functional Requirements

**Reliability:** A failed notification must not cause a successfully saved enquiry or message to be lost.

**Consistency:** Engagement acceptance, conversation creation and critical status transitions must prevent duplicate or conflicting records.

**Performance:** Paginate conversations and engagement lists. Load only data needed for the current authorized view.

**Accessibility:** Support keyboard interaction, readable validation errors and mobile-friendly forms.

**Observability:** Record application failures and sensitive administrative events without logging passwords, tokens or unnecessary message contents.

**Maintainability:** Keep authentication, authorization, engagement rules and messaging operations modular and testable.

## 11. Key User Stories

**US-01 — Client registration**

As a client, I want to register and manage an account so I can track my enquiries and engagements.

**US-02 — Professional approval**

As a professional, I want to register and submit my profile for review so I can participate in the marketplace after approval.

**US-03 — Professional profile ownership**

As an approved professional, I want to maintain my portfolio and service information so potential clients see accurate details.

**US-04 — Enquiry submission**

As a client, I want to contact a professional through a listing so I can discuss my project requirements.

**US-05 — Enquiry acceptance**

As a professional, I want to accept or decline assigned enquiries so I can manage my workload.

**US-06 — Direct messaging**

As a client, I want to message an accepting professional within Archimart so our communication is organized.

**US-07 — Progress updates**

As a professional, I want to update engagement progress so clients know what is happening.

**US-08 — Completion confirmation**

As a client, I want to confirm or dispute completion so the engagement record reflects the actual outcome.

**US-09 — Administrator monitoring**

As an administrator, I want to view all engagements and conversations so I can monitor platform activity.

**US-10 — Administrator intervention**

As an administrator, I want to investigate reports and restrict inappropriate activity so clients and professionals are protected.

## 12. Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Unauthorized conversation access | Record-specific server authorization and security tests |
| Excessive administrator access | Permission tiers, clear disclosure and access audit logs |
| Spam and harassment | Rate limits, reporting, moderation and account suspension |
| Fake professional accounts | Approval, verification and secure profile ownership |
| Missed enquiries | Notifications, status indicators and response monitoring |
| Conflicting engagement updates | Defined lifecycle and validated transitions |
| Personal data exposure | Retention controls, access restrictions and secure storage |
| V1 compatibility issues | Incremental migrations and regression testing |
| Infrastructure complexity | Start with text-only messaging and periodic refresh |
| Users communicating off-platform | Clear policy, practical in-platform tools and proportionate monitoring |

## 13. Non-Goals

The first Archimart V2 release will not include:

- Escrow or platform-managed payments.
- Online architectural plan purchases.
- Contractor bidding marketplaces.
- Professional subscriptions.
- AI-powered design generation.
- Automated professional matching.
- Video or voice calling.
- Group conversations.
- Construction schedules and site supervision.
- Procurement and inventory management.
- Full contract administration.
- Automated dispute judgments.
- Public ratings and reviews without a separate trust-and-safety design.
- Dedicated mobile applications.
- Complex real-time chat infrastructure when simpler messaging is sufficient.

These may be considered in later releases after product and operational validation.

## 14. Release Dependencies

V2 implementation depends on:

1. Stable V1 production deployment.
2. Verified production database and administrator access.
3. Approved authentication and role migration design.
4. A tested professional profile ownership process.
5. Updated privacy and conversation-monitoring disclosures.
6. Approved message and engagement retention rules.
7. Basic reporting and administrative intervention capabilities before messaging reaches public users.
8. Successful automated, security and browser testing.

Phases may be developed separately, but public messaging must not launch without its required moderation, authorization and audit controls.

## 15. Definition of Done

V2 can be considered complete when:

- Clients and approved professionals can operate their accounts securely.
- Professional approval and verification remain under administrative control.
- Clients can submit enquiries from relevant listings.
- Professionals can accept or decline enquiries.
- Only accepted engagements permit direct messaging.
- Administrators can access all conversations through authorized, auditable controls.
- Professionals can update engagement progress.
- Clients can confirm or dispute completion.
- Administrators can monitor, restrict and resolve engagements.
- Relevant notifications work.
- Privacy disclosures and retention rules cover the new functionality.
- Automated and browser tests confirm the key workflows and access restrictions.
- Existing V1 functions continue to work.

## 16. Outstanding Stakeholder Decisions

The following remain proposed rather than approved:

1. Exact contact-sharing conditions.
2. Professional verification evidence requirements.
3. Whether profile edits require approval individually or only for sensitive fields.
4. Who may hold administrator conversation-reading permissions.
5. Whether administrators can send messages inside client–professional conversations or must use separate intervention channels.
6. What happens when a client disputes completion.
7. Message and engagement retention periods.
8. Whether a professional may accept multiple simultaneous enquiries from the same client.
9. How existing V1 enquiries will be associated with newly created accounts.
10. Notification provider and expected response-time rules.

## 17. Recommended Implementation Approach

Implement V2 incrementally:

**First:** Authentication, roles, profile ownership and dashboards.

**Second:** Enquiry ownership, acceptance and engagement tracking.

**Third:** Messaging with administrator visibility, moderation and access logging.

**Fourth:** Advanced monitoring, intervention and reporting.

**Fifth:** Notifications, performance improvements and usability refinements.

Do not modify the V1 production schema or authorization rules until the V2 migration design has been reviewed and approved.

---

**Document status:** Draft for stakeholder review. The five confirmed product decisions are approved inputs; all additional proposed rules remain subject to review.
