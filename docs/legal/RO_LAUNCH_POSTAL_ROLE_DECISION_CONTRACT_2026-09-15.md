# RO-LAUNCH-004 — Romania Postal Role Decision Contract

> **STATUS: PRE-AUTHORITY / PRE-COUNSEL / FAIL-CLOSED**
> **As of:** 2026-09-15
> **Issue:** #496
> **Parent:** #492

This document converts the current ANCOM evidence into a product/domain boundary. It does not file a notification, grant a postal right, or authorize public postal resale.

## 1. Role enum required by the product

DROPi must not model logistics as one generic boolean. The first-launch contract requires at least:

```text
MERCHANT_MANAGED_FULFILMENT
CARRIER_INTERMEDIATION_UNCLASSIFIED
DROPI_POSTAL_RESALE
DROPI_POSTAL_PROVISION
```

Optional later transport/freight roles must be added separately rather than overloaded into these values.

## 2. Model A — `MERCHANT_MANAGED_FULFILMENT`

Working first-pilot baseline:

- merchant remains responsible for choosing/contracting its own fulfilment method/provider under the approved merchant agreement;
- DROPi records truthful fulfilment status/evidence needed for the Marketplace order;
- DROPi does not market itself as the postal provider/reseller merely because it stores a carrier name, tracking reference or status;
- DROPi does not collect a DROPi postal fee under this model;
- if DROPi technically transmits order/address data to a merchant-selected carrier, the exact boundary must still remain inside the approved merchant/processor/data contract and must not silently create a postal commercial offer by DROPi.

Candidate product state: `AVAILABLE_FOR_DESIGN`, subject to #493/#494/#498 and the exact factual integration staying inside this model.

This is a scope-reduction choice, not a legal conclusion that every possible merchant-fulfilment integration is outside postal regulation.

## 3. Model B — `CARRIER_INTERMEDIATION_UNCLASSIFIED`

Examples include:

- showing several carrier offers;
- choosing/ranking a carrier for the user;
- taking a commission for carrier matching;
- orchestrating carrier purchase without clearly becoming the postal reseller.

Current state:

`HOLD_LEGAL_CLASSIFICATION`

No implementation may assume CAEN `5330` alone proves that the factual flow is only unregulated software/intermediation.

## 4. Model C — `DROPI_POSTAL_RESALE`

Current ANCOM official guidance states that:

- offering, reselling or providing postal services triggers the general-authorization notification procedure;
- the notification uses the form under Decision 925/2023 and required attachments;
- postal resale is performed under written commercial resale agreements with effective postal providers;
- an exclusively reselling provider remains responsible to users for the postal service and cannot transfer that responsibility to the effective provider;
- a digital platform reselling postal services must clearly disclose that effective provision is carried out by one or more postal providers and identify at least the provider collecting the item from the sender;
- complaints from users concerning the contracted postal service are received/resolved by the reseller under the described model.

Decision 925/2023 further provides that the right/obligations arise only through a legally effective notification and are specific to the postal services indicated in that notification.

Therefore Model C activation requires all of:

```text
entity_role_approved
AND exact_postal_services_classified
AND ancom_notification_legally_effective
AND provider_authority_verified
AND written_resale_contract_active
AND customer_general_conditions_active
AND effective_provider_disclosure_active
AND complaint_claim_compensation_process_active
AND tariff_fee_invoice_model_approved
AND privacy_data_flow_approved
AND audit_and_revocation_monitoring_active
```

If one gate is false/unknown/expired, Model C is not orderable.

Current state: `HOLD_LEGAL / NOT AUTHORIZED`.

## 5. Model D — `DROPI_POSTAL_PROVISION`

DROPi later using its own or contracted riders/drivers as part of DROPi's postal provision is outside the first launch.

This model requires a separate decision on:

- DROPi's precise postal provider role;
- which operations are performed by DROPi versus third parties;
- whether third parties act on behalf of DROPi or are separate postal providers;
- vehicle/worker/insurance/safety/zone rules;
- service conditions, complaints, liability, compensation and operational evidence.

Current state: `LATER_SERVICE / HOLD_LEGAL`.

