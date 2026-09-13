# RO-LAUNCH-004 — Romanian Postal Role / ANCOM Authorization Packet

> **STATUS: PRE-COUNSEL / PRE-AUTHORITY-CONFIRMATION / IMPLEMENTATION BLOCKED**
> **Version:** 0.1.0
> **Research cut-off:** 2026-09-13
> **Issue:** #496
> **Parent:** #492
> **Repository baseline:** `08ac65e69028e636fd0ee51db9a9dad1b47be2bc`
> **Governing legal canon:** `canonical/LEGAL_COMPLIANCE_SOURCE_OF_TRUTH.md`

This packet separates four possible parcel-fulfilment business models and defines the evidence required before DROPi exposes an integrated postal service. It does not constitute an ANCOM filing, legal classification or authorization.

## 1. Current primary/regulator baseline

Current ANCOM guidance states that any person intending to begin an activity consisting in **offering, reselling or providing postal services** must notify ANCOM no later than the day the activity begins. The authorization procedure is free and uses the standard notification under ANCOM Decision No. 925/2023.

ANCOM states that notification is considered completed only when all legal requirements concerning transmission, form and content are satisfied; until then the person has **no right to provide postal services**.

The Romanian postal ordinance also expressly states that persons reselling postal services supplied by a postal provider, including through web applications, have the notification obligation.

Decision No. 925/2023 is currently marked by ANCOM as in force.

## 2. Four DROPi parcel models that must remain separate

### Model A — merchant-managed fulfilment

```text
Customer orders goods through DROPi
Merchant remains seller of record
Merchant independently chooses/contracts carrier
Carrier service is not sold/resold by DROPi
DROPi records order/fulfilment evidence only to the approved technical extent
```

Candidate disposition:

`MERCHANT_FULFILMENT / POSTAL_ROLE_NOT_ASSUMED`

Questions to confirm:

- whether any DROPi functionality goes beyond neutral technical support into postal-service offering/intermediation;
- what data/notifications DROPi may transmit between merchant and carrier without becoming contractual postal provider/reseller;
- how the consumer is told who bears delivery responsibility.

This model is the lowest-assumption fallback for the first pilot.

### Model B — carrier comparison / intermediation

```text
DROPi presents or matches approved external carrier options
Customer/merchant contracts the effective provider under the approved model
DROPi may earn an intermediation fee
DROPi does not itself provide the postal service
```

Candidate CAEN direction from #493: `5330` may be relevant where DROPi brings postal customers/providers together for a fee/commission without itself providing the postal service.

**Important:** CAEN classification does not answer whether a specific contractual UX becomes `offering` or `reselling` under postal law. This model remains `WRITTEN_CONFIRMATION_REQUIRED`.

### Model C — DROPi postal resale

```text
DROPi offers/resells the postal service
DROPi is notified/authorized for the approved service scope
DROPi has written resale contract with effective postal provider
Effective provider performs collection/transport/delivery
DROPi remains responsible to the user under the resale model
```

Current ANCOM guidance explicitly recognizes platforms/web applications that resell postal services.

For exclusive resale, ANCOM states that:

- resale must be based on written commercial resale agreements with effective postal providers;
- the reseller must be authorized/notified for this activity;
- the reseller remains responsible to users for the postal service and cannot shift that responsibility to the effective provider merely because the effective provider performs component operations.

This is the **candidate first integrated DROPi logistics model** if counsel/ANCOM confirms it fits the intended checkout/contract flow.

### Model D — DROPi postal provider using own/contracted delivery operators

```text
DROPi offers/provides postal service
DROPi has the applicable ANCOM provider status
DROPi directly performs operations and/or contracts third parties to collect/sort/transport/deliver on its behalf
DROPi remains responsible to users
```

ANCOM guidance states that collection, sorting and delivery may be performed directly or indirectly on behalf of the postal provider under written contract, including by a third party that is not itself a postal provider; responsibility remains with the postal provider using that third party.

This model is **not part of the first MVP**. It is the later legal basis to assess before DROPi activates its own bicycle/e-bike/scooter/car/van delivery-partner network.

## 3. Transport-only distinction

OUG No. 13/2013 Article 7 states that persons that only transport postal items, without also performing collection, sorting or delivery, do not have the notification obligation in that transport-only role.

This must not be misread as a general exemption for couriers or platforms. A rider/driver collecting from the merchant and delivering to the recipient is not merely doing line-haul transport in the ordinary sense of that provision.

