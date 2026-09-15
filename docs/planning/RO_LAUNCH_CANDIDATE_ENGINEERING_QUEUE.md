# DROPi Romania — Candidate Engineering Queue Derived from the Legal MVP

> **STATUS: CANDIDATE / PRE-OWNER / NON-CANONICAL**
> **Issue:** #500
> **Parent:** #492
> **Prepared:** 2026-09-15
> **Source branch:** `planning/ro-launch-backlog-candidate`
> **Legal evidence under review:** #504 / #493–#499

This document is the first backlog-reconciliation pass requested by #500. It does **not** authorize implementation reprioritization, does not update `canonical/CURRENT_STATE.md`, and does not convert a pending legal requirement into implementation permission.

Final promotion requires #501 and an explicit Project Owner outcome.

## 1. Candidate first-launch envelope

The engineering queue is derived from the current narrow Romania hypothesis, not from the full DROPi vision:

```text
Romanian operating entity
  -> verified professional merchants only
  -> controlled C1 Marketplace
  -> narrow low-complexity non-food allowlist
  -> merchant as seller of record candidate
  -> external regulated PSP
  -> merchant fulfilment first
  -> optional DROPi postal resale only after ANCOM classification / notification / contracts
  -> external effective postal carrier
  -> one restricted Romanian pilot geography
```

Explicitly outside the first-launch envelope:

- private/P2P/community sellers;
- food and other deliberately excluded regulated/safety-sensitive categories;
- proprietary DROPi rider/driver fleet;
- Passenger Mobility;
- drone delivery as a first-launch requirement;
- DronePort physical infrastructure;
- Cooperative Hub implementation;
- C2 and C3 public/operational launch;
- internal DROPi customer-fund wallet / stored value / legal escrow;
- crypto/token settlement.

## 2. Classification meanings

- `LAUNCH-P0` — candidate prerequisite for the first controlled public pilot.
- `LAUNCH-P1` — useful immediately after pilot / for scale, but not required to prove the first bounded transaction loop.
- `FOUNDATION` — reusable and safe to execute without presuming a blocked legal/business outcome.
- `LATER-SERVICE` — belongs to a service explicitly outside the first-launch envelope.
- `HOLD-LEGAL` — implementation semantics depend on unresolved legal/authority/provider evidence.
- `HOLD-OWNER` — requires an explicit Product Owner business/product decision.
- `SPLIT-REQUIRED` — issue mixes launch-critical and later work and must not be executed wholesale.

A single issue may have a primary class plus a hold condition, e.g. `LAUNCH-P0 / HOLD-LEGAL`.

## 3. Deterministic candidate execution order

### Wave A — keep the repository and real accounts safe enough to execute a launch backlog

| Order | Existing issue / candidate slice | Candidate class | Reason |
|---:|---|---|---|
| A1 | #476 Protect `main` with required CI checks and PR-only promotion | `LAUNCH-P0` | The legal/launch model is useless if ordinary changes can bypass reviewed CI and source-of-truth discipline. |
| A2 | #401 Password-reset verification against the addressed account | `LAUNCH-P0` | Real customer/merchant account recovery is a core public-account capability, unlike Phantom/test-only conveniences. |
| A3 | #433 Coordinated Expo/RN dependency governance | `FOUNDATION` | The 2026-09-15 red-screen incident proved native dependency drift can break the owner APK; the permanent runtime guards are already partly delivered by #503. |
| A4 | #273 scoped release acceptance / rollback evidence | `LAUNCH-P0` candidate | First pilot needs an explicit build/runtime acceptance and rollback package; broad later QA scope can remain outside. |
| A5 | #277 post-release verification / rollback triggers | `LAUNCH-P0` candidate | A controlled public pilot needs a defined stop/rollback condition rather than code-only PASS. |
| A6 | #270 critical tRPC coverage — **launch slice only** | `SPLIT-REQUIRED -> LAUNCH-P0` | Test the exact auth, merchant, listing, checkout, payment, withdrawal, fulfilment and privacy contracts; do not make every future service test a launch blocker. |

### Wave B — freeze the legal/product contract before implementing law-dependent behavior

These are evidence gates, not developer feature tasks:

