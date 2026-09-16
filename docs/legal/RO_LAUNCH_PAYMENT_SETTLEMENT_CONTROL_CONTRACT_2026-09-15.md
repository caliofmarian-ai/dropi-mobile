# RO-LAUNCH-003 — Romania Payment, Settlement and Reconciliation Control Contract

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / PROVIDER NOT SELECTED / FAIL-CLOSED**
> **As of:** 2026-09-15
> **Issue:** #495
> **Parent:** #492

This contract defines the payment architecture that engineering may model before a Romanian Marketplace PSP and exact money flow are approved. It does **not** authorize DROPi to provide regulated payment services, hold customer money, issue electronic money, operate legal escrow or enable live charging.

## 1. First-pilot boundary

Candidate first-pilot money path:

```text
customer
-> regulated external PSP/platform product
-> merchant/submerchant proceeds
+ separately evidenced DROPi platform/service fee
```

A future postal amount may be added only if #496 separately approves the relevant postal role and its commercial/tax treatment.

For the first pilot DROPi intentionally does not:

- safeguard or hold customer/merchant funds as its own payment service;
- issue stored monetary value or electronic money;
- maintain a customer cash-equivalent wallet;
- market or promise regulated/legal escrow;
- rely on cash/COD as a launch payment path;
- rely on a commercial-agent exclusion as the legal foundation of the product.

The EBA Q&A source family confirms that an e-commerce platform receiving payment on behalf of sellers is not automatically outside PSD2 merely because payment to the platform extinguishes the buyer's debt. Any exclusion analysis is factual and separately approved.

## 2. Provider authority is an evidence object

A brand name, API key or successful sandbox charge is not proof that the exact contracting entity may provide the required services to DROPi and its Romanian merchants.

```text
PaymentProviderAuthorityProfile {
  providerId
  providerBrand
  contractingLegalEntity
  providerCountry
  competentNationalAuthority
  authorizationType
  authorizationNumber?
  nationalRegisterEvidenceRef
  eeaPassportOrRomaniaServiceEvidenceRef?
  permittedServiceScope[]
  marketplacePlatformProduct
  merchantSubmerchantModel
  evidenceRetrievedAt
  effectiveFrom?
  reviewDueAt
  approvalState
}
```

The EBA central register may be used as a discovery/cross-check source, but the repository records the EBA warning that the central register itself has no legal significance. Final provider authority requires the competent national register/authorization/passporting evidence applicable to the contracting entity and service.

## 3. Money-flow profile

Every enabled payment configuration requires one approved, versioned `MoneyFlowProfile`.

```text
MoneyFlowProfile {
  id
  operatingEntityId
  sellerOfRecordProfileRef
  payerRole
  regulatedPspAuthorityProfileRef
  merchantPayeeModel
  dropiFeeModel
  postalFeeModel?
  fundsCustodianActor
  fundsPossessionByDropi
  safeguardingActor
  captureModel
  splitAllocationModel
  payoutModel
  refundModel
  chargebackModel
  negativeBalanceModel
  reserveModel
  settlementCurrency
  supportedPaymentMethods[]
  accountingReviewRef
  legalReviewRef
  approvedAt?
  reviewDueAt?
  state
}
```

Hard launch invariant:

```text
fundsPossessionByDropi == false
```

for the proposed first pilot, unless a later separately approved regulated model explicitly changes that boundary.

## 4. Payment state is not `paid=true`

Order/payment authority must be derived from authenticated provider events and an auditable state machine.

```text
PAYMENT_CREATED
-> CUSTOMER_ACTION_REQUIRED?
-> AUTHORIZED?
-> CAPTURED
-> ALLOCATION_RECORDED
-> SETTLEMENT_PENDING
-> SETTLED
```

Independent transitions may include:

```text
PAYMENT_FAILED
PAYMENT_CANCELLED
REFUND_PENDING
PARTIALLY_REFUNDED
REFUNDED
DISPUTE_OPEN
CHARGEBACK
REVERSAL
SETTLEMENT_ADJUSTED
```

A mobile redirect/success screen does not settle financial authority.

## 5. Webhook and idempotency contract

Provider events that affect money require:

- provider-authenticated/signed webhook validation;
- provider event ID uniqueness;
- idempotent command handling;
- replay protection;
- immutable raw-event/evidence reference where appropriate;
- explicit mapping from provider state to DROPi state;
- audit attribution for manual adjustments;
- reconciliation of missed/out-of-order events from provider reports/API.

```text
ProviderFinancialEvent {
  providerId
  providerEventId
  providerObjectId
  eventType
  providerCreatedAt
  receivedAt
  signatureValidationState
  idempotencyState
  amount
  currency
  componentAllocations[]
  mappedState
  evidenceRef
}
```

No duplicate webhook may create a duplicate order settlement, DROPi fee, merchant payout or refund.

## 6. Settlement and reconciliation ledger

The financial ledger must distinguish economic components rather than storing one opaque order total.

```text
SettlementEntry {
  orderId
  paymentProviderId
  providerPaymentRef
  componentType       // PRODUCT | DROPI_PLATFORM_FEE | POSTAL_FEE | PSP_FEE | REFUND | CHARGEBACK | ADJUSTMENT
  economicOwnerActor
  grossAmount
  taxTreatmentRef?
  providerFeeAmount?
  netAmount
  currency
  providerSettlementRef?
  payoutRef?
  accountingEvidenceRef?
  reconciliationState
  createdAt
}
```

