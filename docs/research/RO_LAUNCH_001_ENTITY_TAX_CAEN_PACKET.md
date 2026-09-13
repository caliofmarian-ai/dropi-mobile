# RO-LAUNCH-001 — Romanian Entity, Tax, CAEN and Seller-of-Record Packet

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / NOT LEGAL OR TAX ADVICE / IMPLEMENTATION BLOCKED**
> **Version:** 0.1.0
> **Research cut-off:** 2026-09-13
> **Issue:** #493
> **Parent:** #492
> **Repository baseline:** `08ac65e69028e636fd0ee51db9a9dad1b47be2bc`
> **Governing legal canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This packet narrows the entity/tax/CAEN questions for the proposed first Romanian launch. It does not establish the company, determine tax residence, select a tax regime, approve CAEN codes, or authorize trading.

## 1. Executive outcome

The current evidence supports the following **candidate structure for professional validation**:

1. A Romanian **SRL** is a practical candidate operating entity for the first Romanian Marketplace/postal pilot because it is a Romanian legal person with limited-liability ownership, can contract with merchants/PSP/carrier, and can register the activity set required by the final operating model.
2. The first Marketplace should keep each verified Romanian merchant as **seller of record for its goods**. DROPi should not take title to merchant inventory merely to simplify checkout.
3. DROPi should earn separately identified platform/service fees and, if the approved postal model permits, a separately identified postal/logistics fee or margin.
4. Client funds should remain in an eligible licensed PSP architecture; this packet does not approve DROPi custody, stored value or legal escrow.
5. CAEN Rev.3 must follow the real economic flow. For the candidate first launch, `4791`/`4792`, `5330`, and supporting digital activity codes are candidate mappings to validate; `5320` becomes relevant where DROPi itself offers/provides/resells postal service in a way that fits that activity rather than mere intermediation.
6. A Romanian incorporation does **not** by itself settle cross-border company tax residence where the company's highest-level management is actually exercised from Ireland. Irish Revenue applies the central-management-and-control test to foreign-incorporated companies, while the Romania–Ireland tax convention contains a corporate dual-residence rule based on place of effective management. This creates a P0 professional-review question before the operating entity is fixed.
7. The first pilot should therefore be restricted further to **Romanian professional merchants selling goods already located in Romania to Romanian customers**, unless the accountant/tax pack later approves cross-border seller/import flows. This avoids importing marketplace deemed-supplier/import/IOSS and cross-border merchant VAT questions into the first proof of business.

No row below is `APPROVED FOR DESIGN`.

## 2. Candidate legal entity — Romanian SRL

### 2.1 Why SRL is the working candidate

Romanian company law recognizes the society with limited liability (`societate cu răspundere limitată`, SRL), and the liability of SRL shareholders is limited to the subscribed share capital under the company-law framework.

An SRL may also be formed by one person under the Companies Law framework. This makes a single-founder structure legally possible at the company-form level; it does not answer tax residence, governance, licensing or business-model questions.

Law No. 239/2025 introduced a current minimum share-capital rule under which:

- a newly incorporated SRL has a minimum social capital of **500 lei**;
- an SRL whose prior-year net turnover exceeds **400,000 lei** has a minimum social capital of **5,000 lei**, with the statutory adjustment rule applying after the threshold is met.

These values are formation/company-law facts, not evidence that an SRL with those amounts is adequately capitalized for DROPi's commercial, consumer, postal, insurance or operational risks.

### 2.2 What remains professionally unresolved

Before selecting the SRL as the launch entity, the accountant/counsel packet must answer:

- whether one Romanian SRL should own both the C1 Marketplace and the first postal/resale role or whether the postal liability profile justifies a later separate entity;
- registered-office and actual-management requirements;
- director/administrator structure and where strategic decisions will genuinely be taken;
- beneficial-owner reporting and corporate governance requirements;
- the appropriate Romanian corporate tax regime at launch and after growth thresholds;
- employment/director-remuneration consequences if management duties are performed outside Romania;
- insurance/capital requirements arising from contracts or regulated activities even where company law itself does not impose them.

**Candidate disposition:** `SRL_CANDIDATE / PROFESSIONAL_CONFIRMATION_REQUIRED`.

## 3. Cross-border residence and management risk — Romania / Ireland

### 3.1 Romanian baseline

The Romanian Fiscal Code definition of `resident` includes any Romanian legal person. ANAF's current residence guidance also explains the separate Romanian concept under which a foreign legal person may become Romanian resident by place of effective management.

