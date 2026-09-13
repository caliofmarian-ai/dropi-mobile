# RO-LAUNCH-006 — Contracts, Privacy, Retention and Support Boundaries

> **STATUS: PRE-COUNSEL / PRE-DPIA / IMPLEMENTATION BLOCKED**
> **Version:** 0.1.0
> **Research cut-off:** 2026-09-13
> **Issue:** #498
> **Parent:** #492
> **Repository baseline:** `08ac65e69028e636fd0ee51db9a9dad1b47be2bc`

This packet maps the proposed Romanian MVP into contracts, responsibility boundaries, privacy roles and support cases. It does not approve legal terms, GDPR roles, retention periods or a DPIA.

## 1. Contract architecture for the first pilot

The first pilot should not rely on one generic `Terms of Service` document.

Candidate agreement set:

1. **Customer / Marketplace Terms**
   - identifies DROPi's platform role;
   - identifies the merchant as goods seller of record under the candidate #493 model;
   - explains allocation of seller/platform obligations;
   - integrates checkout, withdrawal, complaint and fulfilment disclosures from #494.

2. **Merchant Agreement**
   - merchant legal identity and authority;
   - professional status;
   - product/listing truthfulness;
   - product-safety and recall cooperation;
   - pricing/inventory/order duties;
   - withdrawal/conformity/complaint duties;
   - PSP onboarding/settlement obligations;
   - suspension/termination and evidence retention;
   - audit/regulator cooperation.

3. **PSP / Payment Terms and Data Arrangement**
   - selected provider's regulated service and onboarding terms;
   - allocation of payment/KYC/security/data duties;
   - platform fee, seller payout, refund, dispute and reconciliation mechanics;
   - no DROPi client-fund custody unless separately authorized.

4. **Postal/Carrier Agreement**
   - Model B/C/D role from #496;
   - written resale agreement where Model C is used;
   - effective carrier/provider scope;
   - service terms, proofs, incidents, claims and compensation;
   - data/privacy and authority status signals.

5. **Processor/Subprocessor Agreements**
   - cloud, communication, analytics, support and other vendors only where the GDPR role actually requires processor terms.

No contract may claim to transfer away a statutory duty where the law keeps that duty with DROPi, seller, PSP or postal provider.

## 2. Responsibility matrix

Candidate allocation, subject to counsel review:

| Domain | Merchant | DROPi | PSP | Effective postal provider |
|---|---|---|---|---|
| Goods sale | seller / primary candidate | Marketplace/intermediary duties | payment only | no |
| Product safety | product economic-operator duties | Marketplace GPSR duties | no | no |
| Listing content | supplies/represents | hosts/moderates/verifies scoped fields | no | no |
| Checkout interface | supplies seller facts | operates interface and legal snapshots | executes payment | fulfilment data only |
| Payment service | beneficiary/customer obligations | technical/commercial integration | regulated PSP | no |
| Withdrawal/conformity | seller obligations | interface/orchestration + own duties | refund execution | delivery component evidence |
| Postal service | sender/merchant duties | role depends on #496 | no | operational provision under approved model |
| Complaint/support | seller scope | platform/postal scope | payment scope | operational postal evidence |
| Product recall | merchant/economic operator | Marketplace cooperation/consumer reach | refund support | stop/return affected parcels where required |

The application needs case ownership by legal domain, not one generic support queue with no responsibility semantics.

## 3. GDPR baseline

The MVP must be designed around GDPR principles including:

- lawfulness/fairness/transparency;
- purpose limitation;
- data minimisation;
- accuracy;
- storage limitation;
- integrity/confidentiality;
- accountability.

Romanian Law No. 190/2018 supplies national implementation measures.

The platform must record **why** a data field exists and who may access it, not merely whether the user accepted a privacy policy.

## 4. Processing-purpose map

Candidate purposes for the first pilot:

### 4.1 Account and authentication

Data:
- account identifiers;
- contact information;
- authentication/security events.

Candidate bases:
- contract/pre-contract;
- legitimate security interest;
- legal obligations where applicable.

Retention:
- active account plus scoped post-closure security/legal period, to be professionally fixed.

### 4.2 Merchant verification

Data:
- legal entity/register/tax information;
- representative identity/authority;
- category/product compliance evidence;
- PSP beneficiary references.

Candidate bases:
- contract/pre-contract;
- legal compliance obligations;
- legitimate fraud/safety/Marketplace governance interests where valid.

