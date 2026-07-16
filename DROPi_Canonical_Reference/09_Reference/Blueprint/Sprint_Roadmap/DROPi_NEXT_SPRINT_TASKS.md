# DROPi — Sprint 3-4 Task List

**Based on:** DROPi_REGISTRATION_FLOW_REPORT.md (Recommendations Section)  
**Sprint Goal:** Complete the user lifecycle — from registration to role activation  
**Estimated Duration:** 2 sessions  
**Priority Order:** Critical → High → Medium

---

## Critical Priority (Blocks Core Functionality)

### Task 1: Delivery Partner Verification Screen

**Why:** Pilots register but cannot receive missions until verified. Without this screen, the delivery system is non-functional.

| Step | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 1.1 | Create `/app/verification.tsx` screen | Screen accessible from Delivery Partner profile |
| 1.2 | Document upload UI (photo of license/permit) | Camera + gallery picker, preview before submit |
| 1.3 | Form fields: license number, expiry date, vehicle type | Validated inputs with error messages |
| 1.4 | Server endpoint `dropiAuth.submitVerification` | Stores document metadata + file in S3 storage |
| 1.5 | Status display: Pending / Approved / Rejected | Real-time status shown on profile |
| 1.6 | Notification to admin on new submission | Audit log + push notification to admin |
| 1.7 | Block mission acceptance if unverified | Server-side guard on mission endpoints |

**Database changes:**
```
verifications table:
  - id, userId, documentType, documentUrl, licenseNumber
  - expiryDate, vehicleType, status (pending/approved/rejected)
  - reviewedBy, reviewedAt, rejectionReason
  - createdAt, updatedAt
```

---

### Task 2: Admin Role Approval Panel

**Why:** Operational roles (Ops Manager, Emergency Coordinator, etc.) require admin authorization. Without this panel, no one can be promoted to operational roles.

| Step | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 2.1 | Create `/app/admin/verifications.tsx` screen | List of pending verification requests |
| 2.2 | Verification detail view | Shows uploaded documents, user info, submission date |
| 2.3 | Approve/Reject buttons with reason field | Admin can approve or reject with explanation |
| 2.4 | Server endpoint `adminAuth.reviewVerification` | Updates verification status + user isVerified flag |
| 2.5 | Email notification to user on decision | SMTP sends approval/rejection email |
| 2.6 | Audit log for every approval/rejection | L6 compliance: who approved, when, why |
| 2.7 | Filter/sort: by status, date, role type | Admin can quickly find pending items |

---

### Task 3: "Apply for Role" Screen (Post-Login)

**Why:** Users who want operational roles (C2/C3) need a way to request them. This is the canonical path: user applies → admin evaluates → admin approves.

| Step | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 3.1 | Create `/app/apply-role.tsx` screen | Accessible from profile/settings |
| 3.2 | Channel selector (C1/C2/C3) | Shows available roles per channel |
| 3.3 | Role selector (filtered by channel) | Only shows roles that require application |
| 3.4 | Motivation/qualification text field | User explains why they qualify |
| 3.5 | Document upload (CV, certificates) | Optional supporting documents |
| 3.6 | Server endpoint `dropiAuth.applyForRole` | Creates role application record |
| 3.7 | Admin view: list of role applications | Integrated into admin panel |
| 3.8 | Admin approve/reject with role assignment | On approval, user's dropiRole + channel update |

**Database changes:**
```
role_applications table:
  - id, userId, requestedRole, requestedChannel
  - motivation, documentUrls (JSON array)
  - status (pending/approved/rejected/withdrawn)
  - reviewedBy, reviewedAt, rejectionReason
  - createdAt, updatedAt
```

---

## High Priority (Security & Trust)

### Task 4: Email Verification at Registration

**Why:** Currently anyone can register with a fake email. This prevents account recovery and enables spam accounts.