| Order | Issue | Candidate class | Blocks |
|---:|---|---|---|
| B1 | #493 entity / tax / CAEN / seller-of-record | `HOLD-LEGAL + HOLD-OWNER` | Entity, invoices, fee model, role allocation. |
| B2 | #494 Marketplace legal/control pack | `HOLD-LEGAL` | Ranking, seller status, responsibility disclosures, withdrawal, DSA/GPSR controls. |
| B3 | #495 PSP / settlement / refund / invoicing | `HOLD-LEGAL` | Real payment implementation. |
| B4 | #497 first category + pilot zone | `HOLD-OWNER + HOLD-LEGAL` | Catalog allowlist and geographic activation. |
| B5 | #498 contracts / privacy / retention / support | `HOLD-LEGAL` | Production data, terms, complaints, incident ownership. |
| B6 | #496 postal role / ANCOM | `HOLD-LEGAL` for integrated postal resale; **not required to block merchant-only fulfilment** | DROPi-integrated postal option. |
| B7 | #499 controlled legal corpus | `FOUNDATION / LEGAL-P0` | Provides mechanical provenance and blockers; PR #504 remains draft. |

### Wave C — Marketplace core for verified professional merchants

The current #71 Marketplace epic stays relevant, but its historical P2P-heavy children must not define the first launch.

| Existing issue | Candidate classification | Reconciliation |
|---|---|---|
| #71 Marketplace C1 | `LAUNCH-P0` parent, **scope-reduced for first pilot** | First-pilot completion should be evaluated against professional merchants + approved category/zone + lawful checkout, not against all P2P/community-seller ambitions. |
| #362 P2P currency/location/crypto/expiry | `SPLIT-REQUIRED` | Extract only generally reusable RON transaction-currency correctness and private governed address/coordinate requirements if needed by professional merchant checkout. P2P expiry, PHP, crypto/token architecture and community-offer UX are later. |
| #364 P2P media/classification/attestation | `LATER-SERVICE` | P2P/private sellers are out of first launch. Product-category and product-safety controls needed for professional merchants should be implemented through a new merchant-specific launch slice, not by pretending P2P policy is the same contract. |
| #169 EN/RO/TL selector | `SPLIT-REQUIRED` | Romanian launch copy/legal/customer surfaces need an explicit Romania localization decision; Tagalog is later. Do not make full three-language completion a launch blocker. |
| #166 canonical schema/migrations | `FOUNDATION`, with `LAUNCH-P0` scoped schema additions | Reuse current schema/migration authority; add only evidence-backed fields needed by the approved launch controls. |
| #167 mock-to-live reads (child of #100) | `FOUNDATION / LAUNCH-P0 where launch UI still uses mock data` | No public launch screen may present demo fixtures as operational truth. |
| #70 / #102 / #103 Order Management | `LAUNCH-P0` scoped | Customer/merchant order lifecycle, durable history and authorization remain core; own-pilot mission behavior is not required for merchant fulfilment. |

### Wave D — new Marketplace compliance implementation slices required after B2/B4

No existing broad issue cleanly represents the post-2026 legal control contract. #500 should create bounded implementation issues **only after their corresponding legal rows are approved for design**:

1. **Professional merchant onboarding and seller-status evidence** — merchant identity/business evidence, seller-of-record representation, policy version and review state.
2. **Ranking + responsibility disclosure contract** — main ranking parameters and seller/platform responsibility allocation, versioned and rendered before binding contract where required.
3. **GPSR product-safety listing gate** — allowlisted category schema, economic-operator/safety information, Safety Gate/contact/process hooks, unsafe-product notice/recall case state.
4. **Online withdrawal + durable acknowledgement** — covered orders receive the legally required withdrawal UI/confirmation/receipt and immutable audit evidence.
5. **Conformity / complaint / return responsibility routing** — merchant versus DROPi support paths driven by the approved responsibility matrix.
6. **Zone/category activation gate** — listing/order availability must be deny-by-default outside the owner-approved pilot category and geography.

Candidate class for these slices: `LAUNCH-P0 / HOLD-LEGAL` until #494/#497/#498 supply approved design contracts.

### Wave E — payments: keep provider abstraction, remove wallet as an MVP prerequisite

