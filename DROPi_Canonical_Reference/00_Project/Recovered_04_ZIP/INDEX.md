# DROPi - CANONICAL DOCUMENTATION INDEX

## Project Overview
**DROPi** - Autonomous drone delivery platform with AI-assisted decision support, DronePort infrastructure, and comprehensive multi-channel operations.

**Status:** Building mobile application + canonical documentation system
**Total Documents:** 166 files
**Canonical Folders:** 10 organized sections

---

## 📁 Folder Structure

### 01_CANONICAL_DOCS (166 files)
**Complete documentation from both archive versions**
- MasterPlan (27 chapters)
- Product specifications
- Technical architecture
- Business & legal documents
- Pitch decks (EN, RO, TL)
- Contracts & templates

### 02_ARCHITECTURE
**System architecture diagrams and specifications**
- 6 core system components
- 6 platform architecture layers
- Channel architecture (C1, C2, C3, Admin)
- Data flow diagrams
- Integration points

### 03_DATABASE
**Database schema and migrations**
- Core tables
- Agent tracking
- Support management
- Simulation data
- Audit logs

### 04_API
**Backend API specifications**
- tRPC procedures
- REST endpoints
- WebSocket connections
- Authentication flows
- Error handling

### 05_MOBILE_APP
**Mobile application (React Native)**
- Role-based dashboards (29 agent types)
- Channel-specific UIs (C1, C2, C3, Admin)
- Agent orchestration interface
- Real-time monitoring
- Offline support

### 06_WEBSITE
**Marketing website (separate from mobile app)**
- Landing page
- Product information
- Pricing
- Contact
- Blog/Resources

### 07_ADMIN_DASHBOARD
**Admin control and monitoring**
- Agent monitoring
- Simulation progress
- Issue dashboard
- Support ticket management
- Analytics & reporting

### 08_AI_SIMULATION
**AI simulation engine**
- 29 agent types
- 1-month simulation workflow
- Bug detection
- Issue reporting
- Metrics collection

### 09_DEPLOYMENT
**Deployment and operations**
- Docker configuration
- Environment setup
- Database migrations
- Backup procedures
- Monitoring setup

### 10_ASSETS
**Visual assets and diagrams**
- Architecture diagrams
- Flow diagrams
- UI mockups
- Icons and images
- Brand guidelines

---

## 🎯 Core Concepts (from Masterplan)

### The 6 Fundamental Components
1. **Digital Orchestration Platform** - Coordinates all operations
2. **DronePort Network** - Physical infrastructure anchors
3. **Assisted AI (DSS)** - Decision Support System
4. **Supervised Autonomous Delivery** - Controlled flight execution
5. **Clear Role Separation** - Legal responsibility clarity
6. **Fallback & Control Mechanisms** - Safety nets

### 6 Platform Architecture Layers
1. **PUBLIC FRONT** (Website) - Risk filtering, pre-qualification
2. **APPLICATION CORE** - Execution, control, orchestration
3. **PHYSICAL CORE** (DronePort) - Infrastructure control
4. **LOGIC CORE** (AI/DSS) - Decision support
5. **OPERATIONAL CORE** - Supervised physical execution
6. **AUDIT CORE** - Traceability, compliance, GDPR

### 4 Operational Channels
| Channel | Name | Agents | Purpose |
|---------|------|--------|---------|
| C1 | Marketplace | 9 | Customer-facing e-commerce |
| C2 | COS | 8 | Contracted Operations System |
| C3 | EOC | 6 | Emergency Operations Center |
| Admin | Admin Operations | 6 | Platform administration |

**Total: 29 AI agents + 5 support management agents**

### 3 Key Infrastructure Points
- **DronePort** - Physical delivery hub
- **Pilot Transfer** - Change of pilot for long routes
- **Battery Management** - Swap batteries for extended range

---

## 📱 Mobile Application Structure

### Role-Based Dashboards (29 types)

**C1 Marketplace (9 agents):**
- Customer Dashboard
- Merchant Dashboard
- Delivery Partner Dashboard
- Support Agent Dashboard
- Analyst Dashboard
- Compliance Officer Dashboard
- Fraud Detection Dashboard
- Performance Monitor Dashboard
- Incident Responder Dashboard

**C2 COS (8 agents):**
- Operations Manager Dashboard
- Logistics Coordinator Dashboard
- Fleet Manager Dashboard
- Compliance Officer Dashboard
- Performance Monitor Dashboard
- Incident Responder Dashboard
- Data Analyst Dashboard
- Quality Assurance Dashboard

**C3 EOC (6 agents):**
- Emergency Coordinator Dashboard
- Dispatch Manager Dashboard
- Resource Allocator Dashboard
- Communication Officer Dashboard
- Data Analyst Dashboard
- Incident Commander Dashboard

**Admin (6 agents):**
- System Administrator Dashboard
- Security Officer Dashboard
- Audit Manager Dashboard
- Configuration Manager Dashboard
- Analytics Manager Dashboard
- Support Coordinator Dashboard

### Support Management (5 agents)
- Triage Agent
- Resolution Agent
- Escalation Agent
- Analysis Agent
- Coordination Agent

---

## 🔄 Development Workflow

### Phase 1: Foundation ✅
- Database schema
- Agent framework
- tRPC procedures
- Issue reporting
- Support metrics

### Phase 2: Simulation Engine (IN PROGRESS)
- Individual agent logic (all 29 agents)
- Daily simulation workflow
- 1-month simulation execution
- Bug detection & reporting
- Metrics collection

### Phase 3: Admin Dashboard (PLANNED)
- Agent monitoring UI
- Simulation progress tracking
- Issue dashboard
- Support ticket management
- Analytics & reporting

### Phase 4: Testing & Deployment (PLANNED)
- System-wide testing
- Bug fixing
- Performance optimization
- Security audit
- Production deployment

---

## 📊 Data Marking Convention

All simulated data marked with `[SIMULATED]` prefix:
- Order IDs: `[SIMULATED] ORDER-001`
- User accounts: `[SIMULATED] User Name`
- Transactions: `[SIMULATED] Transaction`
- Metrics: `[SIMULATED] Metric Value`

---

## 🎓 Key Success Criteria

1. ✅ All 29 agents defined and configured
2. ✅ Support management system implemented
3. ✅ Issue detection and reporting working
4. ⏳ 1-month simulation executable
5. ⏳ Bug detection and reporting validated
6. ⏳ Admin dashboard for monitoring
7. ⏳ Production deployment ready

---

## 📞 Project Contacts

- **Project Owner:** DROPi Team
- **QA Lead:** qa-debugger agent
- **Development Lead:** Manus Agent

---

**Last Updated:** 2026-06-25
**Status:** Phase 2 - Building Mobile Application & Canonical System
**Completion Target:** 100% (from canonical documents)

---

## Next Steps

1. ✅ Extract and organize canonical documents
2. ⏳ Analyze complete masterplan
3. ⏳ Design mobile application architecture
4. ⏳ Implement backend API
5. ⏳ Build mobile app UI
6. ⏳ Implement AI simulation engine
7. ⏳ Create admin dashboard
8. ⏳ Deploy and test