Therefore a Romanian-incorporated DROPi SRL begins with a clear Romanian residence connection under Romanian law.

### 3.2 Irish baseline

Irish Revenue states that a company not incorporated in Ireland is Irish tax resident where it is **centrally managed and controlled in Ireland**. Revenue describes the highest level of control as relevant and lists factors such as where:

- company policy is decided;
- major investment decisions are made;
- major contracts are negotiated/defined;
- the head office is located;
- the majority of directors live.

This means ordinary incorporation paperwork cannot safely be used to declare the issue solved if actual top-level management occurs elsewhere.

### 3.3 Romania–Ireland treaty

The current Ireland–Romania double-taxation convention states that where a non-individual person is resident in both states under domestic-law rules, it is treated as resident only in the state where its **place of effective management** is situated.

The treaty's permanent-establishment article also expressly lists a `place of management`, a branch and an office among examples of a fixed place of business.

### 3.4 Product-owner/business consequence

DROPi must not create artificial board minutes, nominal local management or a fictitious Romanian management location merely to obtain a preferred tax result.

Before incorporation/launch design is frozen, the professional packet must record the actual intended facts:

- who is/are administrator(s)/director(s);
- where each lives and normally works;
- where product, funding, pricing, carrier, PSP and major-contract decisions will actually be made;
- where board/shareholder decisions will be taken and recorded;
- whether DROPi has an Irish office, fixed business place, employees/agents or other operational presence;
- how management remuneration/dividends will be handled;
- whether the intended facts could produce dual company residence, Irish permanent-establishment exposure or payroll obligations.

**Current state:** `WRITTEN_TAX_CONFIRMATION_REQUIRED`.

## 4. Seller-of-record and title model

### 4.1 Candidate first-launch rule

For the professional-merchant Marketplace pilot:

```text
Merchant
  = seller of record for goods
  = owner/title holder until the approved sale/transfer point
  = product conformity/warranty/merchant tax responsibility within the approved contract model

DROPi
  = Marketplace/intermediation service provider
  + separately scoped logistics/postal role if approved
  != owner of merchant inventory
  != generic seller of all Marketplace goods
```

This structure matches the intended C1 controlled Marketplace and avoids creating unnecessary inventory, product-liability and VAT complexity by pretending DROPi buys and resells every product.

### 4.2 Order data that must make the allocation explicit

The future order/receipt contract should not rely on a global `merchant` label alone. It should preserve at least:

- legal seller entity ID;
- seller registration/tax identifiers required for the transaction;
- buyer/customer jurisdiction;
- product owner before sale;
- title/risk transfer rule reference;
- product price and merchant tax treatment reference;
- DROPi platform fee;
- delivery/postal charge and legal provider/reseller identity;
- PSP payment/reconciliation reference;
- refund/chargeback allocation;
- invoice/receipt issuer for each amount;
- terms/policy versions in force.

### 4.3 First-pilot restriction

Until the tax/accounting pack expands scope, the first pilot should use:

- merchants established/verified in Romania;
- goods already in Romania at order time;
- Romanian consumer destinations in the approved pilot geography;
- no marketplace-facilitated import from a third country;
- no cross-border EU merchant onboarding;
- no DROPi purchase/resale of the merchant's product.

This is a DROPi scope-reduction decision, not a claim that broader commerce is prohibited.

## 5. CAEN Rev.3 — candidate mapping

The official CAEN Rev.3 structure published in Monitorul Oficial No. 385/25.04.2024 materially changes several older internet-commerce assumptions.

### 5.1 Marketplace / retail intermediation

The official Rev.3 structure lists:

- `479` — Activities of intermediation in retail trade;
- `4791` — **Intermedieri în comerțul cu amănuntul nespecializat**;
- `4792` — **Intermedieri în comerțul cu amănuntul specializat**.

Accordingly, old documentation or search results that describe `4791` as generic `retail via Internet` are not safe Rev.3 mapping evidence.

**Candidate use for DROPi:** one or both may be relevant to Marketplace intermediation depending on whether the approved launch/catalog activity is legally treated as nonspecialized or specialized retail intermediation. Exact explanatory notes and accountant/ONRC confirmation are required before filing.

### 5.2 Postal/courier intermediation versus provision

Official Rev.3 lists:

- `5320` — **Alte activități poștale și de curier**;
- `5330` — **Servicii de intermediere pentru activități poștale și de curier**.

ONRC's Rev.2→Rev.3 correspondence further describes `5330` as bringing customers and postal/courier providers together for a fee or commission **without the intermediary itself providing the postal/courier services**.

