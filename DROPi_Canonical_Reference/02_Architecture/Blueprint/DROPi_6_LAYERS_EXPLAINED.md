# DROPi — Cele 6 Straturi ale Platformei (Detaliat)

> **Sursă:** SYSTEM_ARCHITECTURE.md + Cap_03_Solution_Overview + Cap_06_Product (documentație canonică)  
> **Versiune:** 1.0 — 27 Iunie 2026

---

## Viziunea de Ansamblu

DROPi nu este o aplicație simplă de livrări. Este un **sistem guvernat** cu 6 straturi arhitecturale distincte, fiecare cu un rol specific, vizibilitate diferită și responsabilități clare. Aceste straturi nu sunt "module de cod" — sunt **niveluri conceptuale de control** prin care trece orice operațiune DROPi.

Principiul fundamental:

> **Livrarea nu pornește decât atunci când cererea, capacitatea și riscul sunt validate explicit.**

Straturile există pentru a asigura că fiecare pas este controlat, auditat și reversibil.

---

## Stratul 1: PUBLIC FRONT (Website)

| Aspect | Detalii |
|--------|---------|
| **Ce este** | Fața publică a DROPi — website-ul de prezentare |
| **Vizibilitate** | Publică — oricine poate accesa |
| **Funcție principală** | Filtrare de risc și pre-calificare |
| **NU face** | NU execută comenzi, NU alocă piloți, NU pornește livrări |

### Ce conține:
- Landing page (prezentare produs)
- Informații despre produse/servicii
- Pricing (transparent, conform regulilor canonice)
- Contact
- Blog / Resurse educaționale
- Pagini legale (Terms, Privacy, GDPR)

### Rol în ecosistem:
Public Front este **filtrul inițial**. Aici potențialii utilizatori (clienți, comercianți, piloți, parteneri) descoperă DROPi și decid dacă vor să intre în ecosistem. Website-ul **nu expune canale private** (COS, EOC) și nu oferă acces la funcționalități operaționale.

### Relevanță pentru aplicația mobilă:
- **NU este în aplicația mobilă** — este un produs separat (website React)
- Aplicația mobilă începe de la Layer 2 (APPLICATION CORE)
- Dar: aplicația poate avea un "About DROPi" screen care linkează către website

---

## Stratul 2: APPLICATION CORE (Platforma Digitală)

| Aspect | Detalii |
|--------|---------|
| **Ce este** | Nucleul digital — aplicația mobilă + backend-ul |
| **Vizibilitate** | Internă — doar utilizatori autentificați |
| **Funcție principală** | Execuție, control, orchestrare |
| **Principiu** | Orchestrează fluxuri, NU comandă oameni |

### Ce conține:
- **Account Management** — Conturi, roluri, RBAC (29 roluri × 4 canale)
- **Role Management** — Permisiuni, acces, vizibilitate per rol
- **Order Management** — Ciclul de viață al comenzilor (INITIATED → VALIDATED → PREPARING → READY → ACCEPTED → IN_EXECUTION → COMPLETED)
- **Flow Control** — Reguli de business, validări, tranziții de stare
- **Audit Generation** — Logarea tuturor acțiunilor

### Rol în ecosistem:
Application Core este **creierul operațional**. Aici se întâmplă totul:
- Clientul plasează comanda
- Comerciantul o pregătește
- Sistemul validează eligibilitatea
- Pilotul acceptă misiunea
- Toate tranzițiile de stare sunt controlate

### Ce înseamnă "orchestrare" (nu "comandă"):
DROPi orchestrează = coordonare logică a fluxurilor (cine primește ce, când, pe ce reguli), **fără a însemna comandă ierarhică asupra oamenilor**. Piloții sunt self-employed — acceptă voluntar, nu sunt "comandați".

### Relevanță pentru aplicația mobilă:
- **ACESTA este stratul principal al aplicației mobile**
- Toate cele 29 dashboard-uri, marketplace-ul, checkout-ul, tracking-ul — toate sunt Layer 2
- Autentificarea, RBAC, navigarea — Layer 2
- tRPC API, business logic — Layer 2

---

## Stratul 3: PHYSICAL CORE (DronePort)

| Aspect | Detalii |
|--------|---------|
| **Ce este** | Infrastructura fizică — DronePort-uri, depozite, hub-uri de transfer |
| **Vizibilitate** | Locații fizice + reprezentare digitală în app |
| **Funcție principală** | Control infrastructural |
| **NU este** | NU este centru de comandă, NU este bază aeriană independentă |

### Ce conține:
- **Battery Exchange** — Schimb baterii pentru drone
- **Package Transfer** — Transfer pachete între moduri de transport (drone → van, van → e-bike, etc.)
- **Safety Points** — Puncte de siguranță pentru aterizări de urgență
- **Physical Audit** — Logare fizică (cine a intrat, ce s-a transferat)
- **Non-Drone Fallback** — Suport pentru livrare terestră când drona nu poate

