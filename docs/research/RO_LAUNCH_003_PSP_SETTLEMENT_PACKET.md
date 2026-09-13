# RO-LAUNCH-003 — Licensed PSP, Settlement, Refund and Invoicing Packet

> **STATUS: PRE-COUNSEL / PRE-ACCOUNTANT / IMPLEMENTATION BLOCKED**
> **Version:** 0.1.0
> **Research cut-off:** 2026-09-13
> **Issue:** #495
> **Parent:** #492
> **Repository baseline:** `08ac65e69028e636fd0ee51db9a9dad1b47be2bc`
> **Governing legal canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This packet defines a conservative candidate payment architecture for the first Romanian Marketplace pilot. It does not select a PSP, approve a payment product, determine tax treatment, or authorize live charging.

## 1. Non-negotiable MVP decision

The first-launch architecture should be designed so that DROPi does **not** itself receive, safeguard, hold, store or remit customer funds as a payment service.

Candidate model:

```text
Customer
  -> licensed/eligible PSP payment flow
  -> merchant beneficiary settlement
  -> DROPi platform/service fee settlement
  -> approved postal/logistics component where applicable

DROPi runtime
  <- PSP payment status/events
  <- PSP transaction/reconciliation identifiers
  <- payout/refund/chargeback status
  != client-fund custody
  != stored-value wallet
  != legal escrow
```

The payment provider's regulated status does not settle the underlying seller, VAT, invoice, refund or liability allocation. Those remain governed by #493, #494, #496 and the final contracts.

## 2. Legal baseline

Romanian Law No. 209/2019 regulates professional payment-service provision and lists the categories of providers that may provide payment services in Romania.

The current law also excludes specified technical-support services where the technical provider supports payment services **without at any time entering into possession of the funds to be transferred**, subject to the exact statutory scope.

This supports a DROPi architecture in which the platform is a technical/commercial Marketplace layer and an eligible PSP performs regulated payment functions.

## 3. Do not rely on the PSD2 commercial-agent exclusion as the MVP foundation

EBA/European Commission PSD2 Q&A states that an e-commerce platform receiving payment on behalf of a payee is **not excluded by default** merely because payment to the platform discharges the buyer's debt.

A B2C platform may fall within the commercial-agent exclusion only where the actual agreement and business model satisfy the PSD2 requirements, including acting on behalf of only the payer or only the payee in the required way. The competent authority assesses the actual business model.

Therefore:

- DROPi should not design fund custody first and hope the commercial-agent exclusion applies later;
- DROPi should not tell engineering that a seller mandate automatically makes payment collection unregulated;
- any future attempt to receive/control funds directly is a separate legal/payment-authority project.

## 4. Candidate first-launch money-flow contract

### 4.1 Economic components

Every checkout should preserve separate components:

- `productAmount` — seller-of-record merchandise amount;
- `merchantTaxAmount` — where applicable to the approved seller tax model;
- `deliveryAmount` — exact legal delivery/postal supplier must be known;
- `dropiPlatformFee` — DROPi revenue under merchant/customer contract as approved;
- `discountAmount` — allocated to the party actually funding the discount;
- `refundReserveOrAdjustment` — only if the PSP/product/accounting model actually supports it;
- `pspFee` — provider fee allocation per contract/accounting model.

A single opaque `total` is insufficient for accounting/reconciliation authority.

### 4.2 Payment transaction record

Candidate immutable record:

`PaymentTransaction`

Minimum candidate fields:

- internal order/contract ID;
- legal seller ID;
- payer/customer reference;
- PSP and payment-product identifier;
- PSP payment/intent/charge identifier;
- authorized amount and currency;
- captured amount and timestamp;
- component allocation snapshot;
- platform fee reference;
- merchant beneficiary/connected-account reference where applicable;
- postal/logistics beneficiary or payable reference where applicable;
- status/event sequence;
- refund/chargeback/dispute references;
- reconciliation batch/payout references;
- terms/fee/tax model versions.

