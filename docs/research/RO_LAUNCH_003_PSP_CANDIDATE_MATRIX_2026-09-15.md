# RO-LAUNCH-003 — Romania Marketplace PSP Candidate Matrix

> **STATUS: RESEARCH / PROVIDER NOT SELECTED / PRE-COUNSEL / PRE-ACCOUNTANT**
> **As of:** 2026-09-15
> **Issue:** #495
> **Parent:** #492

This matrix narrows the external-PSP search for the first Romanian professional-merchant Marketplace. It does not approve a provider, open an account, accept provider terms, or authorize live charging.

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
- DROPi does not intentionally safeguard/hold customer funds or issue stored value;
- refunds, partial refunds, reversals, chargebacks and negative balances must be attributable by economic component;
- immutable provider transaction, settlement and reconciliation references are required.

No provider passes solely because it can process ordinary card payments.

## 2. Candidate providers verified from provider-owned sources

| Provider | Romania / platform evidence | Marketplace / split evidence | Candidate state |
|---|---|---|---|
| **PayU Marketplace** | European PayU Marketplace documentation is current and PayU has Romania-specific payment capabilities | Provider documentation describes platforms connecting buyers and submerchants, submerchant verification, single-cart Marketplace payments and automatic splitting so the platform does not need to handle submerchant funds | `STRONG_CANDIDATE / COMMERCIAL_AND_LEGAL_REVIEW_REQUIRED` |
| **NETOPIA Marketplace** | Romanian provider with Romania-specific commercial/payment documentation | NETOPIA describes a Marketplace solution with real-time split transactions and each registered seller receiving its order funds directly into the seller company's own account | `STRONG_CANDIDATE / API_KYB_CONTRACT_REVIEW_REQUIRED` |
| **Stripe Connect** | Stripe Connect documentation lists Romania among supported connected-account countries and describes Marketplace use cases | Connect supports Marketplace collection/payout patterns; exact Romanian platform configuration, charge type, liability, KYB and payout model must be fixed through Connect onboarding | `CANDIDATE / CONFIGURATION_AND_LEGAL_REVIEW_REQUIRED` |
| **Adyen for Platforms** | Adyen platform documentation lists Romania among supported countries/regions | Adyen for Platforms is designed for platform/Marketplace onboarding and payment flows; commercial fit and minimum/contract requirements need direct confirmation | `CANDIDATE / COMMERCIAL_REVIEW_REQUIRED` |
| **Mollie / Mollie Connect** | Mollie publicly launched Romania in April 2026; its support material lists Romania and provides a platform-partner/Connect path | Platform capability is evidenced, but the exact DROPi Marketplace split/merchant settlement contract must be verified before treating it as an equivalent first-pilot solution | `CANDIDATE / MARKETPLACE_FLOW_CONFIRMATION_REQUIRED` |

## 3. Official/provider references checked 2026-09-15

### PayU

- Marketplace: `https://developers.payu.com/europe/docs/services/marketplace/`
- Marketplace integration: `https://developers.payu.com/europe/docs/services/marketplace/integration/`

Important provider-described property: PayU Marketplace automatically splits payment to appropriate PayU accounts and states that the platform does not have to handle submerchant funds. This is useful evidence for the desired architecture but does not itself determine DROPi's Romanian payment-law classification.

### NETOPIA

- Marketplace solution: `https://netopia-payments.com/solutii/marketplace/`
- Merchant/payment settlement support material: `https://support.netopia-payments.com/`

Provider-described Marketplace property: real-time split transactions and seller proceeds paid directly to each seller company's account.

### Stripe

- Connect architecture/availability: `https://docs.stripe.com/connect/how-connect-works`
- Connected-account types/countries: `https://docs.stripe.com/connect/accounts`

Romania appears in the current connected-account availability material. This does not pre-select Express/Custom/Standard or a particular charge/transfer pattern.

### Adyen

- Marketplaces / platforms: `https://docs.adyen.com/marketplaces`
- Platforms: `https://docs.adyen.com/platforms`

Romania appears in supported platform-country material. Actual acceptance/commercial fit requires provider review.

### Mollie

- Romania launch: `https://www.mollie.com/ro/news/mollie-launches-romania`
- supported countries: `https://help.mollie.com/hc/ro/articles/115002116105-Pot-folosi-serviciile-Mollie-%C3%AEn-%C8%9Bara-mea`
- platform-partner path: `https://help.mollie.com/hc/ro/articles/360023556914-Cum-pot-deveni-partener-Mollie`

## 4. Mandatory provider questionnaire before selection

Every candidate must answer in writing for the proposed DROPi flow:

1. Can a Romanian platform onboard Romanian professional merchants/submerchants under the Marketplace/platform product?
2. Who is the merchant/payment-services customer for each payment component?
3. Does customer payment legally discharge the customer's debt to the merchant when the PSP accepts/captures it, and under what provider terms?
4. Does DROPi ever obtain possession/control/safeguarding responsibility over merchant/customer funds in the proposed configuration?
5. Who performs merchant KYB/KYC and ongoing verification; what remains DROPi's responsibility?
6. Can the provider split product proceeds, DROPi platform fee and later postal fee without an internal DROPi customer wallet?
7. Can platform fees be netted/allocated in the required model and how are they evidenced?
8. How are refunds and partial refunds executed when an order contains merchant goods + DROPi fee + optional postal charge?
9. How are chargebacks and negative merchant balances allocated?
10. Are reserves/security deposits required and who owns them?
11. What webhook/idempotency/reconciliation identifiers are guaranteed?
12. What settlement reports are available for merchant, platform, refund and chargeback reconciliation?
13. Which Romanian/local payment methods are supported for this Marketplace configuration?
14. What transaction/country/category restrictions apply to the first paper-goods allowlist?
15. What provider contract, pricing, minimum-volume or underwriting conditions apply to a new Marketplace?
16. What data-processing/controller/processor roles and international transfers apply?
17. What PCI/security scope remains with DROPi for the selected checkout integration?
18. Can cash/COD remain disabled without breaking the provider model?

## 5. Technical comparison gate

No implementation issue may encode a provider-specific production contract until the selected candidate has an approved `PaymentProviderProfile` containing at least:

```text
providerId
legalEntity
platformAccountIdRef
merchantAccountModel
merchantKybOwner
chargeModel
fundsPossessionBoundary
platformFeeModel
refundModel
chargebackModel
negativeBalanceModel
settlementCadence
reconciliationReportContract
webhookContractVersion
supportedCurrencies
supportedPaymentMethods
restrictedCategories
providerTermsVersion
dataRoleProfile
reviewedAt
reviewDueAt
approvalState
```

Secrets/API keys are never stored in this legal corpus.

## 6. Current disposition

The evidence is sufficient to reject an internal wallet as a first-pilot prerequisite and to keep multiple viable regulated-PSP candidates open.

It is **not** sufficient to select a provider or enable live payments.

Current state:

`PSP_SHORTLIST_IDENTIFIED / PROVIDER_SELECTION_PENDING / MONEY_FLOW_LEGAL_ACCOUNTING_REVIEW_REQUIRED / LIVE_CHARGING_DISABLED`
