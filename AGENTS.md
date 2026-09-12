# DROPi — AGENTS

Acest document definește regulile operaționale pentru agenții AI care lucrează în repository.

## 1. Reguli obligatorii

1. Citește **prima dată**, în această ordine:
   - `canonical/CURRENT_STATE.md` — checkpoint-ul operațional curent;
   - `canonical/AI_DEVELOPMENT_HANDOVER_CANON.md` — viziune și guvernanță;
   - `canonical/DELIVERY_MULTIMODAL.md` și canonul de domeniu relevant;
   - `canonical/SESSION_HANDOVER.md` — continuitate istorică; dacă timestamp-ul/branch-ul său vechi intră în conflict cu repository-ul actual și `CURRENT_STATE.md`, nu îl trata ca stare curentă.
2. Respectă fluxul canonic pentru taskuri mari:
   - Observe → Analyse → Plan → Implement → Test → Document
3. Repository-ul este sursa de adevăr pentru implementare.
4. Orice decizie nouă se documentează.
5. La finalul unei sesiuni substanțiale, actualizează `canonical/CURRENT_STATE.md` când starea high-level se schimbă și păstrează continuitatea documentară fără a șterge istoria.

## 2. Reguli de implementare

- Modificări mici, precise, fără schimbări nelegate de task.
- Fără ștergeri de documente canonice fără aprobare explicită.
- Fără introducere de secrete în cod/documentație.
- Validare după schimbări (conform naturii schimbărilor).
- Fără sisteme duplicate când există deja o autoritate/capabilitate echivalentă.
- UI/scaffold/prototype nu se declară LIVE/IMPLEMENTED dacă backend-ul autoritativ lipsește.

## 3. Reguli de continuitate între agenți

- Noul agent continuă de la `canonical/CURRENT_STATE.md` și de la issue/PR-urile active din repository.
- Nu repornește proiectul de la zero.
- Păstrează deciziile deja asumate în documentele canonice, cu excepția conflictelor demonstrate și reconciliate explicit.
- Nu amestecă status, cod, issue-uri, design sau acceptare din proiecte sibling/nelegate fără comandă explicită a Project Owner-ului.

## 4. Surse canonice

- `canonical/CURRENT_STATE.md`
- `canonical/AI_DEVELOPMENT_HANDOVER_CANON.md`
- `canonical/SESSION_HANDOVER.md` (istoric + continuitate; nu suprascrie checkpoint-ul curent)
- `canonical/AI_AGENT_SYSTEM.md`
- `canonical/DELIVERY_MULTIMODAL.md`

## 5. Model de reconciliere

Când canonul și implementarea diferă:

1. verifică mai întâi dacă diferența este reală și actuală;
2. nu presupune că un ecran înseamnă capabilitate completă;
3. dacă logica implementată este demonstrabil mai evoluată și compatibilă cu principiile canonice, documentează conflictul și actualizează canonul/roadmap-ul prin proces controlat;
4. dacă implementarea este incompletă, mock sau contrazice canonul, păstrează canonul și materializează/rezolvă gap-ul;
5. nu transforma automat code presence în `completed` și nu transforma lipsa acceptării live în lipsă de source implementation.
