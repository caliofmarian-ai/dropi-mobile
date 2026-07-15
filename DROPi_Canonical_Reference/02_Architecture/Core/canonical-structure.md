# DROPi Canonical App Structure Reference

## 4 Operational Channels

### C1: MARKETPLACE (9 agents)
1. Customer - orders, tracking, history
2. Merchant - listings, order queue, preparation
3. Delivery Partner (Pilot) - missions, flight supervision, STOP/FALLBACK
4. Support Agent - ticket management, customer help
5. Analyst - data analysis, reports
6. Compliance Officer - regulation checks, audits
7. Fraud Detection - anomaly detection, flagging
8. Performance Monitor - KPIs, SLA tracking
9. Incident Responder - issue resolution

### C2: COS - Contracted Operations System (8 agents)
1. Operations Manager - oversee operations, approve contracts
2. Logistics Coordinator - coordinate deliveries, manage schedules
3. Fleet Manager - drone fleet status, maintenance
4. Compliance Officer - regulation compliance
5. Performance Monitor - SLA monitoring
6. Incident Responder - issue handling
7. Data Analyst - operational analytics
8. Quality Assurance - quality checks

### C3: EOC - Emergency Operations Center (6 agents)
1. Emergency Coordinator - receive alerts, dispatch
2. Dispatch Manager - resource dispatch
3. Resource Allocator - allocate drones/personnel
4. Communication Officer - team communication
5. Data Analyst - response analytics
6. Incident Commander - overall command

### ADMIN: Platform Administration (6 agents)
1. System Administrator - system management, users
2. Security Officer - security monitoring
3. Audit Manager - audit oversight
4. Configuration Manager - platform config
5. Analytics Manager - BI, dashboards
6. Support Coordinator - support oversight

## Auxiliary Modules
- DronePort Management (physical infrastructure)
- Authorities Interface (EASA, FAA, CAAP compliance)
- Accounting (financial flows, invoices, commissions)

## 6 Platform Layers
1. PUBLIC FRONT (Website) - NOT in mobile app
2. APPLICATION CORE - The mobile app itself
3. PHYSICAL CORE (DronePort) - Infrastructure management
4. LOGIC CORE (AI/DSS) - Decision support
5. OPERATIONAL CORE - Flight execution
6. AUDIT CORE - Logging, compliance
