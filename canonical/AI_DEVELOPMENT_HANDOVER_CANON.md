# DROPi — AI Development Handover Canon

> **STATUS: CANONIC — NU SE ȘTERGE NICIODATĂ**
> Acest document fixează regulile de colaborare dintre fondator, echipa umană și agenții AI pentru dezvoltarea pe termen lung a proiectului DROPi.
> Repository-ul rămâne sursa de adevăr pentru implementare; acest document rămâne sursa de adevăr pentru viziune, guvernanță și direcție strategică.

---

## 1. Purpose

Acest document transferă și conservă viziunea strategică despre cum trebuie continuat proiectul DROPi fără restart și fără pierderea contextului istoric.

Obiectivul este să asigure:
- continuitate tehnică,
- continuitate arhitecturală,
- cooperare sănătoasă om + AI,
- dezvoltare sustenabilă pe termen lung.

---

## 2. Source of Truth Model

1. **Repository-ul** este sursa de adevăr pentru:
   - implementare,
   - structura modulelor,
   - contracte API,
   - migrații și date,
   - starea reală a codului.
2. **Handover-ul canonic** este sursa de adevăr pentru:
   - direcție strategică,
   - filozofie operațională,
   - reguli de decizie,
   - criterii de guvernanță AI.
3. Când apare conflict:
   - implementarea imediată urmează repository-ul,
   - conflictul se documentează,
   - documentele canonice se actualizează prin procesul de versiune.

---

## 3. Current Situation (Continuity Rule)

- Proiectul DROPi există deja.
- Aplicația este parțial implementată.
- Componente importante au fost livrate anterior cu suport Manus AI.
- Direcția fondatorului este înlocuirea graduală a Manus cu o organizație AI internă.

**Regulă non-negociabilă:** acesta este un proces de **continuare**, nu de restart.

---

## 4. Mission for Any AI Agent Working on DROPi

1. Nu reconstrui proiectul de la zero.
2. Nu redesena arhitectura din presupuneri.
3. Începe prin înțelegere și audit.
4. Continuă ce există deja.
5. Respectă deciziile anterioare, cu excepția cazurilor unde există justificare tehnică puternică.

---

## 5. Long-Term Vision

DROPi nu este doar o aplicație. DROPi este construit ca o **organizație digitală asistată de AI**.

Platforma software este un strat operațional dintr-un sistem mai mare:
- operațional,
- logistic,
- financiar,
- compliance,
- suport,
- analiză și decizie asistată.

---

## 6. AI Organization Target Model

Fondatorul vizează aproximativ **29 de agenți AI specializați**, fiecare mapat pe un rol real de companie.

Fiecare agent trebuie să aibă:
- misiune,
- responsabilități clare,
- limite de autoritate,
- KPI-uri,
- reguli de comunicare,
- memorie operațională,
- raportare periodică,
- proces de îmbunătățire continuă.

---

## 7. Human Authority and Safety Boundaries

AI asistă și execută, dar nu elimină rolul uman.

Reguli:
1. Deciziile safety-critical rămân sub autoritate umană.
2. Dacă documentația canonică cere aprobare umană, regula nu poate fi ocolită.
3. AI poate:
   - analiza,
   - monitoriza,
   - optimiza,
   - recomanda,
   - detecta anomalii.
4. AI nu poate încălca fluxurile de aprobare umană.

---

## 8. Development Strategy (Mandatory Sequence)

Înainte de a scrie cod:
1. **Observe**
2. **Analyse**
3. **Map architecture**
4. **Read documentation**
5. **Identify existing modules**
6. **Plan**
7. **Explain**
8. **Implement**
9. **Test**
10. **Document**
11. **Commit**
12. **Repeat**

---

## 9. Repository Audit Before Major Implementation

Prima responsabilitate pentru orice task major este înțelegerea completă, nu codarea.

Auditul trebuie să acopere:
- arhitectură,
- module existente,
- tehnologii și dependințe,
- documentație canonică și operațională,
- lucru neterminat,
- datorie tehnică,
- riscuri de securitate și conformitate.

Implementările de amploare pornesc doar după finalizarea acestui audit.

---

## 10. Non-Duplication Rule

**Nu crea sisteme duplicate** dacă există funcționalitate echivalentă.

Înainte de orice modul nou:
1. Caută capabilitatea existentă.
2. Verifică extensibilitatea.
3. Refolosește arhitectura curentă.
4. Documentează de ce un modul nou este necesar dacă reutilizarea nu este posibilă.

---

## 11. Canonical Cooperation Rules (Added for Better Teamwork)

### 11.1 Documentation First
- Nicio schimbare semnificativă fără citirea documentelor canonice relevante.
- Orice idee/decizie nouă importantă se reflectă în documentație în aceeași rundă de lucru.

### 11.2 Explicit Decision Records
- Deciziile arhitecturale majore se consemnează cu:
  - context,
  - alternative respinse,
  - impact,
  - plan de rollback.

### 11.3 Definition of Done (DoD)
Un task este „done” doar dacă:
1. implementarea este completă,
2. testele relevante sunt rulate,
3. nu introduce vulnerabilități noi,
4. documentația este actualizată,
5. impactul asupra modulelor conectate este verificat.

### 11.4 Change Scope Discipline
- Schimbări mici, iterative, cu impact clar.
- Fără refactorizări largi necerute.
- Fără amestec de taskuri necorelate în același commit.

### 11.5 Traceability
- Fiecare livrare trebuie să poată fi urmărită la:
  - cerință,
  - fișiere modificate,
  - validări rulate,
  - rezultat observabil.

---

## 12. Initial Roadmap for AI Organization Integration

### Faza 1 — Foundations
- inventar complet al rolurilor AI existente vs. țintă,
- mapare responsabilități pe C1/C2/C3/Admin,
- definire contract minim per agent (mission, authority, KPI, reports).

### Faza 2 — Governance Layer
- standard de identitate pentru agent,
- standard de permisiuni/RBAC per agent,
- format unificat de raport operațional.

### Faza 3 — Operational Embedding
- integrare în fluxuri reale (support, marketplace, ops, audit),
- monitorizare performanță și anomalii,
- feedback loop pentru optimizare continuă.

### Faza 4 — Human-AI Transition
- reguli explicite de predare AI → om pe roluri,
- manuale de onboarding generate cu suport AI,
- metrici de calitate pentru colaborarea mixtă.

### Faza 5 — Long-Term Sustainability
- audituri periodice de arhitectură,
- control de datorie tehnică,
- revizuiri trimestriale de model operațional AI.

---

## 13. Founder Objective (Priority Order)

1. Sustenabilitate pe termen lung
2. Calitate
3. Coerență arhitecturală
4. Viteză de livrare

**Principiu:** quality over quantity; architecture over quick fixes.

---

## 14. Versioning

Acest document: **v1.0.0**  
Data: 3 Iulie 2026  
Bază: Handover strategic furnizat de fondator + consolidare canonică în repository.

---

> **REAMINTIRE: Document canonic.**
> Se actualizează prin versioning, cu trasabilitate clară, fără a pierde direcția strategică pe termen lung.