Rule:
- public storefront receives only information lawfully required/justified for consumer transparency;
- identity documents and review evidence remain restricted.

### 4.3 Customer order/contract

Data:
- customer contact;
- delivery address;
- product/order snapshot;
- merchant identity;
- price/payment references;
- withdrawal/complaint history.

Candidate bases:
- contract performance;
- consumer/tax/legal obligations;
- legal claims where applicable.

### 4.4 Postal fulfilment

Data:
- sender/recipient details needed for the approved service;
- delivery address/contact;
- parcel/tracking/proof/exception events.

Rule:
- share only what the effective provider needs for the approved service;
- do not expose merchant/customer private data to unrelated carriers;
- no own-fleet continuous-location collection during the external-carrier MVP.

### 4.5 Payment/reconciliation

Data:
- PSP identifiers/events;
- amounts/components;
- beneficiary/payout references;
- refund/dispute/reconciliation evidence.

Rule:
- payment-card secrets and unnecessary regulated PSP data remain at the PSP;
- DROPi stores the minimum transaction evidence needed for contract, tax, support and audit.

### 4.6 DSA/GPSR/moderation/safety

Data:
- report/notice identity where required;
- affected listing/product/merchant;
- moderation/safety decision and reason;
- regulator communication;
- affected customers for recall/notification.

Candidate bases:
- legal obligations;
- legitimate safety/security interests where appropriate;
- legal claims.

No public exposure of reporter identity unless legally required/justified.

### 4.7 Marketing/analytics

Marketing and optional behavioral analytics must be separated from contract/legal processing.

Rule:
- do not require marketing consent to buy goods or exercise statutory rights;
- consent, where actually used as the legal basis, must be purpose-specific, provable and withdrawable;
- first pilot should minimize non-essential tracking until the core commerce loop is proven.

## 5. Controller / processor map — candidate

The words `controller` and `processor` are not fixed globally for an organization. Role depends on the processing activity.

Candidate hypotheses:

- DROPi: controller for platform accounts, platform security, Marketplace governance, its own legal/audit records and platform support;
- merchant: controller for its own customer/sales/conformity duties, with possible shared/independent roles depending on exact Marketplace flow;
- PSP: generally an independent regulated controller for many payment/KYC duties, plus any processor role must be verified contractually per data flow;
- carrier/postal provider: independent controller for its statutory postal operations in many cases, while some data transfer/instruction elements may require separate role analysis;
- infrastructure vendors: processors where they process personal data on DROPi instructions and meet Article 28 conditions.

**Do not label the entire merchant/PSP/carrier relationship `processor` for convenience.**

## 6. Retention architecture

There must be no one global `retainForYears` value.

Candidate record:

`RetentionPolicyRule`

Scoped by:

- data category;
- processing purpose;
- data subject/role;
- jurisdiction;
- source requirement;
- trigger date;
- normal retention;
- legal hold override;
- deletion/anonymisation method;
- reviewer/version.

Examples of distinct clocks:

- inactive authentication/security logs;
- merchant verification evidence;
- contract/order records;
- fiscal/invoice evidence;
- payment/reconciliation evidence;
- postal records/proofs/claims;
- withdrawal/conformity/complaint cases;
- DSA moderation cases;
- GPSR safety/recall evidence;
- support tickets;
- marketing consent/audit proof.

Exact periods remain `NOT YET VALIDATED` until tax/postal/consumer/GDPR requirements are reconciled.

## 7. Deletion and legal hold

A user account deletion request cannot be implemented as `DELETE FROM every_table`.

Candidate logic:

```text
rightRequest
  -> identify data/purposes/controllers
  -> erase data with no remaining lawful basis
  -> restrict or retain data still required by law/claims/contract evidence
  -> record legal-hold/retention reason
  -> confirm outcome transparently
```

Historical financial, postal, safety or legal-decision evidence may need continued restricted retention even after account closure; that continued retention requires a documented lawful basis and period.

## 8. Access model

Candidate privacy/access classes:

- `PUBLIC_MARKETPLACE` — legally/publicly justified seller/product data;
- `CUSTOMER_CONTRACT` — data visible to customer for their transaction;
- `MERCHANT_PRIVATE` — merchant business/verification evidence;
- `POSTAL_NEED_TO_KNOW` — fulfilment data for effective provider;
- `PAYMENT_RESTRICTED` — payment/reconciliation metadata;
- `SAFETY_COMPLIANCE` — moderation/recall/legal evidence;
- `HIGHLY_RESTRICTED_IDENTITY` — identity documents/authority evidence;
- `AUDITOR_READ_ONLY` — controlled evidence access.