Product consequence:

`transport_only` must never be inferred from vehicle type or from the fact that another company owns the customer contract.

## 4. Candidate first-sector authorization sequence

If DROPi selects Model C (postal resale), the proposed sequence is:

1. fix responsible Romanian entity under #493;
2. document exact merchant/customer/DROPi/effective-carrier contract flow;
3. obtain written counsel/ANCOM classification of the intended model where ambiguity remains;
4. select one or more effective postal providers already entitled to provide the required service;
5. negotiate written postal-resale agreement(s);
6. prepare DROPi general conditions for postal service in the form/content required by Decision No. 925/2023;
7. prepare the standard ANCOM notification and required company documents;
8. sign/submit through the current required electronic-signature/channel procedure;
9. verify that notification is legally realized before any DROPi postal service is enabled;
10. store authorization/register evidence, scope, effective date and service types;
11. enable only the exact postal product/service scope described by the approved pack;
12. monitor/report modifications and suspension/cessation obligations.

## 5. Notification evidence

ANCOM's current authorization page states that the notification uses the standard form in Annex 2 to Decision No. 925/2023 and must include the required supporting documentation.

For Romanian applicants, the exact current document list and legal entity data must be captured from the Decision/current procedure before filing.

ANCOM also states that the general conditions for postal service are part of the notification package and represent the general clauses of the contract with the sender, with content prescribed by Annex 1 to Decision No. 925/2023.

The current procedure requires electronic transmission through ANCOM's stated authorization channel and an appropriately qualified/extended electronic signature under the procedure in force.

**Repository rule:** do not hard-code a static PDF checklist. Store a versioned filing-pack definition linked to Decision/source version.

## 6. General conditions / customer contract controls

Before Model C can go live, DROPi must have approved postal service conditions that map the legally required content into application behavior.

Candidate control domains:

- service type and geographic scope;
- sender/recipient definitions and responsibilities;
- acceptance/collection conditions;
- prohibited/restricted postal items;
- packaging/addressing requirements;
- tariff and charging rules;
- delivery attempts and recipient evidence;
- delivery time/quality commitments where applicable;
- loss/damage/delay liability;
- complaint/claim submission and evidence;
- compensation rules/limits;
- return-to-sender/undeliverable handling;
- subcontractor/effective-provider role disclosure;
- data/privacy/confidentiality/security;
- suspension/force majeure/incident rules;
- current terms version bound to each postal order.

The exact mandatory clauses/limits must be extracted from the current Decision/OUG and approved before design.

## 7. Platform disclosure for postal resale

ANCOM's 18 October 2024 guidance for digital platforms reselling postal services states that platforms which exclusively resell postal services must make clear, in a visible place, that the service is actually performed by one or more postal providers and indicate at least the provider that will collect the postal item from the sender.

Candidate DROPi order/checkout disclosure:

- `postalResellerLegalEntity`;
- `effectiveCollectionProvider`;
- other effective provider(s) where known/required;
- service name/scope;
- tariff;
- applicable postal terms version;
- complaint/claim responsible party;
- tracking/proof role.

Do not display `DROPi courier` when an external provider is the effective collecting/delivery provider unless that wording has an approved meaning.

## 8. Carrier due diligence

An external carrier appearing in an approved Model B/C flow should have at least:

- current identity and company registration;
- current ANCOM public-register/provider status where applicable;
- service types and geographic coverage;
- contract authority/signatory;
- insurance/liability evidence required by contract/law;
- tracking/proof integration capability;
- claims/complaints interface;
- incident/security/privacy contacts;
- suspension/termination signal;
- current service terms and prohibited-items rules.

Carrier API availability alone is not authorization evidence.

## 9. Provider/reseller authority model

Candidate capability record:

`PostalServiceCapability`

Scoped by:

- responsible entity;
- legal role: `merchant_fulfilment | intermediary | reseller | provider`;
- postal service type;
- effective provider(s);
- geography;
- ANCOM notification/register evidence where applicable;
- decision/source pack version;
- commercial agreement version;
- customer terms version;
- effective/expiry/suspension state.

No global `deliveryAuthorized=true`.

## 10. Lifecycle / revalidation

Candidate states:

