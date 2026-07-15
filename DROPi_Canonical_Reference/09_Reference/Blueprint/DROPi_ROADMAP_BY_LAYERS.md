# DROPi — Roadmap de Implementare Structurat pe Straturi Canonice

> **Versiune:** 2.0 — 27 Iunie 2026  
> **Structură:** Organizat conform celor 6 Straturi ale Arhitecturii Platformei  
> **Surse:** SYSTEM_ARCHITECTURE.md, Cap_03, Cap_06, AI_AGENT_SYSTEM.md, DELIVERY_MULTIMODAL.md  
> **Autor:** Manus AI pentru fondatorul DROPi

---

## Principiul Fundamental

> **Livrarea nu pornește decât atunci când cererea, capacitatea și riscul sunt validate explicit.**

Acest roadmap urmează ordinea naturală de implementare dictată de arhitectura canonică:

```
L2 (APPLICATION CORE — fundația)
  → L6 (AUDIT CORE — activ din prima zi)
    → L4 (LOGIC CORE — AI/DSS)
      → L3 (PHYSICAL CORE — DronePort)
        → L5 (OPERATIONAL CORE — execuție reală)
          → L1 (PUBLIC FRONT — website, ultimul)
```

---

## Starea Actuală (Ce Avem)

Aplicația mobilă DROPi există ca scaffold funcțional cu:

| Element | Status | Detalii |
|---------|--------|---------|
| 29 Dashboard-uri | ✅ UI complet | Toate rolurile au ecran dedicat |
| Marketplace UI | ✅ Funcțional local | Produse, categorii, checkout (date locale) |
| Navigare RBAC | ✅ Implementat | 4 canale × roluri, tab bar dinamic |
| DronePort modul | ✅ UI de bază | Hartă, locații, status vizual |
| Pilot dashboard | ✅ UI complet | Misiuni, STOP/FALLBACK, tracking simulat |
| Eligibility badges | ✅ Vizual | Drone/Van/E-bike badges pe produse |
| Autentificare | ❌ Doar mock | Nu persistă, nu validează real |
| Persistență date | ❌ Doar AsyncStorage local | Fără sync cross-device |
| AI Agents | ❌ Doar documentat | Canonical definit, neimplementat |
| Audit real | ❌ Parțial | Tabelă există, logare incompletă |

---

## STRATUL 2: APPLICATION CORE — Fundația

**Prioritate:** CRITICĂ — Fără acest strat funcțional, nimic altceva nu are sens.

Application Core este nucleul digital al DROPi: autentificare, roluri, comenzi, validare, orchestrare. Totul trece prin acest strat.

---

### Faza 2.1 — Autentificare Reală și Gestiune Conturi

**Dependențe:** Niciuna (punct de start)  
**Rezultat:** Utilizatorii pot crea cont, se autentifica, și accesa dashboard-ul corespunzător rolului lor.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.1.1 | Implementare OAuth flow complet (server-side) cu JWT + refresh tokens | Medie |
| 2.1.2 | Ecran Login/Register cu validare email + parolă | Medie |
| 2.1.3 | Password recovery via link email (Google Mail, conform preferințe) | Medie |
| 2.1.4 | Persistență sesiune cu SecureStore (token storage) | Ușoară |
| 2.1.5 | Middleware RBAC pe server — verificare rol la fiecare request | Medie |
| 2.1.6 | Creare conturi test pentru fiecare din cele 29 roluri | Ușoară |
| 2.1.7 | Creare conturi AI agent echivalente (pereche uman ↔ AI per rol) | Medie |
| 2.1.8 | Admin: funcționalitate "phantom mode" — login în orice cont fără credențiale | Complexă |
| 2.1.9 | Admin: listă conturi test cu buton login direct | Ușoară |

**Reguli canonice respectate:**
- Fiecare cont uman are un echivalent AI agent [1]
- Permisiunile sunt identice pentru conturi umane și AI [2]
- Administratorul poate intra în phantom mode în orice cont [3]
- Recovery doar via email, nu link pe pagină [4]

---

### Faza 2.2 — Persistență Date și Sincronizare

**Dependențe:** Faza 2.1 (auth funcțional)  
**Rezultat:** Datele persistă în baza de date, sincronizare cross-device funcțională.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.2.1 | Schema DB completă: users, roles, orders, deliveries, products, merchants | Complexă |
| 2.2.2 | Migrații Drizzle ORM pentru toate tabelele | Medie |
| 2.2.3 | tRPC routers: CRUD complet pentru orders, products, deliveries | Complexă |
| 2.2.4 | Înlocuire date mock cu date reale din DB pe toate ecranele | Complexă |
| 2.2.5 | Offline-first: AsyncStorage cache + sync la reconectare | Complexă |
| 2.2.6 | Seed data: produse, comercianți, comenzi demo (marcate [SIMULATED]) | Medie |
| 2.2.7 | TanStack Query integration pentru cache + invalidation | Medie |