No card number, secret authentication material or unnecessary PSP-sensitive data should be persisted in DROPi.

## 5. Settlement architecture

The preferred MVP pattern is a marketplace PSP product that can support merchant onboarding/verification and platform fee/payout mechanics without DROPi holding customer funds itself.

Provider selection is separate from this legal packet.

Stripe Connect is a current technical candidate because Stripe lists Romania as supported and Connect is marketed for marketplace seller onboarding, payment acceptance, fee collection and payouts. This is **not a provider decision**. Before selection, DROPi must verify:

- Romanian platform-account eligibility;
- Romanian merchant/connected-account eligibility;
- exact Connect account type available and responsibility allocation;
- KYC/KYB responsibility and evidence accessibility;
- supported payment methods/currencies;
- payout timing/control;
- refunds, partial refunds, disputes and chargebacks;
- fee schedule and negative-balance liability;
- data processing/security terms;
- tax reporting/export capability;
- service suspension/termination portability.

Alternative eligible marketplace PSPs should be compared before the owner decision.

## 6. Refund and withdrawal integration

Consumer withdrawal/refund rights from #494 must be translated into money movements without making the payment system the legal decision-maker.

Candidate sequence:

```text
Withdrawal/Return/Complaint decision
  -> legally responsible party approves/refuses with reason
  -> allocation engine computes affected components
  -> PSP refund/reversal command
  -> PSP event confirms financial result
  -> accounting/reconciliation record updated
  -> customer receives durable evidence
```

Rules to validate:

- product refund must reverse the seller amount according to the seller's legal obligation;
- delivery-cost refund treatment follows consumer/postal law and the selected delivery option;
- DROPi platform fee refundability must follow approved terms/law and cannot be hidden;
- partial refunds must preserve component-level allocation;
- chargeback is not the same legal workflow as statutory withdrawal, product conformity or postal claim;
- failed PSP refund does not erase the underlying consumer obligation.

## 7. Chargebacks and negative balances

The provider contract must explicitly establish:

- who bears chargeback loss for merchant product disputes;
- who bears loss for platform-service disputes;
- who bears delivery/postal disputes;
- whether PSP can debit merchant/platform balances;
- reserve/negative-balance rules;
- evidence deadlines and owner of dispute submission;
- account suspension consequences.

DROPi should not create an internal customer/seller wallet merely to mask provider negative-balance behavior.

## 8. Invoicing and fiscal allocation

#493 owns the final accounting/tax decision. The payment domain must nevertheless preserve enough data so each legal supplier can invoice the correct amount.

Candidate allocation to validate:

- merchant invoices/records the product sale where merchant remains seller of record;
- DROPi invoices/records the platform/service fee owed to DROPi under the approved contract;
- postal/logistics invoice depends on #496's exact provider/reseller model;
- PSP statement/evidence is payment evidence and does not replace the fiscal document duties of the legal supplier;
- RO e-Factura submission obligations must be tied to the actual invoice issuer and covered transaction.

## 9. Payment state machine

Candidate operational state model:

```text
PAYMENT_CREATED
  -> PAYMENT_AUTHORIZED
  -> PAYMENT_CAPTURED
  -> SETTLEMENT_PENDING
  -> SETTLED
```

Alternative states:

```text
PAYMENT_FAILED
PAYMENT_CANCELLED
REFUND_PENDING
PARTIALLY_REFUNDED
REFUNDED
DISPUTED
CHARGEBACK_LOST
CHARGEBACK_WON
PAYOUT_HELD
PAYOUT_FAILED
```

The order lifecycle must not pretend that `paid=true` proves the merchant has been settled or that `refunded=true` proves every component is correctly reconciled.

## 10. Exactly-once financial event processing

Every PSP webhook/event that changes financial state must be processed idempotently.

Required architecture properties:

- provider event ID unique key;
- internal payment transaction ID;
- immutable event receipt;
- duplicate-event rejection/no-op;
- out-of-order event handling;
- reconciliation against PSP API/export;
- no double platform fee, merchant credit or refund from retries;
- audit attribution for manual financial adjustments;
- no silent administrator editing of settled amount.

