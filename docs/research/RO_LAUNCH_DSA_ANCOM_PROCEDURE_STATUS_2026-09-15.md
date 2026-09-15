# Romania DSA / ANCOM Procedure Status — 2026-09-15

> **STATUS: OFFICIAL-SOURCE RESEARCH / PROCEDURE NOT CONFIRMED FINAL / FAIL-CLOSED**
> **Parent:** #494 / #499
> **Governing law:** Law No. 50/2024 + Regulation (EU) 2022/2065

This note isolates a procedural point that must not be inferred from a 2024 consultation draft.

## 1. Statutory obligation exists

Law No. 50/2024, Article 5, requires a Romanian provider of intermediary services, other than public authorities/institutions, to send ANCOM an information notice within at most 45 days from beginning to offer the services. The information includes at least provider identification and the single contact point required for authority/recipient communications. Article 5(2) states that the form, content and conditions are established by ANCOM decision; Article 5(3) requires changes to submitted information to be notified within 10 days.

Official source:

`https://legislatie.just.ro/public/DetaliiDocument/280106`

## 2. 2024 consultation draft is not treated as final law

ANCOM publicly consulted a draft decision on the information procedure for intermediary-service providers in 2024. The draft described, among other things, provider scope, a 45-day information path, email/My ANCOM mechanics and data fields.

That consultation text is useful discovery/evidence only. It is **not** treated as a final adopted procedure merely because it contains detailed proposed rules.

Official consultation source:

`https://www.ancom.ro/consultare/proiect-de-decizie-privind-procedura-de-informare-pentru-furnizorii-de-servicii-intermediare-o-noua-versiune-a-proiectului-de-decizie/`

## 3. ANCOM 2026 action-plan evidence says the procedure was still to be developed

ANCOM's official 2026 action-plan consultation states under digital services that the Authority would continue developing secondary legislation under Law 50/2024 and, for 2026, intended to develop the information procedure for intermediary-service providers together with the inspection framework.

That is strong evidence against silently promoting the 2024 consultation draft into a final current filing procedure.

Official source:

`https://www.ancom.ro/despre-noi/media/comunicate-de-presa/ancom-consulta-proiectul-planului-de-actiuni-pentru-anul-2026/`

## 4. My ANCOM communications framework has meanwhile evolved

The current consolidated Decision No. 333/2024 on communication through `My ANCOM` includes Romanian intermediary-service providers, as defined by Law 50/2024, among persons that may obtain beneficiary status under the service.

Decision No. 463/2025 amended Decision 333/2024 and its access/request mechanics. This supports the existence of an ANCOM electronic communications channel for the provider category, but it does **not** by itself prove that the separate Article 5 information procedure has been finally adopted in the form proposed in the 2024 consultation.

Official sources:

- current Decision 333/2024: `https://legislatie.just.ro/Public/DetaliiDocument/285331`
- Decision 463/2025: `https://legislatie.just.ro/Public/DetaliiDocument/301520?isFormaDeBaza=True&rep=True`

## 5. DROPi product consequence

The product/legal evidence model may safely represent:

```text
DsaAuthorityEvidence {
  providerLegalEntityId
  dsaClassificationDecisionRef
  article5Applies
  serviceStartDate
  statutoryInformationDeadlineAt?
  officialProcedureState
  procedureVersionRef?
  ancomSubmissionEvidenceRef?
  myAncomAccountRef?
  submittedAt?
  dataChangeNotificationEvidenceRef?
  reviewDueAt
  approvalState
}
```

But until a final current ANCOM procedure is identified and captured:

```text
officialProcedureState = PENDING_FINAL_PROCEDURE_CONFIRMATION
approvalState = HOLD_AUTHORITY_PROCEDURE
```

No production filing form, field list, email address or submission sequence is hard-coded from the consultation draft.

## 6. Current blocker disposition

`GAP-RO-DSA-SCOPE` remains open for factual DSA classification and enterprise-size/applicability review.

A separate procedural sub-blocker remains:

`ANCOM_ART5_PROCEDURE_FINAL_COPY_NOT_CONFIRMED`

This blocker does not mean the Article 5 statutory obligation can be ignored. It means the application and launch packet must re-check the competent ANCOM procedure immediately before filing/service start rather than pretending the 2024 proposal is final.