**Reguli canonice respectate:**
- Toate datele simulate marcate cu prefix `[SIMULATED]` [5]
- Separare date pe canale (C1/C2/C3/Admin) — nu se amestecă [6]

---

### Faza 2.3 — Order Management (Ciclul de Viață al Comenzilor)

**Dependențe:** Faza 2.2 (DB funcțional)  
**Rezultat:** O comandă parcurge complet ciclul: INITIATED → VALIDATED → PREPARING → READY → ACCEPTED → IN_EXECUTION → COMPLETED.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.3.1 | State machine pentru ordere: definire tranziții permise per stare | Medie |
| 2.3.2 | Validare la tranziție: cine poate muta din stare X în stare Y (RBAC) | Medie |
| 2.3.3 | Customer flow: plasare comandă → validare → confirmare | Medie |
| 2.3.4 | Merchant flow: primire comandă → pregătire → marcare READY | Medie |
| 2.3.5 | Pilot flow: vizualizare comenzi disponibile → acceptare → execuție | Medie |
| 2.3.6 | Notificări la fiecare tranziție de stare (push notifications) | Complexă |
| 2.3.7 | Regula canonică: livrarea pornește DOAR la READY, nu înainte | Ușoară |

**Reguli canonice respectate:**
- Livrarea nu pornește decât la starea READY [7]
- Pilotul acceptă voluntar (self-employed, nu comandat) [8]
- Fiecare tranziție generează audit log [9]

---

### Faza 2.4 — Marketplace Controlat (C1)

**Dependențe:** Faza 2.3 (order management)  
**Rezultat:** Marketplace-ul funcționează end-to-end cu reguli de control.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.4.1 | Sistem categorii cu reguli de eligibilitate per categorie | Medie |
| 2.4.2 | Zonare by design: produse vizibile doar în zona relevantă | Complexă |
| 2.4.3 | Control la postare: validare listări (categorii permise, restricții) | Medie |
| 2.4.4 | Merchant dashboard complet: catalog, comenzi, statistici | Medie |
| 2.4.5 | Customer dashboard: istoric comenzi, tracking, recenzii | Medie |
| 2.4.6 | Separare B2C / Artizani / Food Vendors conform Cap. 6 | Medie |
| 2.4.7 | Pricing transparent conform regulilor canonice | Ușoară |
| 2.4.8 | Reputation & Ranking System (conform document canonic) | Complexă |

**Reguli canonice respectate:**
- Marketplace controlat, nu deschis nefiltrat [10]
- Publicarea listării NU garantează livrarea [11]
- Eligibilitatea drone este stabilită exclusiv de platformă [12]
- Zonare influențează vizibilitate, disponibilitate, eligibilitate [13]

---

### Faza 2.5 — COS (Controlled Operations System — C2)

**Dependențe:** Faza 2.4 (marketplace funcțional ca referință)  
**Rezultat:** Canalul C2 operează separat cu control complet.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.5.1 | COS Modul 1: entitate folosește canal COS, piloți DROPi execută | Complexă |
| 2.5.2 | COS Modul 2: entitate cu flotă proprie, DROPi = orchestrare logică | Complexă |
| 2.5.3 | Contract management: definire termeni, SLA, reguli per entitate | Medie |
| 2.5.4 | Separare completă date C2 față de C1 (date, loguri, acces) | Medie |
| 2.5.5 | Operations Manager dashboard (C2) | Medie |
| 2.5.6 | Fleet Manager dashboard (C2) — control flotă dedicată | Medie |
| 2.5.7 | Audit separat pe entitate (loguri izolate per contract) | Medie |
| 2.5.8 | Confidențialitate ridicată: date COS invizibile din marketplace | Ușoară |

**Reguli canonice respectate:**
- COS este despre CONTROL operațional, nu urgență [14]
- DROPi orchestrează, NU comandă personalul entităților terțe [15]
- Separare completă date/loguri/acces între canale [16]

---

### Faza 2.6 — EOC (Emergency Operations Channel — C3)

**Dependențe:** Faza 2.5 (COS implementat)  
**Rezultat:** Canalul de urgență funcționează cu reguli speciale.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.6.1 | Emergency Coordinator dashboard — activare scenarii speciale | Complexă |
| 2.6.2 | Dispatch Manager — alocare resurse în urgență | Medie |
| 2.6.3 | Resource Allocator — redistribuire dinamică | Medie |
| 2.6.4 | Communication Officer — notificări broadcast | Medie |
| 2.6.5 | Incident Commander — control complet pe incident | Complexă |
| 2.6.6 | Reguli de activare EOC (cine, când, cum) | Medie |
| 2.6.7 | Separare date C3 (cel mai strict nivel de confidențialitate) | Medie |

**Reguli canonice respectate:**
- EOC este un canal (transportă solicitări speciale), nu un sistem [17]
- Siguranța rămâne prioritatea absolută [18]
- Activare conform Cap. 12 și PB-07 [19]

---

### Faza 2.7 — Admin Operations (Canal Admin)