| Existing issue | Candidate classification | Reconciliation |
|---|---|---|
| #75 Payments & Wallet | `SPLIT-REQUIRED` | Rename/rebaseline first-launch objective around external PSP payments and reconciliation; do not require internal wallet completion. |
| #186 provider abstraction | `LAUNCH-P0 / HOLD-LEGAL` | Re-target from generic “Zone 0” to the selected Romania PSP and approved #495 money flow. |
| #187 real/promo wallet ledgers | `LATER-SERVICE / HOLD-LEGAL` | Internal customer balances/stored-value-like behavior are not first-launch requirements. Ledger/reconciliation evidence for external transactions should be a smaller separate slice. |
| #188 refund/cancellation policy engine | `LAUNCH-P0 / HOLD-LEGAL` but **re-scope** | Implement only after #494/#495 fix consumer rights, merchant responsibility and PSP refund semantics. |
| #189 commissions/pilot compensation/payout requests | `SPLIT-REQUIRED` | Platform/merchant fee settlement may be launch-relevant; delivery-partner compensation/payout is later because proprietary couriers are out of first launch. |

New candidate P0 slice after #495: **PSP transaction + fee-allocation + refund + reconciliation ledger**, storing provider references/evidence without creating a DROPi customer wallet.

### Wave F — fulfilment: merchant-first; postal integration is a separately gated upgrade

| Existing issue | Candidate classification | Reconciliation |
|---|---|---|
| Merchant fulfilment path | `LAUNCH-P0` new bounded slice | Merchant records fulfilment method, shipment/collection status and evidence without DROPi claiming a postal role it has not activated. |
| #496 integrated postal resale | `LAUNCH-P0 / HOLD-LEGAL` only if owner chooses it for first pilot; otherwise `LAUNCH-P1` | ANCOM classification/notification/contracts must precede the integrated postal option. |
| #425 synthetic `AUTO` truthfulness | `FOUNDATION`; escalates to `LAUNCH-P0` if transport mode is exposed in first-pilot order UI/API | Unknown transport authority must remain unknown. For merchant fulfilment, the simplest P0 path may be to avoid inventing a DROPi vehicle assignment entirely. |
| #431 Active delivery-partner tab | `LATER-SERVICE` | Own delivery-partner execution is outside first pilot. Hide/disable honestly rather than finishing a proprietary-fleet flow. |
| #370 mission screen lifecycle/checklist | `LATER-SERVICE` | Important before DROPi operates delivery missions, not before merchant/external-carrier fulfilment. |
| #396 / #426 map-first live tracking + authoritative fixed points | `LAUNCH-P1` at earliest; `LATER-SERVICE` if only own-fleet tracking consumes them | External carrier/merchant fulfilment does not require DROPi to build a full real-time fleet map first. |
| #193 generic pilot/drone live map | `LATER-SERVICE` | Drone/pilot operational execution is outside first launch. |
| #254–#259 GPS/geofence/weather/fleet authority | `LATER-SERVICE` | Required when DROPi owns/operates or dispatches its own modes, not for merchant-first fulfilment. |
| #246–#253 mission execution / STOP / fallback / POD engine | `LATER-SERVICE` | Do not force proprietary mission machinery into the first Marketplace launch. A carrier/merchant fulfilment evidence model should be separate. |

### Wave G — privacy, support and public-facing truth

| Existing issue / new slice | Candidate class | Reconciliation |
|---|---|---|
| #498 approved data/contract/support matrix | `HOLD-LEGAL` evidence gate | Determines production collection/access/retention. |
| New launch privacy enforcement slice | `LAUNCH-P0 / HOLD-LEGAL` | Apply flow-specific role, purpose, legal basis, retention, access and deletion/legal-hold rules to the actual first-pilot fields. |
| #192 in-app messaging/support chat | `LAUNCH-P1` | First pilot can use a simpler governed support/contact route if approved; a full chat product need not block the initial transaction loop. |
| #263 pricing/FAQ/contact/policy pages | `SPLIT-REQUIRED -> LAUNCH-P0 for legal/contact/policy surfaces; pricing only after approved commercial model` | Public/legal pages must not publish invented prices or unapproved terms. |
| #262 landing/how-it-works/audience pages | `LAUNCH-P1` | Useful for public rollout, but not required to prove the bounded legal/transaction pilot if invite-only. |
| #264 SEO/blog | `LAUNCH-P1` | Growth follows legal product proof. |
| #265 investor/public brand assets | `LATER-SERVICE / FOUNDATION` | Must reflect truthful product state but does not block first pilot. |
| #475 repository/public identity drift | `FOUNDATION` | Correct product truthfulness, but not an operational permission gate. |
| #468 static DronePort/logistics data truthfulness | `FOUNDATION`; P0 only if surface remains accessible in pilot | Safest first-launch option is hide/governed-unavailable for non-live physical-network surfaces. |