| Step | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 4.1 | Generate 6-digit verification code at register | Same pattern as password recovery |
| 4.2 | Send verification email via SMTP | Email from dropi.deliveries@gmail.com |
| 4.3 | Add "Verify Email" screen after register | User enters code from email |
| 4.4 | Account status: `emailVerified: false` until confirmed | DB field added |
| 4.5 | Restrict actions for unverified emails | Cannot place orders or list products |
| 4.6 | Resend code button (with rate limiting) | Max 3 resends per hour |
| 4.7 | Auto-expire unverified accounts after 7 days | Cleanup job |

**Database changes:**
```
users table additions:
  - emailVerified: boolean (default false)
  - emailVerificationCode: string (nullable)
  - emailVerificationExpiry: timestamp (nullable)
```

---

### Task 5: Welcome Email on Registration

**Why:** Professional platforms send a welcome email confirming account creation. Builds trust and provides reference.

| Step | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 5.1 | HTML email template: welcome + account details | Branded, includes account type info |
| 5.2 | Send automatically after successful register | Via existing SMTP transporter |
| 5.3 | Include: name, account type, next steps | Personalized content |
| 5.4 | For Delivery Partners: include verification instructions | Clear path to activation |

---

## Medium Priority (UX Improvements)

### Task 6: Zone Auto-Detection

**Why:** Currently hardcoded to "Manila-Central". Should detect user's actual location or let them choose.

| Step | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 6.1 | Add zone selector to register screen | Dropdown with available zones |
| 6.2 | Define zone list (Manila-Central, Manila-North, Manila-South, Cebu, Davao, etc.) | Configurable list |
| 6.3 | Optional: GPS-based suggestion | Request location permission, suggest nearest zone |
| 6.4 | Zone affects marketplace visibility | Users see products from their zone first |

---

### Task 7: Merchant Sub-Type Functionality

**Why:** Sub-types exist but don't affect anything yet. Should differentiate the experience.

| Step | Description | Acceptance Criteria |
|------|-------------|---------------------|
| 7.1 | Display badge on merchant profile | "Artisan", "Business", "Community", "P2P" |
| 7.2 | Filter marketplace by merchant type | Buyers can filter by seller type |
| 7.3 | Category suggestions based on sub-type | Artisans see handmade categories first |
| 7.4 | Trust indicators per sub-type | Verified Business gets higher trust badge |

---

## Summary Table

| # | Task | Priority | Estimated Effort | Dependencies |
|---|------|----------|-----------------|--------------|
| 1 | Delivery Partner Verification Screen | Critical | 3-4 hours | S3 storage for documents |
| 2 | Admin Role Approval Panel | Critical | 3-4 hours | Task 1 (reviews verifications) |
| 3 | "Apply for Role" Screen | Critical | 2-3 hours | Task 2 (admin reviews applications) |
| 4 | Email Verification at Registration | High | 2-3 hours | SMTP already configured |
| 5 | Welcome Email on Registration | High | 1 hour | SMTP already configured |
| 6 | Zone Auto-Detection | Medium | 1-2 hours | Zone list definition |
| 7 | Merchant Sub-Type Functionality | Medium | 2 hours | Marketplace filtering logic |

**Total estimated effort:** 14-19 hours across 2 sessions

---

## Sprint Completion Criteria

- [ ] Delivery Partner can submit verification documents
- [ ] Admin can approve/reject verifications
- [ ] Users can apply for operational roles (C2/C3)
- [ ] Admin can approve/reject role applications
- [ ] Email verification code sent at registration
- [ ] Welcome email sent on successful registration
- [ ] All actions generate audit logs (L6 compliance)
- [ ] Zero Romanian text in new screens
- [ ] TypeScript compiles with 0 errors
- [ ] qa-debugger validation passes

---

## Canonical References

| Task | Blueprint Reference | Layer |
|------|-------------------|-------|
| Verification | L2 Phase 2.3 — User Lifecycle | APPLICATION CORE |
| Admin Panel | L2 Phase 2.5 — Admin Dashboard | APPLICATION CORE |
| Apply for Role | L2 Phase 2.3 — Role Management | APPLICATION CORE |
| Email Verification | L6 Phase 6.2 — Identity Audit | AUDIT CORE |
| Zone Detection | L2 Phase 2.4 — Geolocation | APPLICATION CORE |