**Dependențe:** Fazele 2.4-2.6 (toate canalele operaționale)  
**Rezultat:** Administratorii au control complet asupra platformei.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.7.1 | System Administrator dashboard — gestiune sistem | Medie |
| 2.7.2 | Security Officer dashboard — monitorizare securitate | Medie |
| 2.7.3 | Configuration Manager — setări platformă | Medie |
| 2.7.4 | Analytics Manager — rapoarte cross-canal | Complexă |
| 2.7.5 | Support Coordinator — gestiune tickete suport | Medie |
| 2.7.6 | Phantom mode funcțional pe toate conturile | Complexă |
| 2.7.7 | User management: creare, blocare, ștergere, audit | Medie |

---

### Faza 2.8 — Plăți și Fluxuri Financiare

**Dependențe:** Faza 2.4 (marketplace cu comenzi reale)  
**Rezultat:** Plățile funcționează end-to-end.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.8.1 | Integrare payment gateway (Stripe/PayPal) | Complexă |
| 2.8.2 | Separarea fluxurilor monetare (DROPi fee vs merchant revenue) | Medie |
| 2.8.3 | Politici de anulare fixe (conform reguli canonice) | Medie |
| 2.8.4 | Marketplace Financial Flow (conform document canonic) | Complexă |
| 2.8.5 | Pilot payment: calcul compensație per livrare | Medie |
| 2.8.6 | Refund flow complet | Medie |

**Reguli canonice respectate:**
- DROPi monetizează logistica, nu produsul [20]
- Două modele financiare acceptate [21]
- Audit complet pe fluxuri financiare [22]

---

### Faza 2.9 — Real-Time și Notificări

**Dependențe:** Faza 2.3 (order management)  
**Rezultat:** Actualizări în timp real pe toate ecranele relevante.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 2.9.1 | WebSocket server pentru actualizări live | Complexă |
| 2.9.2 | Push notifications (expo-notifications) | Medie |
| 2.9.3 | Live tracking pe hartă (poziție pilot/dronă) | Complexă |
| 2.9.4 | Notificări la tranziții de stare (order status changes) | Medie |
| 2.9.5 | Chat/messaging între actori (customer ↔ support) | Complexă |

---

## STRATUL 6: AUDIT CORE — Activ din Prima Zi

**Prioritate:** ÎNALTĂ — Conform principiului canonic, orice acțiune trebuie logată și auditabilă.

Audit Core nu este un "feature" opțional — este o cerință fundamentală a platformei. Trebuie activat în paralel cu Layer 2, nu după.

---

### Faza 6.1 — Sistem de Logare Complet

**Dependențe:** Faza 2.1 (auth — trebuie să știm CINE face acțiunea)  
**Rezultat:** Orice acțiune din platformă generează un audit log.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 6.1.1 | Middleware audit: interceptare automată a tuturor acțiunilor tRPC | Medie |
| 6.1.2 | Action logs: cine a făcut ce, când, de pe ce device | Medie |
| 6.1.3 | Decision logs: ce s-a decis și de ce (tranziții de stare) | Medie |
| 6.1.4 | Access logs: cine a accesat ce date | Medie |
| 6.1.5 | Marcare distinctă acțiuni AI vs uman (prefix "AI personal") | Ușoară |
| 6.1.6 | Marcare distinctă phantom mode vs acțiune reală | Ușoară |
| 6.1.7 | Loguri separate pe canal (C1/C2/C3/Admin nu se amestecă) | Medie |

**Reguli canonice respectate:**
- Toate acțiunile platformei trebuie logate și auditabile [23]
- Loguri AI marcate distinct de loguri umane [24]
- Phantom mode logat separat de acțiunile utilizatorului real [25]
- Audit tehnic, informațional, orientat spre trasabilitate [26]

---

### Faza 6.2 — GDPR și Conformitate

**Dependențe:** Faza 6.1 (logare funcțională)  
**Rezultat:** Platforma respectă GDPR și poate genera rapoarte de conformitate.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 6.2.1 | Export date personale (dreptul la acces) | Medie |
| 6.2.2 | Ștergere cont și date asociate (dreptul la ștergere) | Complexă |
| 6.2.3 | Consent management (ce date colectăm, de ce) | Medie |
| 6.2.4 | Data retention policies (cât timp păstrăm datele) | Medie |
| 6.2.5 | Authority reports template (EASA, FAA, CAAP) | Medie |
| 6.2.6 | Audit Manager dashboard — vizualizare loguri, filtrare, export | Complexă |

---

### Faza 6.3 — Trasabilitate Operațională

**Dependențe:** Faza 2.3 (order management) + Faza 6.1  
**Rezultat:** Orice eveniment operațional poate fi reconstituit factual.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 6.3.1 | Flight logs: traiectorie, viteză, altitudine, evenimente | Complexă |
| 6.3.2 | Delivery logs: pickup, transfer, delivery, fallback | Medie |
| 6.3.3 | Incident logs: STOP activat, de cine, de ce, consecințe | Medie |
| 6.3.4 | Reconstrucție factuală: timeline vizuală per eveniment | Complexă |
| 6.3.5 | Export rapoarte per incident pentru autorități | Medie |