## 6. Mandatory order/checkout fields by role

### Model A

At minimum:

```text
fulfilmentRole = MERCHANT_MANAGED_FULFILMENT
merchantId
fulfilmentMethod
carrierName?            // only when truthfully known
carrierTrackingRef?     // only when truthfully known
merchantFulfilmentEvidenceRef
fulfilmentPolicyVersion
```

The UI must not call the carrier a `DROPi courier` or the charge a `DROPi delivery fee` unless the legal/contract model supports that description.

### Model C

Additional required evidence includes:

```text
fulfilmentRole = DROPI_POSTAL_RESALE
postalLegalEntityId
ancomAuthorityEvidenceRef
postalServiceType
resaleContractRef
resaleContractVersion
effectiveProviderId
collectingProviderId
customerPostalTermsVersion
postalPriceComponent
postalVatInvoiceTreatmentRef
complaintPolicyVersion
compensationPolicyVersion
providerAuthorityCheckedAt
providerAuthorityReviewDueAt
```

No generic carrier string substitutes for these fields.

## 7. Status transitions

```text
UNCLASSIFIED
  -> MERCHANT_MANAGED_FULFILMENT
  -> [order executes under merchant responsibility]
```

or, for integrated postal resale:

```text
UNCLASSIFIED
  -> POSTAL_RESALE_CANDIDATE
  -> LEGAL_ROLE_REVIEW
  -> ANCOM_FILING_READY
  -> NOTIFICATION_EFFECTIVE
  -> PROVIDER_CONTRACTS_READY
  -> CUSTOMER_TERMS_READY
  -> CONTROLLED_PILOT_READY
```

Failure/suspension states:

```text
HOLD_LEGAL
HOLD_AUTHORITY
HOLD_CONTRACT
HOLD_PROVIDER
SUSPENDED
WITHDRAWN
EXPIRED_EVIDENCE
```

There is no manual `forceEnableDelivery=true` bypass.

## 8. Official sources rechecked 2026-09-15

- OUG 13/2013 official Romanian Legislative Portal source: `https://legislatie.just.ro/Public/DetaliiDocumentAfis/217438`
- ANCOM general authorization: `https://www.ancom.ro/category/autorizare-ro/autorizare-generala-servicii-postale/`
- ANCOM authorization procedure: `https://www.ancom.ro/autorizare-ro/autorizare-generala-servicii-postale/procedura-de-autorizare-a-furnizorilor/`
- ANCOM digital-platform postal resale guidance: `https://infocentru.ancom.ro/platformele-digitale-care-revand-servicii-postale/`
- Decision 925/2023 official Legislative Portal: `https://legislatie.just.ro/Public/DetaliiDocument/277699`

The source register now contains `RO-OUG-13-2013-PORTAL-2026-09-15` as a primary-normative official Legislative Portal source. Its controlled byte copy/hash remains `pending_primary_copy`, and its DROPi reliance remains `pending_current_validation`; the archived 2019 ANCOM consolidation remains historical evidence only and must not be treated as the complete current primary source.

The current ANCOM pages independently identify OUG 13/2013, as subsequently amended, together with Decision 925/2023 as the principal current postal framework. They also state that offering, reselling or providing postal services requires notification and that the notification must be legally complete before the right to provide postal services exists. These regulator statements narrow the control boundary but do not themselves decide whether a particular DROPi factual flow is Model A, B, C or D.

Therefore the unresolved launch blocker is no longer "find OUG 13/2013". It is:

```text
controlled_current_primary_copy
+ exact DROPi factual process map
+ postal role classification
+ notification/contract evidence where the classified role requires it
+ qualified/authority disposition before activation
```

## 9. Engineering export

For the first launch, developer backlog may implement the **domain separation** and Model A truthful fulfilment contract without building Model C as if already authorized.

The first Marketplace loop therefore does **not** need to wait for DROPi postal resale if Product Owner retains merchant-managed fulfilment as the first-pilot path.

Model C can be added as a separately gated launch upgrade only after #496 receives the required written/authority disposition and filing/contract evidence.