### Wave H — pilot QA and controlled release

| Existing issue | Candidate classification | Reconciliation |
|---|---|---|
| #270 critical integration tests | `SPLIT-REQUIRED -> LAUNCH-P0 slice` | Cover first-pilot auth→merchant→listing→checkout→payment→fulfilment→withdrawal/refund→support/privacy only. |
| #271 E2E/load suites | `LAUNCH-P1`; minimal launch smoke E2E extracted as P0 | Full load/simulation program should not delay the first bounded pilot. |
| #272 QA-debugger discipline | `FOUNDATION / LAUNCH-P0 governance` | Reuse as evidence format for the scoped release gate. |
| #273 release acceptance/rollback package | `LAUNCH-P0` candidate | Required before owner-authorized pilot artifact. |
| #274 Railway CI/CD promotion | `FOUNDATION / LAUNCH-P1` | Current Railway operation already exists; improve promotion discipline without pretending a full multi-environment program is required before every P0 feature. |
| #275 Android internal distribution | `FOUNDATION — PARTIALLY SATISFIED` | #503 created a working standalone owner APK path; issue should be re-audited and narrowed before more work. |
| #276 versioning/release notes | `FOUNDATION / LAUNCH-P1` | Important for repeatable releases; current runtime version guards already improved. |
| #277 post-release verification | `LAUNCH-P0` candidate for controlled pilot | Define operational health and rollback trigger immediately after deployment. |

## 4. Whole service families moved out of the first-launch critical path

### C2 / controlled contracted operations

- #72, #106, #107, #178–#181: `LATER-SERVICE`.
- Preserve them; do not close merely because C2 is not the Romanian Marketplace MVP.

### C3 / emergency operations

- #73, #108, #109, #182–#185: `LATER-SERVICE`.
- Keep any reusable security/audit primitives only if they are genuinely shared and do not force C3 semantics into C1.

### Passenger Mobility

- #460 and #453–#459: `LATER-SERVICE / HOLD-LEGAL`.
- Passenger authority must remain independent from parcel/Marketplace capability.

### Cooperative Hub

- #481 and #482–#489: `LATER-SERVICE` for implementation; research may continue independently.
- Do not let cooperative formation/governance become a dependency of the first ordinary professional-merchant Marketplace.

### Own multimodal fleet, DronePort, drone safety and physical core

- #230–#261 and their parent epics/batches: `LATER-SERVICE` unless a small reusable truthfulness/safety primitive is explicitly extracted.
- First pilot must not require a real DronePort, fleet registry, battery system, drone CONOPS, weather/no-fly engine or multimodal handoff machinery.

### P2P / community seller expansion

- #364 and P2P-only parts of #362: `LATER-SERVICE`.
- Do not use private-seller complexity to define the legal or technical minimum for verified professional merchants.

## 5. Owner decisions that should not block the Romania legal MVP

| Issue | Candidate class | Proposed disposition |
|---|---|---|
| #278 biometric authentication | `LATER-SERVICE / HOLD-OWNER` | Password/session/account-recovery path first; biometrics are convenience/security enhancement after baseline. |
| #279 WebSocket vs polling “Zone 0” | `FOUNDATION — STALE DECISION TO RECONCILE` | Repository already contains and has physically proven authenticated WebSocket tracking; reassess wording instead of re-deciding from zero. |
| #280 offline-first strategy | `LAUNCH-P1 / HOLD-OWNER` | Do not build full offline mutation sync as a first-pilot prerequisite unless chosen geography/operations evidence makes it necessary. |
| #281 physical DronePort timeline | `LATER-SERVICE / HOLD-OWNER` | Outside first launch. |
| #282 AI-agent activation sequence | `LATER-SERVICE / HOLD-OWNER` | Does not block lawful Marketplace pilot. |
| #284 drone client-presence policy | `LATER-SERVICE / HOLD-LEGAL` | Drone execution later. |
| #285 Philippines/EASA scope | `LATER-SERVICE / HOLD-LEGAL` | Philippines/drone expansion later. |