---

## STRATUL 4: LOGIC CORE — AI/DSS (Decision Support System)

**Prioritate:** ÎNALTĂ — Agenții AI sunt atât testerii platformei cât și ghizii utilizatorilor.

Logic Core implementează sistemul de 29 agenți AI care operează în două moduri: AUTONOM (testare/simulare) și ASISTENT (ghidare utilizator uman).

---

### Faza 4.1 — Framework Agent AI

**Dependențe:** Faza 2.2 (DB) + Faza 6.1 (audit — agenții trebuie logați)  
**Rezultat:** Infrastructura pentru rulare agenți AI este funcțională.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 4.1.1 | Agent base class: lifecycle, state, permissions, logging | Complexă |
| 4.1.2 | Agent registry: definire și configurare cele 29 tipuri | Medie |
| 4.1.3 | Execution engine: scheduler, queue, concurrency control | Complexă |
| 4.1.4 | Modul AUTONOM: agent execută acțiuni independent (simulare) | Complexă |
| 4.1.5 | Modul ASISTENT: agent sugerează, omul decide | Medie |
| 4.1.6 | Tranziție AUTONOM → ASISTENT când un uman preia rolul | Medie |
| 4.1.7 | Logare completă: fiecare acțiune AI marcată cu tip agent + entitate | Medie |
| 4.1.8 | Integrare LLM server-side (built-in, fără API key extern) | Medie |

**Reguli canonice respectate:**
- DSS NU ia decizii finale, NU comandă execuția [27]
- Fiecare cont uman are echivalent AI agent [28]
- AI agent trece în mod ASISTENT când omul preia [29]
- Acțiuni AI marcate distinct [30]

---

### Faza 4.2 — Agenți C1 Marketplace (9 agenți)

**Dependențe:** Faza 4.1 (framework) + Faza 2.4 (marketplace funcțional)  
**Rezultat:** Cei 9 agenți C1 operează autonom, testând marketplace-ul.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 4.2.1 | Customer Agent — plasează comenzi, testează checkout flow | Medie |
| 4.2.2 | Merchant Agent — listează produse, procesează comenzi | Medie |
| 4.2.3 | Delivery Partner Agent — acceptă/refuză misiuni, execută livrări | Medie |
| 4.2.4 | Support Agent — răspunde la tickete, rezolvă probleme | Medie |
| 4.2.5 | Analyst Agent — generează rapoarte, identifică pattern-uri | Medie |
| 4.2.6 | Compliance Officer Agent — verifică conformitate listări | Medie |
| 4.2.7 | Fraud Detection Agent — detectează anomalii, semnalează | Complexă |
| 4.2.8 | Performance Monitor Agent — monitorizează KPI-uri | Medie |
| 4.2.9 | Incident Responder Agent — reacționează la incidente | Medie |

---

### Faza 4.3 — Agenți C2 COS (8 agenți)

**Dependențe:** Faza 4.1 + Faza 2.5 (COS funcțional)  
**Rezultat:** Cei 8 agenți C2 testează operațiunile controlate.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 4.3.1 | Operations Manager Agent — coordonează operațiuni COS | Medie |
| 4.3.2 | Logistics Coordinator Agent — planifică rute, alocă resurse | Medie |
| 4.3.3 | Fleet Manager Agent — monitorizează flotă, mentenanță | Medie |
| 4.3.4 | Compliance Officer Agent (C2) — audit contracte, SLA | Medie |
| 4.3.5 | Performance Monitor Agent (C2) — KPI-uri operaționale | Medie |
| 4.3.6 | Incident Responder Agent (C2) — gestionare incidente | Medie |
| 4.3.7 | Data Analyst Agent (C2) — analiză date operaționale | Medie |
| 4.3.8 | Quality Assurance Agent — verificare calitate livrări | Medie |

---

### Faza 4.4 — Agenți C3 EOC (6 agenți)

**Dependențe:** Faza 4.1 + Faza 2.6 (EOC funcțional)  
**Rezultat:** Cei 6 agenți C3 simulează scenarii de urgență.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 4.4.1 | Emergency Coordinator Agent — activare scenarii, coordonare | Complexă |
| 4.4.2 | Dispatch Manager Agent — alocare misiuni urgente | Medie |
| 4.4.3 | Resource Allocator Agent — redistribuire resurse | Medie |
| 4.4.4 | Communication Officer Agent — broadcast notificări | Medie |
| 4.4.5 | Data Analyst Agent (C3) — analiză post-incident | Medie |
| 4.4.6 | Incident Commander Agent — control complet pe incident | Complexă |

---

### Faza 4.5 — Agenți Admin (6 agenți) + Support (5 agenți)

