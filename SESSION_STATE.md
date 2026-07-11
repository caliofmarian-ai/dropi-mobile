# DROPi — Session State

Documentul oficial pentru stare de sesiune este:

- `canonical/SESSION_HANDOVER.md`

Acest fișier există pentru compatibilitate cu nomenclatura solicitată și delegă complet starea către documentul canonic.

## Stare curentă (snapshot)

- Milestone activ: **M2 — Replace mock data (faza 1 livrată)**
- Ultima schimbare majoră: ecranele operaționale C1 (`index`, `history`, `order`, `merchant-order`, `mission`) folosesc acum date reale prin `trpc.operations.*`.
- Următorul pas: M2 faza 2 (eliminare hardcoded demo metrics/UI rămase + aliniere tracking docs).

## Reguli

1. La începutul sesiunii se citește `canonical/SESSION_HANDOVER.md`.
2. La finalul sesiunii se actualizează `canonical/SESSION_HANDOVER.md`.
3. „Pasul Următor Concret” din handover este punctul de reluare.