### Rol în ecosistem:
DronePort-urile sunt **elementul lipsă** din logistica modernă. Ele:
- Absorb șocuri operaționale (vreme rea, pilot indisponibil)
- Permit livrare etapizată (merchant → DronePort → client)
- Reduc presiunea asupra clientului (nu trebuie să fie acasă exact la ora X)
- Cresc siguranța (punct de fallback controlat)

### Ce NU sunt DronePort-urile:
- NU sunt centre de comandă
- NU sunt baze de operare aeriană independente
- NU sunt spații publice de distribuție
- NU substituie infrastructura statului
- NU conferă drept de operare aeriană

### Relevanță pentru aplicația mobilă:
- Modulul "DronePort / Rețea Logistică" din app (tab-ul droneport.tsx)
- Harta cu locațiile DronePort-urilor
- Status capacitate, transfer-uri active
- Fleet Manager vede starea DronePort-urilor
- Pilot-ul vede unde poate ateriza/transfera

---

## Stratul 4: LOGIC CORE (AI/DSS — Decision Support System)

| Aspect | Detalii |
|--------|---------|
| **Ce este** | Sistemul de inteligență artificială și suport decizional |
| **Vizibilitate** | Internă — funcționează "în spate" |
| **Funcție principală** | Recomandări, evaluare risc, optimizare |
| **REGULA DE AUR** | NU ia decizii finale, NU comandă execuția |

### Ce conține:
- **Recomandări** — Sugerează rute, piloți, moduri de livrare
- **Evaluare risc** — Analizează condițiile (vreme, trafic, capacitate)
- **Optimizare rute** — Calculează cea mai eficientă cale
- **Detecție anomalii** — Identifică pattern-uri suspecte (fraud, erori)

### Regula canonică critică:
> **DSS NU ia decizii finale și NU comandă execuția.**

Deciziile finale aparțin:
- Piloților (în marketplace) — ei acceptă sau refuză
- Entităților (în COS Modul 2) — ele controlează flota lor
- Regulilor contractuale și de siguranță — sistemul aplică reguli, nu judecă

### Relevanță pentru aplicația mobilă:
- **Sistemul de Agenți AI** (canonical/AI_AGENT_SYSTEM.md) este implementarea Layer 4
- Fiecare agent AI din cele 29 este o instanță a Logic Core
- Modul AUTONOM = DSS care simulează și testează
- Modul ASISTENT = DSS care ghidează omul
- Eligibility engine (ce produs poate fi livrat cu ce mod)
- Route optimization (sugestii, nu comenzi)
- Fraud detection (semnalează, nu blochează automat)

---

## Stratul 5: OPERATIONAL CORE (Livrarea)

| Aspect | Detalii |
|--------|---------|
| **Ce este** | Execuția fizică supervizată — zboruri, livrări, intervenții |
| **Vizibilitate** | Operațiuni de teren |
| **Funcție principală** | Execuție fizică supervizată |
| **Principiu** | Livrarea este SUPERVIZATĂ, nu autonomă nesupravegheată |

### Ce conține:
- **Flights** — Zboruri de drone (supervizate de pilot)
- **Deliveries** — Livrări terestre (auto, van, e-bike)
- **Fallback Activation** — Trecerea de la un mod la altul când condițiile se schimbă
- **Human Interventions** — STOP, OVERRIDE, redirecționare

### Reguli canonice:
- Livrarea pornește **doar** la starea READY (nu înainte)
- Pilotul supervizează activ (nu "trimite și uită")
- Butonul STOP este întotdeauna disponibil
- Fallback-ul este parte din design, nu excepție
- Drona NU așteaptă clientul, NU negociază recepția, NU repetă livrarea

### Relevanță pentru aplicația mobilă:
- Dashboard-ul Pilot-ului (misiuni, pre-flight checklist, in-flight supervision)
- Butonul STOP + FALLBACK pe ecranul de misiune
- Live tracking pe hartă (poziție, viteză, altitudine)
- Tranziții de stare: ACCEPTED → IN_EXECUTION → COMPLETED/FAILED
- Fleet Manager vede toate operațiunile active
- Emergency Coordinator (C3) poate interveni

---

## Stratul 6: AUDIT CORE (Date/Loguri/GDPR)

| Aspect | Detalii |
|--------|---------|
| **Ce este** | Sistemul de trasabilitate completă |
| **Vizibilitate** | Internă + Compliance + Autorități |
| **Funcție principală** | Trasabilitate, conformitate, responsabilitate legală |
| **Principiu** | Orice decizie este documentată, explicabilă, auditabilă |

### Ce conține:
- **Action Logs** — Cine a făcut ce, când
- **Decision Logs** — Ce s-a decis și de ce
- **Flight Logs** — Date de zbor (traiectorie, viteză, altitudine, evenimente)
- **Access Logs** — Cine a accesat ce date
- **GDPR Data** — Export date personale, dreptul la ștergere
- **Authority Reports** — Rapoarte pentru autorități (EASA, FAA, CAAP)