**Dependențe:** Faza 4.1 + Faza 2.7 (admin funcțional)  
**Rezultat:** Agenții admin și support operează autonom.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 4.5.1 | System Administrator Agent — monitorizare sistem | Medie |
| 4.5.2 | Security Officer Agent — detectare amenințări | Complexă |
| 4.5.3 | Audit Manager Agent — verificare completitudine loguri | Medie |
| 4.5.4 | Configuration Manager Agent — validare configurații | Medie |
| 4.5.5 | Analytics Manager Agent — generare rapoarte | Medie |
| 4.5.6 | Support Coordinator Agent — coordonare echipă suport | Medie |
| 4.5.7 | Triage Agent — categorisire și prioritizare tickete | Medie |
| 4.5.8 | Resolution Agent — rezolvare automată probleme simple | Medie |
| 4.5.9 | Escalation Agent — escaladare probleme critice | Medie |
| 4.5.10 | Analysis Agent — analiză pattern-uri probleme | Medie |
| 4.5.11 | Coordination Agent — coordonare inter-echipe | Medie |

---

### Faza 4.6 — Simulare 1 Lună și Detecție Bug-uri

**Dependențe:** Fazele 4.2-4.5 (toți agenții implementați)  
**Rezultat:** Simulare completă de 1 lună, bug-uri identificate și raportate.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 4.6.1 | Orchestrator simulare: scheduler zilnic, scenarii variate | Complexă |
| 4.6.2 | Scenarii zilnice: volum normal, peak, incidente, urgențe | Complexă |
| 4.6.3 | Detecție automată bug-uri: flow-uri incomplete, erori, blocaje | Complexă |
| 4.6.4 | Raportare automată: issue tracking, severity, reproducibility | Medie |
| 4.6.5 | Metrici colectate: success rate, response time, error rate | Medie |
| 4.6.6 | Dashboard simulare: progres, rezultate, bug-uri găsite | Medie |

---

### Faza 4.7 — Eligibility Engine și Route Optimization

**Dependențe:** Faza 4.1 + Faza 2.4  
**Rezultat:** Sistemul decide automat ce mod de livrare e disponibil.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 4.7.1 | Eligibility engine: reguli per categorie, greutate, distanță, vreme | Complexă |
| 4.7.2 | Route optimization: calcul rute optime (sugestii, nu comenzi) | Complexă |
| 4.7.3 | Risk evaluation: scoring per livrare (meteo, trafic, capacitate) | Medie |
| 4.7.4 | Anomaly detection: pattern-uri suspecte în comenzi/livrări | Complexă |
| 4.7.5 | Pre-orchestrare zonală: evaluare capacitate înainte de promisiune | Complexă |

**Reguli canonice respectate:**
- Eligibilitatea drone stabilită exclusiv de platformă [31]
- Pre-orchestrare: cererea observată, capacitatea evaluată, fără promisiuni premature [32]
- DSS propune, nu decide [33]

---

## STRATUL 3: PHYSICAL CORE — DronePort

**Prioritate:** MEDIE-ÎNALTĂ — Depinde de L2 și L4 funcționale.

Physical Core reprezintă infrastructura fizică digitalizată: DronePort-uri, puncte de transfer, management baterii, fallback logistic.

---

### Faza 3.1 — DronePort Management Digital

**Dependențe:** Faza 2.2 (DB) + Faza 4.1 (AI framework pentru monitorizare)  
**Rezultat:** DronePort-urile sunt gestionate digital cu status real-time.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 3.1.1 | Schema DB: droneports, capacities, schedules, transfers | Medie |
| 3.1.2 | CRUD DronePort: creare, configurare, activare/dezactivare | Medie |
| 3.1.3 | Capacitate live: câte drone/pachete pot fi gestionate simultan | Medie |
| 3.1.4 | Scheduling: programare transfer-uri, slot-uri disponibile | Complexă |
| 3.1.5 | Hartă interactivă: toate DronePort-urile cu status live | Medie |
| 3.1.6 | Reguli de acces: cine poate folosi ce DronePort, când | Medie |

---

### Faza 3.2 — Transfer Multimodal

**Dependențe:** Faza 3.1 + Faza 2.3 (order management)  
**Rezultat:** Pachetele pot fi transferate între moduri de transport prin DronePort.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 3.2.1 | Flow transfer: drone → DronePort → van (și invers) | Complexă |
| 3.2.2 | Tracking pachet prin transfer (nu se pierde vizibilitatea) | Medie |
| 3.2.3 | Pilot transfer: schimbare pilot pe rute lungi | Medie |
| 3.2.4 | Buffer management: pachete în așteptare la DronePort | Medie |
| 3.2.5 | Fallback automat: dacă drona nu poate, redirecționare terestră | Complexă |

**Reguli canonice respectate:**
- DronePort = punct de transfer multimodal, nu centru de comandă [34]
- Fallback este parte din design, nu excepție [35]
- Livrare etapizată reduce presiunea [36]

---

### Faza 3.3 — Battery Management

