# RO-LAUNCH-003 — Romania Marketplace PSP Candidate Matrix

> **STATUS: RESEARCH / PROVIDER NOT SELECTED / PRE-COUNSEL / PRE-ACCOUNTANT**
> **As of:** 2026-09-15
> **Issue:** #495
> **Parent:** #492
> **Control contract:** `docs/legal/RO_LAUNCH_PAYMENT_SETTLEMENT_CONTROL_CONTRACT_2026-09-15.md`

This matrix narrows the external-PSP search for the first Romanian professional-merchant Marketplace. It does not approve a provider, open an account, accept provider terms, prove passporting/authorization for the final contracting entity, or authorize live charging.

## 1. Required DROPi first-pilot payment contract

A candidate PSP must be evaluated against the exact first-pilot facts:

- Romanian DROPi operating entity candidate;
- professional Romanian merchants/submerchants;
- Romanian consumers;
- RON-first checkout;
- merchant is candidate seller of record for goods;
- DROPi charges a separately defined platform/service fee;
- merchant fulfilment first; postal charge only if #496 later approves that model;
- provider owns regulated payment processing/onboarding functions according to its contract;
- DROPi does not intentionally safeguard/hold customer funds, issue stored value or provide legal escrow;
- refunds, partial refunds, reversals, chargebacks and negative balances must be attributable by economic component;
- immutable provider transaction, settlement and reconciliation references are required;
- customer authentication follows the selected regulated provider's supported SCA model;
- provider payout/split functionality never determines seller-of-record, VAT, invoice or RO e-Factura responsibility by itself.

No provider passes solely because it can process ordinary card payments.

## 2. Candidate providers verified from provider-owned sources

| Provider | Romania/platform evidence | Marketplace/split evidence | Authority evidence still required | Current research state |
|---|---|---|---|---|
| **PayU Marketplace** | European PayU Marketplace documentation plus Romania-specific payment capability | Platform/submerchant onboarding, Marketplace payment and automatic split are described; provider material states the platform need not handle submerchant funds in that product model | Exact contracting PayU legal entity, competent NCA, authorization/passporting into Romania, permitted service scope and effective contract for DROPi | `CANDIDATE / AUTHORITY + COMMERCIAL + LEGAL REVIEW REQUIRED` |
| **NETOPIA Marketplace** | Romanian provider and Romania-specific commercial/payment documentation | Marketplace solution describes real-time split and seller proceeds to each seller company's account | Exact licensed/registered contracting entity, NCA/register reference, permitted services, Marketplace contract/KYB model | `CANDIDATE / AUTHORITY + API + KYB + CONTRACT REVIEW REQUIRED` |
| **Stripe Connect** | Connect documentation lists Romania among supported connected-account countries | Connect supports Marketplace/platform charge, transfer and payout patterns | Exact Stripe contracting entity for Romania, home NCA/authorization, EEA/Romania passporting, permitted service scope, selected Connect account/charge model | `CANDIDATE / AUTHORITY + CONFIGURATION + LEGAL REVIEW REQUIRED` |
| **Adyen for Platforms** | Platform documentation lists Romania among supported countries/regions | Platform product supports onboarding and Marketplace payment flows | Exact Adyen contracting entity, NCA/authorization/passporting evidence, commercial eligibility and selected settlement/liability model | `CANDIDATE / AUTHORITY + COMMERCIAL + LEGAL REVIEW REQUIRED` |
| **Mollie / Mollie Connect** | Mollie publicly launched Romania in 2026 and documents a platform/partner path | Platform capability is evidenced, but exact DROPi Marketplace split/merchant settlement fit is not yet fixed | Exact contracting entity, NCA/authorization/passporting, Romanian Marketplace availability for required split model, contract/KYB/liability terms | `CANDIDATE / AUTHORITY + MARKETPLACE FLOW CONFIRMATION REQUIRED` |

This table deliberately does not name a winner. Provider selection is a later commercial/legal/accounting decision using the same evidence fields for every candidate.

## 3. Authority verification contract

Before provider selection, create an evidence-backed profile for the exact entity that would contract with DROPi:

```text
PaymentProviderAuthorityProfile {
  providerId
  contractingLegalEntity
  providerCountry
  competentNationalAuthority
  authorizationType
  authorizationNumber?
  nationalRegisterEvidenceRef
  eeaPassportOrRomaniaServiceEvidenceRef?
  permittedServiceScope[]
  marketplacePlatformProduct
  evidenceRetrievedAt
  reviewDueAt
  approvalState
}
```

The EBA central payment/e-money register is a discovery/cross-check source only. Its own page states that the central register has no legal significance. The final provider record therefore needs competent-national-authority and, where relevant, passporting evidence for the exact contracting entity/service.

## 4. Provider-owned references checked 2026-09-15

### PayU

- Marketplace: `https://developers.payu.com/europe/docs/services/marketplace/`
- Marketplace integration: `https://developers.payu.com/europe/docs/services/marketplace/integration/`

Provider-described property: automatic split to appropriate PayU accounts and a model in which the platform does not need to handle submerchant funds. This is architecture evidence, not a Romanian legal classification of DROPi.

### NETOPIA

- Marketplace solution: `https://netopia-payments.com/solutii/marketplace/`
- support material: `https://support.netopia-payments.com/`

Provider-described property: real-time split transactions and seller proceeds to the seller company's account.

### Stripe

- Connect: `https://docs.stripe.com/connect/how-connect-works`
- connected accounts/countries: `https://docs.stripe.com/connect/accounts`

Romania appears in current availability material. This does not pre-select account type, charge type or transfer/payout pattern.

### Adyen

- Marketplaces: `https://docs.adyen.com/marketplaces`
- Platforms: `https://docs.adyen.com/platforms`