```text
RESEARCHED
  -> ROLE_PENDING
  -> CONTRACT_FLOW_APPROVED
  -> APPLICATION_PREPARATION
  -> NOTIFICATION_SUBMITTED
  -> NOTIFICATION_REALIZED
  -> AUTHORITY_EVIDENCED
  -> PILOT_ENABLED
  -> PUBLIC_ENABLED
```

Alternative states:

```text
NOTIFICATION_INCOMPLETE
ROLE_REJECTED
SUSPENDED
EXPIRED_OR_STALE
CESSATION_PENDING
RETIRED
```

An uploaded notification email is not proof that notification is legally realized.

## 11. Ongoing change/reporting controls

ANCOM's current information-obligation page states that postal providers must report certain changes within the prescribed deadlines, including changes to notification data and changes to general postal service conditions.

The platform therefore needs:

- authority-change events;
- legal/service-terms versioning;
- operational suspension when authority/service scope becomes invalid;
- a compliance calendar rather than one-time onboarding approval.

## 12. Architecture consequences

For the first launch, order/fulfilment architecture should separate:

`FulfilmentOffer`
- merchant-managed fulfilment
- external postal option/intermediation
- DROPi postal resale option

from:

`OperationalCarrierLeg`
- effective provider
- pickup/tracking/proof status

and from:

`PartnerVehicleCapability`
- later DROPi own-fleet/person/vehicle authorization.

This prevents the existing multimodal future model from falsely implying own-fleet authority during the carrier-based MVP.

## 13. Fail-closed rules

```text
if postal legal role unresolved -> DROPi-branded postal option disabled
if resale notification required but not legally realized -> resale disabled
if effective carrier authority/status invalid -> affected option disabled
if written resale agreement missing/expired -> affected resale disabled
if postal terms missing/stale -> new postal order disabled
if effective collecting provider cannot be identified where disclosure required -> affected checkout disabled
if customer claim responsibility unknown -> launch gate FAIL
```

## 14. Questions for Romanian counsel / ANCOM

1. For Model A, identify the boundary between neutral Marketplace technical integration and `offering`/intermediation/resale of postal service.
2. For Model B, determine whether the proposed comparison/matching/commission flow requires ANCOM notification despite not taking contractual responsibility for postal provision.
3. For Model C, confirm that DROPi's intended checkout/customer contract is postal resale and identify every notification/terms/record obligation.
4. Confirm whether one notified Romanian DROPi entity may resell services from multiple effective providers and how provider identity must be disclosed per order.
5. Confirm exact requirements when DROPi sets or marks up the postal tariff.
6. Confirm complaint/liability/compensation allocation between reseller and effective provider.
7. Confirm required service-condition clauses and retention/evidence rules.
8. Confirm what changes require new/updated notification versus ordinary ANCOM information update.
9. Confirm what public register/certificate evidence is sufficient for DROPi's runtime authority pack.
10. For later Model D, confirm when third-party bicycle/e-bike/scooter/car/van couriers act in the name/on behalf of DROPi versus becoming separate postal providers.

## 15. Source-capture queue for #499

- current OUG No. 13/2013 consolidated text and amendments;
- ANCOM Decision No. 925/2023 and Annexes 1/2;
- current ANCOM authorization procedure;
- current ANCOM general-authorization/resale guidance;
- ANCOM 18 October 2024 guidance on digital platforms reselling postal services;
- current ANCOM provider register/evidence method;
- current change/reporting obligations;
- selected carrier's current authority evidence and contract terms after selection.

## 16. Current disposition

| Model | State |
|---|---|
| A — merchant fulfilment | `RECOMMENDED FALLBACK / SCOPE REVIEW REQUIRED` |
| B — carrier intermediation | `WRITTEN_CONFIRMATION_REQUIRED` |
| C — DROPi postal resale | `CANDIDATE FIRST INTEGRATED LOGISTICS MODEL` |
| D — own/contracted delivery operations under DROPi provider role | `LATER SERVICE / HOLD` |
| ANCOM Decision 925/2023 | `CURRENT / IN FORCE — SOURCE CONFIRMED` |
| Postal notification before required activity | `CURRENT REQUIREMENT — SOURCE CONFIRMED` |
| Public integrated DROPi postal service | `BLOCKED UNTIL ROLE + NOTIFICATION + CONTRACT + TERMS + IMPLEMENTATION` |

This packet is ready for #499 source control and later written counsel/ANCOM confirmation. It does not authorize postal operation.