**Dependențe:** Faza 3.1  
**Rezultat:** Sistemul gestionează bateriile dronelor (schimb, încărcare, status).

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 3.3.1 | Schema DB: batteries, charge_cycles, swap_events | Medie |
| 3.3.2 | Status baterie per dronă: nivel, cicluri, sănătate | Medie |
| 3.3.3 | Swap scheduling: când și unde se schimbă bateria | Medie |
| 3.3.4 | Alertă baterie scăzută: notificare pilot + sugestie DronePort | Ușoară |
| 3.3.5 | Istoric complet per baterie (audit) | Ușoară |

---

### Faza 3.4 — Safety Points și Emergency Landing

**Dependențe:** Faza 3.1 + Faza 2.6 (EOC)  
**Rezultat:** Puncte de siguranță definite pentru aterizări de urgență.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 3.4.1 | Definire safety points pe hartă (coordonate, capacitate) | Medie |
| 3.4.2 | Integrare în route planning: rute trec pe lângă safety points | Medie |
| 3.4.3 | Emergency landing protocol: activare automată + notificare | Complexă |
| 3.4.4 | Recovery flow: ce se întâmplă după aterizare de urgență | Medie |

---

## STRATUL 5: OPERATIONAL CORE — Execuție Fizică Supervizată

**Prioritate:** MEDIE — Depinde de L2, L3, L4 funcționale.

Operational Core este execuția propriu-zisă: zboruri, livrări terestre, intervenții umane, STOP/FALLBACK. Pornește DOAR la starea READY.

---

### Faza 5.1 — Delivery Execution Engine

**Dependențe:** Faza 2.3 (orders la READY) + Faza 3.2 (transfer multimodal) + Faza 4.7 (route optimization)  
**Rezultat:** Livrările se execută real cu tracking și control.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 5.1.1 | Pilot mission screen: pre-flight checklist, accept/decline | Medie |
| 5.1.2 | In-flight supervision: tracking live, telemetrie, status | Complexă |
| 5.1.3 | Delivery modes: drone, van, e-bike, combinat | Medie |
| 5.1.4 | Delivery multimodal conform document canonic (reguli stricte) | Complexă |
| 5.1.5 | Completion flow: confirmare livrare, proof of delivery | Medie |
| 5.1.6 | Failed delivery flow: ce se întâmplă dacă nu se poate livra | Medie |

**Reguli canonice respectate:**
- Drona NU așteaptă clientul [37]
- Drona NU negociază recepția [38]
- Drona NU repetă livrarea [39]
- Pilotul supervizează activ [40]

---

### Faza 5.2 — STOP și FALLBACK Mechanisms

**Dependențe:** Faza 5.1  
**Rezultat:** Mecanismele de siguranță funcționează în orice moment.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 5.2.1 | Buton STOP: oprire imediată misiune (disponibil permanent) | Medie |
| 5.2.2 | STOP triggers: cine poate activa (pilot, admin, system, C3) | Medie |
| 5.2.3 | Fallback automat: drone → terestru când condițiile se schimbă | Complexă |
| 5.2.4 | Fallback manual: pilot decide să schimbe modul | Medie |
| 5.2.5 | Post-STOP flow: ce se întâmplă cu pachetul, notificări | Medie |
| 5.2.6 | Override capability: admin poate suprascrie decizii AI | Medie |

---

### Faza 5.3 — GPS, Geofencing și Weather Integration

**Dependențe:** Faza 5.1  
**Rezultat:** Operațiunile folosesc date reale de locație și meteo.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 5.3.1 | GPS tracking real (expo-location) | Medie |
| 5.3.2 | Geofencing: zone permise/interzise pentru zbor | Complexă |
| 5.3.3 | Weather API integration: condiții meteo real-time | Medie |
| 5.3.4 | No-fly zones: restricții automate bazate pe locație | Medie |
| 5.3.5 | Altitude monitoring: respectare limite legale | Medie |

---

### Faza 5.4 — Fleet Management Real

**Dependențe:** Faza 5.1 + Faza 3.3 (battery management)  
**Rezultat:** Flota de drone/vehicule este gestionată complet.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 5.4.1 | Vehicle registry: drone, van-uri, e-bike-uri cu status | Medie |
| 5.4.2 | Maintenance scheduling: mentenanță preventivă | Medie |
| 5.4.3 | Availability tracking: ce vehicule sunt disponibile, unde | Medie |
| 5.4.4 | Performance metrics per vehicul | Medie |
| 5.4.5 | Fleet Manager dashboard complet cu acțiuni reale | Complexă |

---

## STRATUL 1: PUBLIC FRONT — Website (Ultimul)

**Prioritate:** SCĂZUTĂ (pentru aplicația mobilă) — Este un produs separat.

Public Front este website-ul de prezentare. Nu face parte din aplicația mobilă, dar este necesar pentru ecosistemul complet.

---

### Faza 1.1 — Website Marketing (Produs Separat)

**Dependențe:** Platformă funcțională (L2-L6 complete)  
**Rezultat:** Website public care prezintă DROPi și atrage utilizatori.