Core equation checks must be deterministic and evidence-backed. Provider reports and webhook/API events must reconcile to the internal component ledger; unexplained differences produce `RECONCILIATION_EXCEPTION`, not silent correction.

## 7. Refund / withdrawal / conformity integration

A refund is an economic action, not the legal conclusion itself.

Withdrawal, return/conformity and payment reversal remain separate cases linked by references.

The selected PSP model must support, and the approved financial contract must define:

- full refund;
- partial refund;
- merchant product component refund;
- DROPi fee refund/non-refund policy where legally permitted;
- future postal component refund where applicable;
- refund after partial settlement/payout;
- provider fee treatment;
- duplicate-refund prevention;
- failed/expired refund recovery;
- immutable linkage to the underlying consumer/support case.

Exact refund responsibility and timing remain subject to consumer-law, provider-contract and accounting review.

## 8. Disputes, chargebacks, negative balances and reserves

These values are provider-contract decisions and must not be guessed.

```text
ProviderRiskAllocationProfile {
  disputeEvidenceOwner
  disputeSubmissionActor
  chargebackEconomicOwner
  negativeMerchantBalanceOwner
  negativePlatformBalanceOwner
  reserveRequired
  reserveOwner
  reserveReleaseRules
  merchantRecoveryRights
  platformRecoveryRights
  providerTermsVersion
  approvalState
}
```

Until the selected PSP provides written terms for the actual Marketplace configuration, all such values remain `TBD` and live charging remains blocked.

## 9. SCA and authentication

PSD2/SCA rules and exemptions are implemented through the selected regulated PSP's supported flow and current legal framework.

DROPi must not:

- suppress a provider-required SCA step merely to reduce checkout friction;
- assume that every transaction requires the same authentication path;
- independently declare a regulatory SCA exemption without provider/legal authority;
- infer successful payment from UI navigation alone.

The checkout integration must preserve the provider's authoritative status and challenge/result evidence.

## 10. Payout is not an invoice

Payment movement and fiscal/document responsibility are separate domains.

```text
provider payout != tax invoice
provider split != seller-of-record decision
provider merchant account != supplier identity
PSP settlement report != RO e-Factura compliance
```

Before production, the approved transaction matrix must separately identify, for each economic component:

- supplier/contracting actor;
- seller/title actor where goods are involved;
- taxable amount and VAT treatment;
- invoice/receipt issuer;
- RO e-Factura obligation and evidence where applicable;
- accounting entry owner;
- PSP allocation/payout path.

No payment-provider feature may silently decide those legal/fiscal roles.

## 11. Wallet / stored-value boundary

Romanian Law 210/2019 on electronic money is now part of the source family because a future stored-value/cash-equivalent DROPi wallet may change the regulated perimeter.

For the first launch:

```text
internal_customer_wallet = DISABLED
stored_monetary_value = DISABLED
e_money_issuance = DISABLED
legal_escrow_claim = DISABLED
```

A future loyalty point or non-monetary benefit model must still be reviewed on its actual characteristics before it is labelled outside payment/e-money law.

## 12. Cash / COD

Cash/COD remains disabled for the first pilot. It may be reconsidered only with an approved fiscal, receipt, refund, fraud, carrier/merchant custody and reconciliation model.

## 13. Live payment activation gate

```text
LivePaymentGate =
  operating_entity_approved
  AND seller_of_record_matrix_approved
  AND provider_selected
  AND provider_authority_current
  AND provider_contract_effective
  AND merchant_kyb_model_approved
  AND money_flow_profile_approved
  AND no_unapproved_dropi_fund_custody
  AND payment_methods_approved
  AND webhook_signature_contract_tested
  AND idempotency_tested
  AND settlement_reconciliation_tested
  AND refund_dispute_model_approved
  AND privacy_data_role_approved
  AND supplier_vat_invoice_matrix_approved
  AND legal_pack_current
```

Any `UNKNOWN`, stale or missing required state denies live charging.

## 14. Source chain rechecked / registered 2026-09-15

The controlled register now includes or identifies:

- current Romanian Law 209/2019 payment-services baseline already in the corpus;
- `RO-OUG-5-2026-PAYMENTS-AMENDMENT` — 2026 amendment family affecting Law 209/2019, controlled byte copy pending after official Portal retrieval limitations;
- `EU-DIR-2015-2366-PSD2-CONSOLIDATED-2025-01-17` — consolidated PSD2 endpoint registered; controlled copy remains pending because the automated payload did not pass the capture validator;
- `EU-REG-2018-389-SCA-CONSOLIDATED-2023-09-12` — SCA/secure-communication RTS endpoint registered; controlled copy remains pending;
- archived EBA Q&A `2020_5354` and `2020_5355` on e-commerce/commercial-agent analysis;
- archived EBA central payment/e-money register page, explicitly treated as a cross-check rather than final legal authorization evidence;
- `RO-LAW-210-2019-EMONEY-CURRENT-2026-03-05` — current Romanian e-money endpoint registered with controlled byte copy pending.

Source presence does not resolve the factual DROPi payment perimeter or select a PSP.

## 15. Current disposition

Engineering may implement provider abstraction, evidence-backed payment states, signed-webhook/idempotency machinery, component ledger, reconciliation engine and fail-closed activation gates without assuming the unresolved provider/legal values.

Production remains:

`PSP_NOT_SELECTED / MONEY_FLOW_NOT_APPROVED / WALLET_DISABLED / LIVE_CHARGING_DISABLED`