### Caracteristici canonice ale auditului:
- **Tehnic** — bazat pe date, nu pe opinii
- **Informațional** — orientat spre reconstrucție factuală
- **Orientat spre trasabilitate** — poți reconstrui orice eveniment
- **NU disciplinar** — nu pedepsește, doar documentează
- **NU ierarhic** — nu creează relații de subordonare

### Ce înregistrează:
- Cereri (cine a cerut ce)
- Alocări (cui i s-a alocat ce)
- Acceptări (cine a acceptat)
- Refuzuri (cine a refuzat și de ce)
- Opriri (STOP activat, de cine, de ce)
- Evenimente de fallback (ce a declanșat fallback-ul)
- Schimbări de stare (fiecare tranziție)

### Relevanță pentru aplicația mobilă:
- Tabelul `audit_logs` din DB (deja există)
- Profile screen cu "Audit Info" per utilizator
- Admin → Audit Manager dashboard
- Modulul Authorities (rapoarte de conformitate)
- Fiecare acțiune din app generează un log
- GDPR: export date, ștergere cont

---

## Cum se Leagă Straturile între Ele

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Layer 1: PUBLIC FRONT                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Website → Informează → Filtrează → Pre-califică       │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                              │ (utilizatorul decide să intre)   │
│                              ▼                                   │
│  Layer 2: APPLICATION CORE                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  App Mobilă → Autentificare → Roluri → Comenzi →       │   │
│  │  Validare → Orchestrare → Control                       │   │
│  └────┬──────────────┬──────────────┬──────────────┬───────┘   │
│       │              │              │              │             │
│       ▼              ▼              ▼              ▼             │
│  Layer 3:       Layer 4:       Layer 5:       Layer 6:          │
│  PHYSICAL       LOGIC          OPERATIONAL    AUDIT             │
│  ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐          │
│  │Drone │      │AI/DSS│      │Zbor/ │      │Loguri│          │
│  │Port  │      │Reco- │      │Livrare│      │Audit │          │
│  │Trans-│      │mandări│      │STOP/ │      │GDPR  │          │
│  │fer   │      │Risc  │      │Fall- │      │Raport│          │
│  │Buffer│      │Optim.│      │back  │      │Trace │          │
│  └──────┘      └──────┘      └──────┘      └──────┘          │
│       │              │              │              │             │
│       └──────────────┴──────────────┴──────────────┘             │
│                              │                                   │
│                    Toate raportează la                           │
│                    APPLICATION CORE (Layer 2)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mapare: Straturi → Ce Avem vs Ce Lipsește

| Strat | Ce AVEM (implementat) | Ce LIPSEȘTE |
|-------|----------------------|-------------|
| **L1: Public Front** | N/A (nu e în app mobilă) | Website separat (viitor) |
| **L2: Application Core** | ✅ 29 dashboard-uri, marketplace, checkout, RBAC, navigare | ❌ Auth real, ❌ Persistență DB, ❌ Plăți, ❌ Real-time |
| **L3: Physical Core** | ✅ Modul DronePort (UI), harta cu locații | ❌ Date reale DronePort, ❌ Integrare IoT, ❌ Capacitate live |
| **L4: Logic Core** | ✅ Eligibility badges, ✅ Document canonic AI Agents | ❌ AI Engine real, ❌ 29 agenți funcționali, ❌ Route optimization |
| **L5: Operational Core** | ✅ Pilot dashboard, STOP/FALLBACK UI, tracking simulat | ❌ GPS real, ❌ Geofencing, ❌ Weather integration |
| **L6: Audit Core** | ✅ Tabelă audit_logs, ✅ Profile audit info | ❌ Logare reală a tuturor acțiunilor, ❌ GDPR export, ❌ Authority reports |

---

## Concluzie: De Ce Straturile Sunt Cheia

Roadmap-ul ar trebui structurat **pe straturi**, nu pe "features tehnice", pentru că:

1. **Layer 2 (Application Core)** este fundația — fără auth real și persistență, nimic altceva nu funcționează
2. **Layer 4 (Logic Core)** = Sistemul AI — odată funcțional, testează automat toate celelalte straturi
3. **Layer 5 (Operational Core)** depinde de Layer 3 (DronePort real) și Layer 4 (AI decisions)
4. **Layer 6 (Audit Core)** trebuie să fie activ din prima zi — orice acțiune trebuie logată

Ordinea naturală de implementare urmând straturile:
```
L2 (fundația) → L6 (audit din prima zi) → L4 (AI/DSS) → L3 (DronePort real) → L5 (operațiuni reale)
```

---

> **Document generat:** 27 Iunie 2026  
> **Surse canonice:** SYSTEM_ARCHITECTURE.md, Cap_03_Solution_Overview.md, Cap_06_Product.md  
> **Autor:** Manus AI pentru fondatorul DROPi