| Pas | Descriere | Complexitate |
|-----|-----------|-------------|
| 1.1.1 | Landing page — prezentare produs | Medie |
| 1.1.2 | How it works — explicație vizuală | Medie |
| 1.1.3 | For Customers / For Merchants / For Partners | Medie |
| 1.1.4 | Pricing (transparent, conform reguli canonice) | Ușoară |
| 1.1.5 | Blog / Resurse | Medie |
| 1.1.6 | Contact + FAQ | Ușoară |
| 1.1.7 | Terms & Privacy & GDPR | Medie |
| 1.1.8 | AI Support Agent public (alimentat cu documente publice) | Complexă |

**Reguli canonice respectate:**
- Website-ul NU expune canale private (COS, EOC) [41]
- Informează și filtrează, nu execută [42]
- AI agent public separat de AI consultant intern [43]

---

## MODULE TRANSVERSALE (Se Implementează în Paralel)

Aceste module nu aparțin unui singur strat — traversează mai multe straturi simultan.

---

### Modul T1 — Securitate (L2 + L6)

| Pas | Descriere | Strat |
|-----|-----------|-------|
| T1.1 | Encryption at rest (AES-256) | L6 |
| T1.2 | Encryption in transit (TLS 1.3) | L2 |
| T1.3 | Rate limiting pe API | L2 |
| T1.4 | Input sanitization | L2 |
| T1.5 | SQL injection prevention | L2 |
| T1.6 | XSS prevention | L2 |
| T1.7 | Secure key management | L6 |

---

### Modul T2 — Testare și QA (L4 + L6)

| Pas | Descriere | Strat |
|-----|-----------|-------|
| T2.1 | Unit tests pentru toate tRPC procedures | L2 |
| T2.2 | Integration tests pentru flows complete | L2+L5 |
| T2.3 | AI agent simulation (1 lună) ca E2E test | L4 |
| T2.4 | Performance testing (load, stress) | L2 |
| T2.5 | Security audit | L6 |
| T2.6 | qa-debugger validation (conform project instructions) | L6 |

---

### Modul T3 — Offline Support (L2)

| Pas | Descriere | Strat |
|-----|-----------|-------|
| T3.1 | AsyncStorage cache pentru date critice | L2 |
| T3.2 | Queue offline actions (sync la reconectare) | L2 |
| T3.3 | Conflict resolution (last-write-wins sau merge) | L2 |
| T3.4 | Indicator vizual offline/online | L2 |

---

### Modul T4 — Publicare și Deployment (L2 + L5)

| Pas | Descriere | Strat |
|-----|-----------|-------|
| T4.1 | Build APK via Manus Publish | L2 |
| T4.2 | Google Play internal testing track | L2 |
| T4.3 | Versioning system (fiecare patch = versiune distinctă) | L2 |
| T4.4 | Post-publish verification (funcționalitate, bug-uri) | L4+L6 |
| T4.5 | Cost minimal pe store (restricție acces public) | L2 |

**Reguli canonice respectate:**
- Fiecare versiune are identificator distinct [44]
- Post-publish: verificare funcționalitate, nu doar documentare [45]

---

## ORDINEA DE EXECUȚIE (Cronologică)

Fazele de mai sus se execută în această ordine, cu unele în paralel:

```
SPRINT 1-2:   Faza 2.1 (Auth) + Faza 6.1 (Audit — în paralel)
SPRINT 3-4:   Faza 2.2 (DB/Persistență) + Faza 6.1 continuare
SPRINT 5-6:   Faza 2.3 (Order Management) + Faza 6.3 (Trasabilitate)
SPRINT 7-8:   Faza 2.4 (Marketplace C1) + Faza 4.1 (AI Framework)
SPRINT 9-10:  Faza 2.5 (COS C2) + Faza 4.2 (Agenți C1)
SPRINT 11-12: Faza 2.6 (EOC C3) + Faza 4.3 (Agenți C2)
SPRINT 13-14: Faza 2.7 (Admin) + Faza 4.4-4.5 (Agenți C3+Admin+Support)
SPRINT 15-16: Faza 2.8 (Plăți) + Faza 2.9 (Real-time)
SPRINT 17-18: Faza 3.1-3.2 (DronePort + Transfer) + Faza 4.7 (Eligibility)
SPRINT 19-20: Faza 3.3-3.4 (Battery + Safety) + Faza 5.1 (Delivery Engine)
SPRINT 21-22: Faza 5.2-5.3 (STOP/Fallback + GPS/Weather)
SPRINT 23-24: Faza 5.4 (Fleet) + Faza 4.6 (Simulare 1 lună)
SPRINT 25-26: Faza 6.2 (GDPR) + Module T1-T4 (Securitate, QA, Offline, Publish)
SPRINT 27-28: Faza 1.1 (Website) — dacă se decide separat
```

---

## SUMAR CANTITATIV

| Categorie | Total Pași |
|-----------|-----------|
| L2: Application Core | 62 pași |
| L6: Audit Core | 18 pași |
| L4: Logic Core (AI/DSS) | 46 pași |
| L3: Physical Core (DronePort) | 19 pași |
| L5: Operational Core | 21 pași |
| L1: Public Front (Website) | 8 pași |
| Module Transversale | 17 pași |
| **TOTAL** | **191 pași** |