This creates a useful accounting/classification boundary but **does not decide the ANCOM regulatory role**. #496 must still classify the actual user–DROPi–carrier contract flow under postal law.

Candidate interpretations to validate:

| Actual DROPi activity | Candidate CAEN direction | Regulatory status |
|---|---|---|
| Match customer/merchant with external carrier for commission, without providing postal service | `5330` candidate | ANCOM classification still required |
| Offer/resell/provide postal service under DROPi commercial responsibility | `5320` may become relevant | ANCOM notification/obligations likely material; #496 controls |
| Later B2B freight intermediation outside postal parcel scope | `5231` candidate | Later-service analysis; not MVP |

### 5.3 Supporting digital activity classes

Rev.3 also includes:

- `6210` — software development to order;
- `6310` — data processing, hosting/page administration and related activities;
- `6391` — web portal activities;
- `6290` — other IT service activities.

These are **candidate supporting classifications only**. The accountant/ONRC mapping must distinguish activities DROPi actually sells/performs from internal capabilities that do not need to be registered as the primary business model merely because code exists.

### 5.4 CAEN rule for the project

```text
CAEN code != licence
CAEN code != ANCOM authorization
CAEN code != payment authorization
CAEN code != product authorization
```

The repository should store a versioned `activity -> entity -> CAEN -> regulator/permit` map rather than one global `DROPi CAEN` field.

## 6. VAT and invoicing — current constraints for design

### 6.1 VAT registration threshold

ANAF states that from 1 September 2025 the Romanian small-enterprise VAT exemption threshold is **395,000 lei**. Whether DROPi should initially use that exemption or voluntarily/mandatorily register for VAT depends on projected activity, costs, B2B/PSP/carrier relationships and the final tax model; this packet makes no tax-regime recommendation.

### 6.2 RO e-Factura

The current RO e-Factura framework requires Romanian-established taxable operators to transmit invoices they issue for covered B2C domestic supplies/services through RO e-Factura from 1 January 2025, subject to the statutory exceptions and later amendments.

Implementation implication: the platform must know **who issued which invoice**. The seller-of-record split cannot be hidden inside one synthetic DROPi receipt.

Candidate first-launch allocation for professional confirmation:

- merchant: fiscal document/invoice responsibilities for the product sale;
- DROPi: fiscal document/invoice responsibilities for the platform fee and any approved DROPi postal/logistics service charged by DROPi;
- carrier: invoice to DROPi or merchant according to the approved carrier/resale contract;
- PSP: payment evidence does not replace the fiscal invoice/receipt obligations of the legally responsible supplier.

The exact issuance requirement, B2C invoice trigger, cash-register treatment and RO e-Factura path must be approved by the accountant for each flow.

## 7. Money-flow boundary

This packet does not select the PSP; #495 owns the detailed payment architecture.

Entity/tax requirements exported to #495 are:

- no commingling of merchant proceeds and DROPi revenue in the accounting model;
- platform fee must have a defined contractual payer and tax invoice treatment;
- delivery/postal fee must identify the actual legal supplier/reseller;
- PSP payout/split is settlement mechanics, not proof of the underlying seller or tax treatment;
- refund/chargeback allocation must reverse the correct economic components;
- no legal `escrow`, wallet/stored-value or client-fund custody assumption.

## 8. Candidate responsibility/RACI

| Matter | Merchant | DROPi operating entity | PSP | Effective carrier |
|---|---|---|---|---|
| Goods seller of record | **R/A candidate** | I / platform obligations | I | I |
| Product title before sale | **R/A candidate** | No title candidate | — | Custody only when applicable |
| Product conformity/seller warranty | **R/A candidate** | Platform duties remain separate | — | — |
| Marketplace operation | C | **R/A** | C | C |
| Platform fee | payer/payee per contract | **R/A revenue** | settlement | — |
| Customer payment processing | C | merchant/platform integration responsibility | **R/A regulated payment function** | — |
| Postal service | C | role depends on #496 | — | **effective provision**, subject to resale model |
| Delivery fee | contract-dependent | contract-dependent | settlement | contract-dependent |
| Refund decision | goods/contract dependent | workflow + allocated duties | executes payment reversal | postal claim component where applicable |
| Customer complaint | seller scope | platform/postal scope | payment complaint scope | carrier operational evidence/support |

`R/A candidate` means proposed allocation awaiting contract/legal approval.

## 9. Questions for Romanian accountant/tax counsel

