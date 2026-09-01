# Marketplace Controls Certification — BATCH-007

## Scope

This certification covers:

- IMPL-017 / #174 — category eligibility and listing controls.
- IMPL-018 / #175 — zone-scoped visibility and availability.

## Governed behavior

- Marketplace categories are resolved through one shared policy surface instead of independent UI/server vocabularies.
- Unknown categories are not eligible for publication and produce a critical moderation violation.
- Critical moderation violations cannot be bypassed by manual admin approval.
- Store and product public discovery is limited to active, requested-zone content.
- Product zone is inherited from the owning store and cannot be independently supplied by the merchant listing form.
- Moving a store into another zone forces previously approved listings back to `pending_review` and inactive status before they can become visible there.
- Public product discovery suppresses inactive, unapproved, uncontrolled-category, out-of-stock, wrong-zone, or suspended-store content.
- Public product detail is separated from the merchant owner view so drafts and rejected products are not exposed through the public endpoint.
- Checkout preparation requires an explicit Marketplace zone and revalidates listing visibility before creating an order.
- No synthetic list of service cities or Zone 0 boundaries is introduced because the repository does not yet contain an authoritative geographic service-zone registry. This implementation establishes the strict zone-scoping contract that such a registry can govern later.

## Verification

The controlled materialization run certified:

- Marketplace policy tests.
- Marketplace integration/source-contract tests.
- Order-management regressions.
- State-push notification regressions.
- Live-tracking security regressions.
- Operational-safety regressions.
- Repository-wide TypeScript check.
- Whitespace validation.

A permanent pull-request gate is retained at `.github/workflows/validate-marketplace-controls-pr.yml`.
