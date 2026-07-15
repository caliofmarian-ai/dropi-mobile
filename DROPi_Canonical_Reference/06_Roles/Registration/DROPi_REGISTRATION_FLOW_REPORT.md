# DROPi — User Registration Flow Report

**Version:** 4d363e85  
**Date:** 2026-06-27  
**Status:** Implemented & Tested

---

## 1. Overview

The DROPi registration system follows a **role-based auto-activation model** where basic marketplace participants (customers, merchants, delivery partners) can self-register without admin approval, while operational and supervisory roles require explicit admin authorization.

---

## 2. Registration Screen (UI)

### What the User Sees

| Step | Element | Description |
|------|---------|-------------|
| 1 | Account Type Selector | Three options: Customer, Merchant, Delivery Partner |
| 2 | Merchant Sub-Type (conditional) | Only visible when "Merchant" is selected |
| 3 | Full Name | Text input |
| 4 | Email | Email input |
| 5 | Password | Min 8 chars, 1 uppercase, 1 number |
| 6 | Confirm Password | Must match password |
| 7 | Create Account button | Submits registration |

### What the User Does NOT See

- No channel selector (C1/C2/C3/ADMIN)
- No role selector (29 roles)
- No admin approval step
- No verification code at registration

---

## 3. Account Types Available at Registration

### 3.1 Customer

| Property | Value |
|----------|-------|
| **Icon** | 🛒 |
| **Label** | "Customer" |
| **Description** | "Buy products from marketplace" |
| **DROPi Role** | `customer` |
| **Channel** | C1 (Marketplace) |
| **Auto-Activated** | Yes |
| **Verification Required** | No |
| **Immediate Access** | Full marketplace browsing, ordering, cart, checkout |

### 3.2 Merchant

| Property | Value |
|----------|-------|
| **Icon** | 🏪 |
| **Label** | "Merchant" |
| **Description** | "Sell products on marketplace" |
| **DROPi Role** | `merchant` |
| **Channel** | C1 (Marketplace) |
| **Auto-Activated** | Yes |
| **Verification Required** | No |
| **Immediate Access** | Product listing, order management, store dashboard |

#### Merchant Sub-Types

When "Merchant" is selected, a secondary selector appears with 4 options:

| Sub-Type ID | Label | Description |
|-------------|-------|-------------|
| `verified_business` | Registered Business | Licensed company or store |
| `community_seller` | Community Seller | Local community vendor |
| `artisan` | Artisan | Handmade & custom products |
| `p2p_seller` | P2P Seller | Peer-to-peer selling |

All sub-types are auto-activated. The sub-type affects:
- Profile badge/label displayed on marketplace
- Product categories available (future implementation)
- Trust level indicators (future implementation)

### 3.3 Delivery Partner

| Property | Value |
|----------|-------|
| **Icon** | 🚀 |
| **Label** | "Delivery Partner" |
| **Description** | "Deliver orders (verification required)" |
| **DROPi Role** | `delivery_partner` |
| **Channel** | C1 (Marketplace) |
| **Auto-Activated** | Yes (account created) |
| **Verification Required** | Yes (cannot receive missions until verified) |
| **Immediate Access** | Profile, settings, verification submission form |
| **Post-Verification Access** | Mission board, active deliveries, earnings |

#### Delivery Partner Warning Notice

A yellow warning banner is displayed when this type is selected:

> "Note: Delivery partners require verification before receiving missions. You will need to submit your credentials after registration."

---

## 4. Accounts Requiring Admin Approval (NOT Available at Registration)

These roles can only be assigned by an admin through the admin panel:

| Role | Channel | Reason |
|------|---------|--------|
| Operations Manager | C2 | Supervisory access |
| Fleet Manager | C2 | Fleet control authority |
| Emergency Coordinator | C3 | Emergency operations access |
| Safety Officer | C3 | Safety override authority |
| DronePort Operator | C2/C3 | Physical infrastructure control |
| System Administrator | ADMIN | Full platform access |
| Finance Controller | ADMIN | Financial data access |
| Compliance Officer | ADMIN | Audit and legal access |
| All other operational roles | Various | Require qualification verification |