The professional review should answer these exact questions rather than a generic request to “make DROPi legal”:

1. For the proposed facts, is one Romanian SRL an appropriate first operating entity for Marketplace + possible postal resale/intermediation?
2. If the SRL's controlling strategic decisions are made while the owner/director is physically in Ireland, could Irish central-management-and-control rules also make the SRL Irish tax resident?
3. How should the Romania–Ireland treaty's `place of effective management` rule be applied to the intended governance facts?
4. Could any planned Irish home/office/management activity create an Irish permanent establishment, payroll or employer-registration obligation for the Romanian company?
5. Which management/governance facts and records should be maintained truthfully to evidence actual decision-making location without artificial arrangements?
6. For Romanian merchants selling Romanian-stock goods to Romanian consumers, confirm that the merchant should remain seller of record under the proposed flow and define title/risk transfer.
7. Confirm the exact Rev.3 CAEN set for Marketplace retail intermediation and supporting digital operations; choose `4791` versus `4792` from the actual first category/catalog model.
8. After #496 fixes the postal role, confirm `5330` versus `5320` and any additional code without treating CAEN as ANCOM authorization.
9. Confirm VAT registration strategy and the exact VAT treatment of platform fee, delivery/postal fee and carrier purchase/resale.
10. For each amount in the checkout, who must issue the fiscal invoice/receipt and transmit it through RO e-Factura where applicable?
11. Are there withholding-tax or cross-border service-payment consequences for any Irish or other foreign provider/manager used at launch?
12. What accounting treatment and documentary evidence are required for PSP split settlement, refunds and chargebacks?

## 10. Proposed state machine for the entity decision

```text
ENTITY_HYPOTHESIS
  -> FACTS_CAPTURED
  -> RO_ACCOUNTANT_REVIEW
  -> CROSS_BORDER_TAX_REVIEW
  -> CAEN_MAPPING_REVIEW
  -> SELLER_OF_RECORD_APPROVED
  -> PAYMENT_POSTAL_DEPENDENCIES_RECONCILED
  -> APPROVED_FOR_DESIGN
```

Alternative/blocking states:

```text
REWORK_REQUIRED
DUAL_RESIDENCE_RISK_UNRESOLVED
CAEN_MAPPING_UNRESOLVED
SELLER_ROLE_UNRESOLVED
VAT_INVOICING_UNRESOLVED
HOLD_OWNER
```

No engineering issue may infer `APPROVED_FOR_DESIGN` from the existence of this packet.

## 11. Sources rechecked for this packet

The following current/official sources were used as research evidence and should be controlled/versioned through #499 before they become approved repository authority:

- Romanian Fiscal Code / Portal Legislativ — residence and place-of-effective-management provisions;
- ANAF 2025 guide on fiscal residence of foreign legal persons;
- Irish Revenue — current company-residence rules for foreign-incorporated companies;
- Ireland–Romania Double Taxation Convention, Articles 4 and 5;
- Romanian Companies Law No. 31/1990, current consolidated text;
- Law No. 239/2025 — current SRL minimum share-capital rules;
- Official CAEN Rev.3 structure, Monitorul Oficial No. 385/25.04.2024;
- ONRC Rev.2→Rev.3 correspondence explaining `5330`;
- ANAF / OG No. 22/2025 — current 395,000 lei VAT exemption threshold;
- OUG No. 120/2021 as amended — current RO e-Factura framework for B2C invoices.

## 12. Current disposition

| Decision | State |
|---|---|
| Romanian SRL as first operating entity | `CANDIDATE — NOT APPROVED` |
| Merchant as goods seller of record | `CANDIDATE — NOT APPROVED` |
| DROPi owns merchant inventory | `REJECTED FOR MVP` unless later separately justified |
| Romanian-only merchant/stock/customer pilot | `RECOMMENDED SCOPE REDUCTION` |
| Cross-border company tax residence | `WRITTEN_CONFIRMATION_REQUIRED` |
| `4791` vs `4792` | `WRITTEN_CONFIRMATION_REQUIRED` |
| `5330` vs `5320` | `DEPENDS ON #496 + WRITTEN_CONFIRMATION_REQUIRED` |
| VAT registration/tax regime | `ACCOUNTANT_DECISION_REQUIRED` |
| Invoice/e-Factura allocation | `ACCOUNTANT_DECISION_REQUIRED` |
| Client-fund custody / legal escrow | `NOT APPROVED FOR MVP` |

The packet is ready for source capture under #499 and a later bounded accountant/tax-counsel review. It does not authorize incorporation or implementation.