## 11. Cash and off-platform payments

The first pilot should default to **cash disabled** unless #493/#495 professional review expressly approves a cash flow.

Reasons include:

- invoice/fiscal device implications;
- reconciliation and failed-delivery risk;
- refund evidence;
- platform fee leakage;
- consumer and postal liability allocation;
- anti-fraud and audit complexity.

Off-platform payment must not be promoted as a method to bypass platform fees, consumer controls, fiscal records or payment-provider rules.

## 12. Candidate engineering contract

Future implementation should separate:

- `PaymentProvider` abstraction;
- `PaymentTransaction`;
- `PaymentEventReceipt`;
- `SettlementAllocation`;
- `MerchantPayoutReference`;
- `PlatformFeeReference`;
- `RefundCase` financial projection;
- `ChargebackCase`;
- `ReconciliationRun`;
- `FinancialAdjustment` with dual/audited authority where needed.

This is not a request to implement a generic DROPi wallet.

## 13. Fail-closed rules

```text
if PSP legal/product eligibility unknown -> live payment disabled
if seller beneficiary unknown -> checkout payment disabled
if seller-of-record unresolved -> checkout payment disabled
if allocation components cannot be reconciled -> settlement automation disabled
if postal fee legal supplier unknown -> affected fulfilment/payment option disabled
if current terms/tax model missing -> binding checkout disabled
if webhook signature invalid -> event rejected
if duplicate PSP event -> no duplicate economic effect
```

## 14. Questions for payment counsel/accountant/PSP

1. Confirm that the selected PSP product keeps DROPi outside regulated payment-service provision for the approved flow and identify any activity DROPi must not perform.
2. Confirm whether any commercial-agent exclusion is relevant; if so, document it only as a scoped legal conclusion, not the architectural foundation.
3. Confirm beneficiary/seller onboarding responsibilities between DROPi and PSP.
4. Confirm who legally receives customer payment and when the buyer's payment obligation to the merchant is discharged.
5. Confirm platform-fee, postal-fee and merchant-proceeds VAT/invoice treatment.
6. Confirm refund allocation for standard withdrawal, conformity remedies, cancellation, failed delivery and postal claims.
7. Confirm chargeback/negative-balance allocation and reserve obligations.
8. Confirm whether cash should remain disabled for the first pilot.
9. Confirm PSP evidence/retention needed for audits, tax and consumer disputes.
10. Confirm exit/migration requirements so seller/payment evidence remains exportable if DROPi changes PSP.

## 15. Source-capture queue for #499

- current consolidated Romanian Law No. 209/2019;
- 2025/2026 amendments relevant to technical-service and instant-payment provisions;
- PSD2 current official text for the approved launch date;
- EBA/European Commission Q&A on commercial-agent exclusion for e-commerce platforms;
- selected PSP's EU/Romanian regulated entity, licence/passport evidence and applicable marketplace product terms after provider selection;
- Romanian fiscal/invoicing sources consumed from #493.

## 16. Current disposition

| Matter | State |
|---|---|
| External licensed PSP architecture | `RECOMMENDED FOR MVP` |
| DROPi client-fund custody | `NOT APPROVED FOR MVP` |
| DROPi stored-value wallet | `NOT REQUIRED / HOLD` |
| Legal escrow claim | `PROHIBITED UNLESS SEPARATELY ESTABLISHED` |
| PSD2 commercial-agent exclusion | `DO NOT RELY ON BY DEFAULT` |
| Stripe Connect | `TECHNICAL CANDIDATE ONLY` |
| Cash | `HOLD / DEFAULT DISABLED` |
| Live charging | `BLOCKED UNTIL PSP + TAX + CONTRACT + IMPLEMENTATION GATES` |

This packet is ready for controlled source capture and provider/accounting/legal review. It does not authorize a payment integration.