Actual contracting entity, acceptance and commercial fit remain to be confirmed.

### Mollie

- Romania launch: `https://www.mollie.com/ro/news/mollie-launches-romania`
- supported countries: `https://help.mollie.com/hc/ro/articles/115002116105-Pot-folosi-serviciile-Mollie-%C3%AEn-%C8%9Bara-mea`
- platform partner path: `https://help.mollie.com/hc/ro/articles/360023556914-Cum-pot-deveni-partener-Mollie`

## 5. Legal/payment authority source family

The legal corpus now separately tracks:

- Romanian Law 209/2019 payment-services baseline already present in the repository;
- `RO-OUG-5-2026-PAYMENTS-AMENDMENT` — 2026 amendment family affecting Law 209/2019, controlled bytes pending;
- `EU-DIR-2015-2366-PSD2-CONSOLIDATED-2025-01-17` — consolidated PSD2 endpoint registered, controlled copy pending;
- `EU-REG-2018-389-SCA-CONSOLIDATED-2023-09-12` — SCA/secure-communication RTS endpoint registered, controlled copy pending;
- archived EBA Q&A `2020_5354` and `2020_5355`, which prevent treating the commercial-agent exclusion as an automatic e-commerce safe harbour;
- archived EBA payment/e-money central-register page, used only as a discovery/cross-check source;
- `RO-LAW-210-2019-EMONEY-CURRENT-2026-03-05`, relevant to any future stored-value/e-money model; first-launch wallet remains disabled.

## 6. Mandatory provider questionnaire before selection

Every candidate must answer in writing for the proposed DROPi flow:

1. What exact legal entity contracts with a Romanian DROPi company?
2. What is that entity's competent NCA, authorization number/type and permitted payment-service scope?
3. If the entity is not Romanian, what EEA/Romania passporting/service evidence covers the proposed service?
4. Can a Romanian platform onboard Romanian professional merchants/submerchants under the offered Marketplace/platform product?
5. Who is the PSP customer and who is the merchant/payee for each economic component?
6. Does customer payment discharge the customer's debt to the merchant, and under what provider terms?
7. Does DROPi ever obtain possession/control/safeguarding responsibility over customer or merchant funds?
8. Who performs merchant KYB/KYC and ongoing verification, and what remains DROPi's responsibility?
9. What SCA flow/exemptions are provider-owned for the proposed checkout and payment methods?
10. Can the provider split product proceeds and DROPi platform fee without an internal DROPi customer wallet?
11. If postal resale is later approved, can a postal component be separately allocated and evidenced?
12. How are platform fees collected/netted and evidenced?
13. How are merchant payouts and settlement timing represented?
14. How are full and partial refunds executed across multiple economic components?
15. How are chargebacks/disputes allocated, evidenced and submitted?
16. Who bears negative merchant/platform balances?
17. Are reserves/security deposits required; who owns them and what releases them?
18. What webhook signatures, event IDs and idempotency guarantees exist?
19. What reconciliation/export/API data is available for payment, split, fee, refund, dispute, chargeback and settlement?
20. Which RON/Romanian payment methods are available for this exact Marketplace configuration?
21. What country/category/underwriting restrictions apply to the first paper-goods allowlist?
22. What pricing, minimum-volume, reserve or onboarding conditions apply to a new Marketplace?
23. What controller/processor roles, DPA, subprocessors and international data locations apply?
24. What PCI/security scope remains with DROPi?
25. Can cash/COD remain disabled?
26. What test/sandbox-to-production certification or review is required?
27. What provider documentation proves the production configuration chosen for DROPi?

## 7. Technical comparison record

No production implementation may encode a provider-specific contract until an approved profile contains at least:

```text
providerId
contractingLegalEntity
competentNationalAuthority
nationalAuthorizationEvidenceRef
romaniaPassportOrServiceEvidenceRef?
platformAccountIdRef
merchantAccountModel
merchantKybOwner
scaModel
chargeModel
fundsPossessionBoundary
fundsCustodian
platformFeeModel
splitAllocationModel
payoutModel
settlementCadence
refundModel
chargebackModel
negativeBalanceModel
reserveModel
reconciliationReportContract
webhookContractVersion
supportedCurrencies
supportedPaymentMethods
restrictedCategories
providerTermsVersion
dataRoleProfile
dpaSubprocessorProfileRef
reviewedAt
reviewDueAt
approvalState
```

Secrets/API keys are never stored in this legal corpus.

## 8. Decision criteria for later selection

The provider-selection record must compare the same evidence dimensions across candidates:

- regulatory authority for the exact contracting entity and Romania service;
- Marketplace/submerchant onboarding fit;
- no unintended DROPi custody/safeguarding;
- split/platform-fee model;
- RON/local methods and SCA;
- refund/chargeback/negative-balance/reserve handling;
- webhook/idempotency and reconciliation quality;
- merchant and platform reporting;
- DPA/subprocessors/data locations/security scope;
- commercial cost/minimum/reserve/underwriting terms;
- implementation complexity and production-verification requirements.

Marketing claims, popularity or a familiar API do not replace these fields.

## 9. Current disposition

The evidence is sufficient to define a fail-closed provider abstraction and to reject an internal cash-equivalent wallet as a first-pilot prerequisite.

It is **not** sufficient to select a provider or enable live payments.

Current state:

`PSP_SHORTLIST_IDENTIFIED / AUTHORITY_EVIDENCE_PER_PROVIDER_PENDING / PROVIDER_SELECTION_PENDING / MONEY_FLOW_LEGAL_ACCOUNTING_REVIEW_REQUIRED / LIVE_CHARGING_DISABLED`
