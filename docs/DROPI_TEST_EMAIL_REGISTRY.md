# DROPi Test Email Registry

**Status:** Canonical pre-production testing registry  
**Scope:** DROPi Mobile test-role identities  
**Base inbox / Super Admin:** `dropi.deliveries@gmail.com`

> This document contains email identities only. No passwords, recovery codes, API keys, app passwords, or other secrets belong in this file.
>
> All `+human.*` and `+ai.*` Gmail addresses below use Gmail plus-addressing and deliver into the same `dropi.deliveries@gmail.com` inbox. They are distinct email identities for DROPi test-account provisioning, but they are not separate Gmail mailboxes.

## Super Admin

- `dropi.deliveries@gmail.com`

## C1 — Marketplace

| Role | Human test account | AI mirror account |
|---|---|---|
| Customer | `dropi.deliveries+human.customer@gmail.com` | `dropi.deliveries+ai.customer@gmail.com` |
| Merchant | `dropi.deliveries+human.merchant@gmail.com` | `dropi.deliveries+ai.merchant@gmail.com` |
| Delivery Partner | `dropi.deliveries+human.delivery_partner@gmail.com` | `dropi.deliveries+ai.delivery_partner@gmail.com` |
| Support Agent | `dropi.deliveries+human.support_agent@gmail.com` | `dropi.deliveries+ai.support_agent@gmail.com` |
| Analyst | `dropi.deliveries+human.analyst@gmail.com` | `dropi.deliveries+ai.analyst@gmail.com` |
| Compliance Officer | `dropi.deliveries+human.compliance_officer@gmail.com` | `dropi.deliveries+ai.compliance_officer@gmail.com` |
| Fraud Detection | `dropi.deliveries+human.fraud_detection@gmail.com` | `dropi.deliveries+ai.fraud_detection@gmail.com` |
| Performance Monitor | `dropi.deliveries+human.performance_monitor@gmail.com` | `dropi.deliveries+ai.performance_monitor@gmail.com` |
| Incident Responder | `dropi.deliveries+human.incident_responder@gmail.com` | `dropi.deliveries+ai.incident_responder@gmail.com` |

## C2 — Contracted Operations System (COS)

| Role | Human test account | AI mirror account |
|---|---|---|
| Operations Manager | `dropi.deliveries+human.operations_manager@gmail.com` | `dropi.deliveries+ai.operations_manager@gmail.com` |
| Logistics Coordinator | `dropi.deliveries+human.logistics_coordinator@gmail.com` | `dropi.deliveries+ai.logistics_coordinator@gmail.com` |
| Fleet Manager | `dropi.deliveries+human.fleet_manager@gmail.com` | `dropi.deliveries+ai.fleet_manager@gmail.com` |
| C2 Compliance Officer | `dropi.deliveries+human.c2_compliance_officer@gmail.com` | `dropi.deliveries+ai.c2_compliance_officer@gmail.com` |
| C2 Performance Monitor | `dropi.deliveries+human.c2_performance_monitor@gmail.com` | `dropi.deliveries+ai.c2_performance_monitor@gmail.com` |
| C2 Incident Responder | `dropi.deliveries+human.c2_incident_responder@gmail.com` | `dropi.deliveries+ai.c2_incident_responder@gmail.com` |
| Data Analyst | `dropi.deliveries+human.data_analyst@gmail.com` | `dropi.deliveries+ai.data_analyst@gmail.com` |
| Quality Assurance | `dropi.deliveries+human.quality_assurance@gmail.com` | `dropi.deliveries+ai.quality_assurance@gmail.com` |

## C3 — Emergency Operations Center (EOC)

| Role | Human test account | AI mirror account |
|---|---|---|
| Emergency Coordinator | `dropi.deliveries+human.emergency_coordinator@gmail.com` | `dropi.deliveries+ai.emergency_coordinator@gmail.com` |
| Dispatch Manager | `dropi.deliveries+human.dispatch_manager@gmail.com` | `dropi.deliveries+ai.dispatch_manager@gmail.com` |
| Resource Allocator | `dropi.deliveries+human.resource_allocator@gmail.com` | `dropi.deliveries+ai.resource_allocator@gmail.com` |
| Communication Officer | `dropi.deliveries+human.communication_officer@gmail.com` | `dropi.deliveries+ai.communication_officer@gmail.com` |
| C3 Data Analyst | `dropi.deliveries+human.c3_data_analyst@gmail.com` | `dropi.deliveries+ai.c3_data_analyst@gmail.com` |
| Incident Commander | `dropi.deliveries+human.incident_commander@gmail.com` | `dropi.deliveries+ai.incident_commander@gmail.com` |

## ADMIN

| Role | Human test account | AI mirror account |
|---|---|---|
| System Administrator | `dropi.deliveries+human.system_administrator@gmail.com` | `dropi.deliveries+ai.system_administrator@gmail.com` |
| Security Officer | `dropi.deliveries+human.security_officer@gmail.com` | `dropi.deliveries+ai.security_officer@gmail.com` |
| Audit Manager | `dropi.deliveries+human.audit_manager@gmail.com` | `dropi.deliveries+ai.audit_manager@gmail.com` |
| Configuration Manager | `dropi.deliveries+human.configuration_manager@gmail.com` | `dropi.deliveries+ai.configuration_manager@gmail.com` |
| Analytics Manager | `dropi.deliveries+human.analytics_manager@gmail.com` | `dropi.deliveries+ai.analytics_manager@gmail.com` |
| Support Coordinator | `dropi.deliveries+human.support_coordinator@gmail.com` | `dropi.deliveries+ai.support_coordinator@gmail.com` |

## Registry totals

- 1 real Super Admin identity
- 29 human test-role identities
- 29 AI mirror identities
- **59 total email identities**

## Provisioning convention

For every canonical role identifier `<role>`:

- Human test identity: `dropi.deliveries+human.<role>@gmail.com`
- AI mirror identity: `dropi.deliveries+ai.<role>@gmail.com`

The provisioning implementation must derive these addresses from the canonical role registry rather than maintaining a second hard-coded role list.

## Environment rule

These aliases are intended for **development, integration testing, staging, and pre-production validation**. They are not the future public operational email architecture for production. Professional sender/support/security addresses can be introduced when DROPi enters production without changing the canonical role identities themselves.