Every support/admin access to restricted data should be attributable and auditable.

## 9. Support case model

The first pilot needs typed support cases rather than free-form catch-all tickets.

Candidate case types:

- account/security;
- order status;
- merchant/product question;
- withdrawal;
- conformity/warranty;
- refund;
- payment dispute;
- postal delay/loss/damage;
- illegal listing/content report;
- unsafe product / recall;
- privacy/data-right request;
- fraud/abuse;
- authority/regulator request.

Each type needs:

- responsible role/entity;
- SLA/legal deadline where applicable;
- allowed data access;
- evidence fields;
- escalation path;
- closure reason;
- retention rule.

## 10. Consumer statutory workflows cannot be hidden inside support

The following must have dedicated legally traceable flows where applicable:

- Article 11^1 online withdrawal function;
- conformity remedy/complaint;
- DSA notice/action;
- GPSR unsafe-product notice/recall;
- privacy/data-right request;
- postal complaint/claim under the approved #496 model.

A generic `contact support` button is not a substitute for a statutory function with required content/timing/evidence.

## 11. Notification and evidence

Customer/merchant notices should distinguish:

- contractual notice;
- statutory information;
- consent request;
- optional marketing;
- operational alert;
- safety/recall warning;
- moderation reason;
- authority/legal notice.

Each legally material communication should have:

- content/template version;
- language/locale;
- recipient;
- legal/contract purpose;
- delivery channel;
- send/delivery evidence where required;
- timestamp.

## 12. Cross-border/vendor data

Even a Romania-only commerce pilot may use foreign cloud/PSP/support vendors.

#498/#499 professional review must identify:

- vendor legal entity and data location;
- controller/processor status;
- Article 28 terms where applicable;
- international-transfer mechanism where data leaves the EEA or other transfer safeguard is needed;
- subprocessor list/change mechanism;
- incident/breach notification obligations;
- deletion/export on termination.

Do not infer transfer legality from the vendor brand or from server-region marketing copy.

## 13. Security and incident boundary

M2 privacy/audit implementation is a strong existing foundation but does not automatically certify new Marketplace/PSP/postal flows.

The launch gate needs:

- least-privilege access;
- audit logs for restricted-data access and material decisions;
- encryption/secrets controls appropriate to the data class;
- verified backup/restore and deletion behavior;
- security incident classification;
- personal-data breach assessment/notification runbook;
- PSP/carrier/vendor incident escalation;
- product-safety incident linkage where the same event affects both safety and personal data.

## 14. Required professional decisions

1. Confirm controller/processor/independent-controller roles per data flow among DROPi, merchant, PSP and effective postal provider.
2. Approve the purpose/legal-basis map.
3. Approve exact retention periods and legal-hold conditions for each record class.
4. Determine whether a DPIA is required for the first pilot and later higher-risk scopes.
5. Confirm privacy notice structure and transparency requirements per role.
6. Confirm data-subject-right workflow exceptions/restrictions for legally retained evidence.
7. Confirm cross-border vendor transfer safeguards.
8. Confirm what merchant/customer data may be shared with carriers and PSPs.
9. Confirm required data-processing clauses and audit rights in vendor/merchant contracts.
10. Confirm incident/breach/regulator notification ownership and timing.

## 15. Source-capture queue for #499

- Regulation (EU) 2016/679 current official text;
- Romanian Law No. 190/2018;
- current ANSPDCP guidance relevant to controllers/processors, rights and breach handling;
- tax/fiscal retention sources from #493;
- postal record/claim sources from #496;
- DSA/GPSR evidence-retention and authority-contact sources from #494;
- selected PSP/carrier/vendor privacy/data terms after selection.

## 16. Current disposition

| Matter | State |
|---|---|
| One global privacy/retention rule | `REJECTED` |
| Purpose-specific data map | `REQUIRED` |
| Consent as universal legal basis | `REJECTED` |
| Flow-specific controller/processor map | `WRITTEN_CONFIRMATION_REQUIRED` |
| Exact retention periods | `NOT YET VALIDATED` |
| Typed statutory/support workflows | `RECOMMENDED FOR MVP` |
| Public production data collection | `BLOCKED UNTIL APPROVED DATA PACK + CONTROLS` |

This packet is ready for controlled source capture and privacy/legal review. It does not authorize production processing.