---

## 5. Technical Implementation

### 5.1 Client-Side (register.tsx)

```
User selects account type → Maps to dropiRole
  - customer → dropiRole: "customer"
  - merchant → dropiRole: "merchant"
  - delivery_partner → dropiRole: "delivery_partner"

All accounts → channel: "C1" (hardcoded)
All accounts → zone: "Manila-Central" (default)

Merchant → merchantSubType: selected sub-type
Delivery Partner → isVerified: false
Customer/Merchant → isVerified: true
```

### 5.2 Server-Side (auth-router.ts)

```
Register endpoint receives:
  - email (required)
  - password (required, validated)
  - name (required)
  - dropiRole (default: "customer")
  - channel (default: "C1")
  - zone (optional)

Server actions:
  1. Check email uniqueness
  2. Hash password (bcrypt, 12 rounds)
  3. Create user in database
  4. Create session token (JWT, 7-day expiry)
  5. Store session in sessions table
  6. Create audit log entry
  7. Return user object + token
```

### 5.3 Database Fields Set at Registration

| Field | Customer | Merchant | Delivery Partner |
|-------|----------|----------|-----------------|
| `email` | ✓ (input) | ✓ (input) | ✓ (input) |
| `name` | ✓ (input) | ✓ (input) | ✓ (input) |
| `passwordHash` | ✓ (bcrypt) | ✓ (bcrypt) | ✓ (bcrypt) |
| `dropiRole` | "customer" | "merchant" | "delivery_partner" |
| `channel` | "C1" | "C1" | "C1" |
| `zone` | "Manila-Central" | "Manila-Central" | "Manila-Central" |
| `isActive` | true | true | true |
| `isAIAgent` | false | false | false |
| `failedLoginAttempts` | 0 | 0 | 0 |

---

## 6. Password Requirements

| Requirement | Rule |
|-------------|------|
| Minimum length | 8 characters |
| Uppercase | At least 1 uppercase letter |
| Number | At least 1 digit |
| Confirmation | Must match confirm password field |

---

## 7. Post-Registration Flow

### Customer
```
Register → Auto-login → Home screen (Marketplace tab) → Browse & order immediately
```

### Merchant
```
Register → Auto-login → Home screen → Can list products immediately
```

### Delivery Partner
```
Register → Auto-login → Home screen → Profile shows "Unverified" badge
→ Must submit credentials (future: document upload screen)
→ Admin reviews and approves
→ Status changes to "Verified"
→ Can now receive and accept delivery missions
```

---

## 8. Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 12 salt rounds |
| Email uniqueness | Database constraint + server check |
| Input validation | Zod schemas (client + server) |
| Session management | JWT with 7-day expiry |
| Rate limiting | Per-email, 10 attempts / 15 min |
| Audit logging | Every registration logged with IP, device, timestamp |
| No role escalation | Users cannot self-assign operational roles |

---

## 9. Audit Trail

Every registration creates an audit log entry with:
- `action`: "auth.register"
- `userId`: newly created user ID
- `userRole`: assigned role
- `channel`: "C1"
- `severity`: "info"
- `ipAddress`: client IP
- `userAgent`: device information
- `details`: { email, role, channel }

---

## 10. Known Limitations & Future Work

| Item | Status | Notes |
|------|--------|-------|
| Delivery Partner verification screen | Pending | Document upload + admin review |
| Admin role approval panel | Pending | For operational roles |
| Email verification at registration | Not implemented | Could add email confirmation step |
| Zone auto-detection | Not implemented | Currently defaults to "Manila-Central" |
| Merchant sub-type functionality | Partial | Badge only, no category filtering yet |
| "Apply for Role" screen (post-login) | Pending | For users wanting operational roles |

---

## 11. Summary

The registration flow is designed with the canonical DROPi principle: **basic marketplace participants self-register; operational authority is granted by leadership**. This ensures platform security while minimizing friction for customers, merchants, and delivery partners who form the core marketplace ecosystem.
