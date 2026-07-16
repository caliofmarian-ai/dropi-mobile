# BLUEPRINT: Testing Requirements per Update

**Status:** ACTIVE — applies to ALL future updates until project completion.
**Created:** 2026-06-28
**Scope:** Every feature, fix, or upgrade delivered in DROPi Mobile.

---

## 1. Core Rule

> **For every update/feature implemented, a comprehensive test list MUST be generated and delivered alongside the implementation.**

This applies to:
- New screens/components
- Server endpoints (tRPC routers, REST API)
- Database schema changes
- Bug fixes
- Refactoring

---

## 2. Test List Structure

Each test list MUST follow this format:

```markdown
### Tests for: [Feature Name]

#### Unit Tests
- [ ] Test 1 description — expected behavior
- [ ] Test 2 description — expected behavior

#### Integration Tests
- [ ] Test 1 description — expected behavior

#### Edge Cases
- [ ] Test 1 description — expected behavior

#### Manual Verification (QA)
- [ ] Test 1 description — steps to verify
```

---

## 3. Test Categories

### 3.1 Server/API Tests
| Category | What to test |
|----------|-------------|
| **Input validation** | Invalid inputs, missing fields, wrong types, boundary values |
| **Authorization** | Correct role access, unauthorized rejection, role escalation prevention |
| **Business logic** | Correct calculations, state transitions, side effects |
| **Error handling** | Graceful failures, proper error codes, meaningful messages |
| **Database** | Correct inserts/updates, no orphaned records, constraint enforcement |

### 3.2 UI/Component Tests
| Category | What to test |
|----------|-------------|
| **Rendering** | Component renders without crash, correct data displayed |
| **Interactions** | Buttons fire handlers, navigation works, modals open/close |
| **States** | Loading, empty, error, success states all handled |
| **Accessibility** | Touch targets adequate, text readable, contrast sufficient |
| **Edge cases** | Long text, empty lists, network failure, rapid taps |

### 3.3 Integration Tests
| Category | What to test |
|----------|-------------|
| **End-to-end flows** | Complete user journey from start to finish |
| **Data consistency** | Frontend displays match backend responses |
| **Webhook delivery** | Correct payload, correct timing, retry behavior |
| **Real-time updates** | WebSocket messages arrive, UI updates accordingly |

---

## 4. Delivery Format

After each implementation, the test list is:
1. **Sent to the user in chat** — so they can manually verify on-device that the implementation works visually and functionally (not just on paper)
2. **Appended to `/home/ubuntu/dropi-mobile/tests/TEST_REGISTRY.md`** for cumulative tracking
3. **Critical tests are auto-executed** as Vitest unit tests in `/home/ubuntu/dropi-mobile/tests/` BEFORE saving checkpoint

### 4.1 Mandatory Auto-Testing (Agent Responsibility)

Before every checkpoint save, the agent MUST:
- Run `npx vitest run` to execute all existing tests
- Verify 0 test failures before proceeding
- If tests fail, fix the implementation before delivery
- Report test results (pass/fail count) in the delivery message

### 4.2 User Manual Testing (User Responsibility)

The test list sent in chat serves as a **manual QA checklist** for the user to:
- Open the app on their device (via Expo Go QR)
- Navigate to the affected screens
- Verify visual changes are visible (not just code changes)
- Confirm interactions work (buttons, filters, navigation)
- Report any discrepancies back for fixing

---

## 5. Test Naming Convention

```
tests/
  [feature-name].test.ts        — Unit tests
  [feature-name].integration.ts — Integration tests (if applicable)
```

---

## 6. Minimum Test Coverage per Update

| Update Type | Minimum Tests |
|-------------|--------------|
| New screen | 5 UI + 3 integration |
| New server endpoint | 4 unit + 2 edge case + 1 auth |
| Database migration | 2 schema validation + 1 constraint |
| Bug fix | 1 regression test + 1 edge case |
| Refactoring | All existing tests must pass |

---

## 7. Retroactive Test Lists

For features already implemented without test lists, generate retroactive test lists when:
- The feature is modified
- A bug is found in the feature
- The user requests it

---

## 8. Example: Pilot Leaderboard Screen (Retroactive)

### Tests for: Pilot Leaderboard Screen

#### Unit Tests (Server)
- [ ] `getLeaderboard` returns paginated results with correct limit/offset
- [ ] `getLeaderboard` filters by minDeliveries threshold correctly
- [ ] `getLeaderboard` returns rank starting from offset+1
- [ ] `getLeaderboard` returns empty array when no pilots exist
- [ ] `getLeaderboard` only includes active users (isActive = true)

#### Unit Tests (UI)
- [ ] Leaderboard screen renders without crash
- [ ] Zone filter buttons display all 5 zones + "All"
- [ ] Sort selector shows 4 options (Rating, Completion, Deliveries, On-Time)
- [ ] Rank badges show correct colors (gold #1, silver #2, bronze #3)
- [ ] COS eligibility badge appears only for eligible pilots
- [ ] Performance metrics display with correct formatting (%.1f)
- [ ] Empty state shows "No pilots found" message

#### Integration Tests
- [ ] Changing zone filter updates displayed pilots
- [ ] Changing sort order re-sorts the list correctly
- [ ] Pull-to-refresh triggers data refetch
- [ ] Loading state shows spinner during fetch

#### Edge Cases
- [ ] Handles null/undefined rating values gracefully (parseFloat fallback)
- [ ] Handles pilots with 0 deliveries
- [ ] Handles very long pilot names (text truncation)
- [ ] Handles network failure with error state

---

*This blueprint is permanent and applies to all future DROPi Mobile development.*