## 6. Candidate P0 implementation issues that are missing from the old roadmap

Do **not** create these as executable implementation issues until the corresponding legal row is approved for design. #500 should be ready to materialize them immediately after #501 authorization:

1. `RO-MVP-MERCHANT-ONBOARDING` — professional merchant identity/status/responsibility evidence and activation state.
2. `RO-MVP-MARKETPLACE-DISCLOSURES` — ranking and seller/platform responsibility disclosures.
3. `RO-MVP-PRODUCT-SAFETY` — closed allowlist, GPSR listing fields, safety notice/recall case workflow.
4. `RO-MVP-WITHDRAWAL-RETURNS` — online withdrawal function, durable receipt, complaint/conformity routing.
5. `RO-MVP-PAYMENTS-PSP` — selected PSP adapter + immutable transaction/refund/reconciliation references; no wallet custody.
6. `RO-MVP-MERCHANT-FULFILMENT` — merchant fulfilment evidence and order status without false DROPi postal representation.
7. `RO-MVP-POSTAL-RESALE` — optional only if #496 is approved and owner includes integrated postal resale in pilot.
8. `RO-MVP-ZONE-CATEGORY-GATE` — deny-by-default pilot geography and product allowlist.
9. `RO-MVP-PRIVACY-RETENTION` — flow-specific production data controls from #498.
10. `RO-MVP-PUBLIC-LEGAL-SURFACES` — approved terms, privacy, contact, Marketplace disclosures and product-safety contact/reporting surfaces.
11. `RO-MVP-E2E-ACCEPTANCE` — physical Android + backend + Railway first-pilot evidence suite and rollback gate.

## 7. Candidate dependency graph

```text
#493 entity/tax/roles ----------┐
#494 marketplace law ----------┼--> merchant onboarding / disclosures / withdrawal / GPSR
#497 category + zone ----------┘                    |
                                                     v
#498 privacy/contracts ----------------------> production data + terms/support
                                                     |
#495 PSP ------------------------------------> PSP payment/reconciliation
                                                     |
                                                     v
                           PROFESSIONAL-MERCHANT MARKETPLACE LOOP
                                                     |
                         merchant fulfilment ---------┤
                                                     |
#496 ANCOM (optional pilot scope) -----------> postal resale upgrade
                                                     |
                                                     v
                           scoped E2E + release/rollback evidence
                                                     |
                                                     v
                                          #501 OWNER GATE
```

Repository/auth/release foundation (#476, #401 and scoped QA/release work) may proceed in parallel because it does not require inventing a legal Marketplace outcome.

## 8. What should stop immediately as a launch-priority assumption

The following historical assumptions should no longer drive the top of the developer queue:

- completing the whole M1 milestone before testing a lawful C1 pilot;
- treating P2P/community sellers as a first-Marketplace prerequisite;
- treating a DROPi wallet as a first-payment prerequisite;
- treating own riders/drivers, live fleet maps or DronePort infrastructure as a first-delivery prerequisite;
- treating C2, C3, Passenger Mobility, Cooperative Hub or drone operations as first-launch blockers;
- treating `AUTO`, `verified`, `merchant`, `delivery enabled`, `wallet` or similar global labels as legal/operational authority.

## 9. Conditions for final #500 classification

This candidate queue may become the proposed canonical roadmap reconciliation only when:

1. #493–#499 each provide an evidence-backed disposition for the first-launch flow;
2. PR #504 legal corpus is reviewed/reconciled and the legal-source gate passes;
3. selected PSP, product allowlist, geography and fulfilment/postal choice are explicit;
4. each new law-dependent implementation slice references an approved legal/control requirement rather than this planning document alone;
5. #501 records `AUTHORIZE IMPLEMENTATION REPRIORITIZATION`.

Until that owner outcome, this file is planning evidence only.