---

## REGULI DE LUCRU

1. **Audit din prima zi** — Orice feature implementat generează audit log automat
2. **AI marcaj distinct** — Acțiunile AI sunt întotdeauna identificabile
3. **Separare canale** — C1/C2/C3/Admin nu se amestecă niciodată
4. **DSS nu decide** — AI sugerează, omul/regulile decid
5. **READY before execution** — Nimic nu pornește prematur
6. **Fallback by design** — Nu este excepție, este parte din sistem
7. **[SIMULATED] prefix** — Toate datele de test sunt marcate
8. **qa-debugger validation** — Orice livrabil verificat înainte de publicare
9. **Documentație înainte de implementare** — Conform preferințele tale
10. **Verificare, nu presupuneri** — Testare reală, nu asumări

---

## Referințe Canonice

[1] AI_AGENT_SYSTEM.md — Fiecare cont uman are echivalent AI  
[2] AI_AGENT_SYSTEM.md — Permisiuni identice uman/AI  
[3] Knowledge base — Administrator phantom mode  
[4] Knowledge base — Recovery doar via email  
[5] SYSTEM_ARCHITECTURE.md — Data marking convention  
[6] Cap_06_Product.md §6.5.5 — Separare infrastructură pe canale  
[7] Cap_03_Solution_Overview.md §3.5 — Livrare pornește doar la READY  
[8] Cap_06_Product.md §6.1.4 — Pilot self-employed  
[9] Knowledge base — Toate acțiunile logate și auditabile  
[10] Cap_06_Product.md §6.3.0 — Marketplace controlat  
[11] Cap_06_Product.md §6.3.0 — Publicare NU garantează livrare  
[12] Cap_06_Product.md §6.3.0 — Eligibilitate drone exclusiv de platformă  
[13] Cap_06_Product.md §6.3.1 — Zonare influențează vizibilitate  
[14] Cap_06_Product.md §6.1.5 — COS = control operațional  
[15] Cap_06_Product.md §6.1.9 — Orchestrare ≠ comandă  
[16] Cap_06_Product.md §6.5.5 — Separare date/loguri/acces  
[17] Cap_06_Product.md §6.1.8 — EOC = canal, nu sistem  
[18] Cap_06_Product.md §6.1.8 — Siguranța prioritate absolută  
[19] Cap_06_Product.md §6.1.8 — Conform Cap. 12 și PB-07  
[20] Cap_03_Solution_Overview.md §3.7 — Monetizare logistică  
[21] Cap_03_Solution_Overview.md §3.7 — Două modele financiare  
[22] Cap_03_Solution_Overview.md §3.7 — Audit complet financiar  
[23] Knowledge base — Toate acțiunile logate  
[24] Knowledge base — AI marcaj distinct  
[25] Knowledge base — Phantom mode logat separat  
[26] Cap_06_Product.md §6.5.4 — Audit tehnic, informațional  
[27] Cap_06_Product.md §6.5.3 — DSS NU ia decizii finale  
[28] Knowledge base — Echivalent AI per cont uman  
[29] AI_AGENT_SYSTEM.md — Tranziție AUTONOM → ASISTENT  
[30] Knowledge base — Acțiuni AI marcate distinct  
[31] Cap_06_Product.md §6.3.0 — Eligibilitate exclusiv de platformă  
[32] Cap_03_Solution_Overview.md §3.2 — Pre-orchestrare zonală  
[33] Cap_06_Product.md §6.5.3 — DSS propune, nu decide  
[34] Cap_06_Product.md §6.5.2 — DronePort = punct transfer  
[35] Cap_03_Solution_Overview.md §3.5 — Fallback parte din soluție  
[36] Cap_03_Solution_Overview.md §3.6 — Livrare etapizată  
[37] DELIVERY_MULTIMODAL.md — Drona NU așteaptă  
[38] DELIVERY_MULTIMODAL.md — Drona NU negociază  
[39] DELIVERY_MULTIMODAL.md — Drona NU repetă  
[40] Cap_03_Solution_Overview.md §3.5 — Supervizare activă  
[41] Cap_06_Product.md §6.2.5 — Website nu expune canale private  
[42] SYSTEM_ARCHITECTURE.md Layer 1 — Informare, nu execuție  
[43] Knowledge base — AI public separat de AI consultant  
[44] Knowledge base — Versioning distinct per patch  
[45] Knowledge base — Verificare post-publish reală  

---

> **Document generat:** 27 Iunie 2026  
> **Structură:** Conform celor 6 Straturi Canonice ale Platformei DROPi  
> **Surse:** Documentație canonică completă + knowledge base proiect  
> **Autor:** Manus AI pentru fondatorul DROPi  
> **Următorul pas:** Confirmarea ta și începerea Sprint 1-2 (Auth + Audit)
