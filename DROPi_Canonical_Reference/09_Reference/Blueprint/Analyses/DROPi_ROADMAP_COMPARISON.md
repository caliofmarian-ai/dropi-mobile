# DROPi — Analiză Comparativă: Roadmap v1 (Tehnic) vs Roadmap v2 (Straturi Canonice)

> **Data:** 27 Iunie 2026  
> **Scop:** Identificarea îmbunătățirilor cheie și a provocărilor potențiale

---

## 1. Diferențe Structurale Fundamentale

| Criteriu | v1 (Tehnic) | v2 (Straturi Canonice) |
|----------|-------------|------------------------|
| **Principiu organizatoric** | Features tehnice (auth, plăți, real-time) | Straturi arhitecturale canonice (L2→L6→L4→L3→L5) |
| **Număr faze** | 12 faze liniare | 6 straturi × faze interne (30 faze totale) |
| **Număr pași** | ~120 pași | 191 pași |
| **Referințe canonice** | 2 documente menționate | 45 referințe explicite |
| **Audit** | Faza 8 (târziu, la "Securitate") | Din prima zi, în paralel cu fundația |
| **AI Agents** | Faza 2 (devreme, dar monolitic) | L4 cu 7 faze granulare, după ce au ce testa |
| **COS (C2)** | Menționat implicit în "29 dashboard-uri" | Fază dedicată (2.5) cu 8 pași specifici |
| **EOC (C3)** | Menționat implicit | Fază dedicată (2.6) cu 7 pași specifici |
| **DronePort** | Inclus în "Livrare Avansată" (Faza 6) | Strat separat (L3) cu 4 faze dedicate |
| **Website** | Nu menționat | Strat separat (L1), ultimul |
| **Module transversale** | Nu există concept | 4 module (Securitate, QA, Offline, Publish) |
| **Sprint planning** | Nu există | 28 sprint-uri mapate cronologic |

---

## 2. Îmbunătățiri Cheie ale Versiunii v2

### 2.1 Audit din Prima Zi (nu la Faza 8)

Aceasta este probabil cea mai importantă diferență. În v1, auditul apare la Faza 8 ("Securitate & Compliance"), ceea ce înseamnă că primele 7 faze de dezvoltare produc cod fără logare. În v2, Stratul 6 (Audit Core) se implementează **în paralel** cu Stratul 2 (Application Core) din Sprint 1-2.

Conform documentației canonice, principiul este clar: "Toate acțiunile și activitățile platformei DROPi trebuie logate și auditabile." Aceasta nu este o funcționalitate opțională — este o cerință fundamentală care trebuie respectată de la prima linie de cod.

**Impact practic:** Când ajungem la testarea cu agenți AI (L4), avem deja un sistem complet de audit care poate fi verificat. Nu trebuie să "adăugăm logare" retroactiv pe 7 faze de cod deja scris.

---

### 2.2 Separare Explicită pe Canale (C1, C2, C3, Admin)

În v1, cele 4 canale sunt menționate ca "29 dashboard-uri existente" fără a detalia implementarea separată a fiecăruia. COS și EOC sunt tratate ca "UI-uri deja făcute" fără a specifica logica de business distinctă.

În v2, fiecare canal are fază dedicată:
- **Faza 2.4** — Marketplace Controlat (C1) cu 8 pași specifici
- **Faza 2.5** — COS (C2) cu 8 pași specifici
- **Faza 2.6** — EOC (C3) cu 7 pași specifici
- **Faza 2.7** — Admin Operations cu 7 pași specifici

Aceasta respectă regula canonică: "Separare completă date/loguri/acces între canale."

**Impact practic:** Nu vom avea situația în care datele C2 (confidențiale) sunt vizibile din C1 (public), sau în care un agent C1 poate accesa funcționalități C3 (urgență).

---

### 2.3 DronePort ca Strat Separat (nu sub-feature)

În v1, DronePort apare la Faza 6 ("Funcționalități Avansate de Livrare") ca un pas: "Staged delivery logic — Orchestrare completă: Merchant → DronePort → Client." Aceasta reduce DronePort la un simplu waypoint.

În v2, DronePort este un strat complet (L3: Physical Core) cu 4 faze:
- Management digital (schema, CRUD, capacitate, scheduling)
- Transfer multimodal (drone→van, tracking prin transfer, buffer)
- Battery management (status, swap, cicluri, alertă)
- Safety points (emergency landing, recovery)

**Impact practic:** DronePort-ul devine o componentă cu propria logică, nu doar un pin pe hartă. Aceasta reflectă realitatea canonică: DronePort-urile sunt "elementul lipsă din logistica modernă."

---

### 2.4 AI Agents Granular (nu Monolitic)

În v1, Faza 2 ("Sistemul de Agenți AI") conține totul într-un bloc: infrastructură + 29 agenți + dashboard admin. Estimare: "2-3 sesiuni de lucru" — ceea ce este nerealist pentru 29 agenți funcționali.

În v2, Logic Core (L4) este descompus în 7 faze:
1. Framework (base class, registry, engine, moduri)
2. 9 Agenți C1 (individual, cu dependență de marketplace funcțional)
3. 8 Agenți C2 (cu dependență de COS funcțional)
4. 6 Agenți C3 (cu dependență de EOC funcțional)
5. 6+5 Agenți Admin+Support
6. Simulare 1 lună (orchestrator, scenarii, detecție bug-uri)
7. Eligibility Engine + Route Optimization

**Impact practic:** Fiecare grup de agenți se implementează DUPĂ ce canalul lor este funcțional. Agenții C1 nu pot testa marketplace-ul dacă marketplace-ul nu există încă real.

---

### 2.5 Dependențe Explicite între Faze

În v1, dependențele sunt vagi: "Dependență: Faza 1 completă." Aceasta nu spune CE din Faza 1 este necesar.

În v2, fiecare fază specifică exact de ce depinde:
- "Faza 4.2 — Dependențe: Faza 4.1 (framework) + Faza 2.4 (marketplace funcțional)"
- "Faza 5.1 — Dependențe: Faza 2.3 (orders la READY) + Faza 3.2 (transfer multimodal) + Faza 4.7 (route optimization)"

**Impact practic:** Nu vom începe o fază fără a avea toate precondițiile îndeplinite. Reduce riscul de "am implementat X dar nu merge pentru că Y nu e gata."

---

### 2.6 Reguli Canonice la Fiecare Fază

În v1, regulile canonice sunt menționate generic la final ("Canonical compliance"). Nu se specifică CE regulă se aplică la CE pas.

În v2, fiecare fază are secțiune "Reguli canonice respectate" cu referințe numerotate:
- Faza 2.4: "Marketplace controlat, nu deschis nefiltrat [10]"
- Faza 5.1: "Drona NU așteaptă clientul [37], NU negociază recepția [38], NU repetă livrarea [39]"

**Impact practic:** Dezvoltatorul (eu) nu poate "uita" o regulă canonică. Fiecare implementare are checklist-ul ei de conformitate.

---

### 2.7 Module Transversale (Concept Nou)

v1 nu are concept de "module transversale." Securitatea, testarea, offline, și publicarea sunt faze separate, liniare.

v2 introduce 4 module care traversează mai multe straturi:
- **T1 Securitate** (L2 + L6)
- **T2 Testare/QA** (L4 + L6)
- **T3 Offline** (L2)
- **T4 Publicare** (L2 + L5)

**Impact practic:** Securitatea nu este "o fază pe care o faci la final" — este ceva ce se construiește continuu. La fel testarea: agenții AI (L4) SUNT testarea (T2).

---

## 3. Provocări Potențiale ale Versiunii v2

### 3.1 Complexitate Crescută (191 vs 120 pași)

Roadmap-ul v2 are cu 59% mai mulți pași. Aceasta poate crea:
- **Risc de paralizie prin analiză** — prea mulți pași pot face dificilă decizia "pe ce lucrez acum"
- **Estimări mai dificile** — 28 sprint-uri vs 15-20 sesiuni
- **Overhead de tracking** — todo.md devine mai complex

**Mitigare:** Sprint planning-ul din v2 grupează fazele în perechi paralele, reducând complexitatea percepută. Fiecare sprint are un obiectiv clar.

---

### 3.2 Paralelism Agresiv (Audit + App Core Simultan)

v2 cere implementarea Audit Core (L6) în paralel cu Application Core (L2) din Sprint 1-2. Aceasta înseamnă:
- Fiecare feature nou trebuie să aibă logare de la început
- Codul de audit trebuie scris ÎNAINTE de a ști exact ce acțiuni vor exista
- Refactoring-ul auditului este inevitabil pe măsură ce se adaugă features

**Mitigare:** Middleware-ul de audit poate fi generic (interceptare automată tRPC). Nu trebuie să știm toate acțiunile dinainte — le interceptăm automat.

---

### 3.3 Dependențe Stricte Pot Bloca Progresul

v2 are dependențe explicite: "Faza 4.2 depinde de Faza 2.4." Dacă Faza 2.4 (Marketplace) întâmpină probleme, toți agenții C1 (Faza 4.2) sunt blocați.

În v1, dependențele sunt mai relaxate: "Faza 2 depinde de Faza 1" — ceea ce permite lucru parțial chiar dacă Faza 1 nu e 100% completă.

**Mitigare:** Agenții AI pot fi dezvoltați cu mock data inițial și conectați la date reale ulterior. Dependența este pentru TESTARE reală, nu pentru DEZVOLTARE.

---

### 3.4 COS și EOC Pot Fi Premature

v2 dedică sprint-uri 9-12 pentru COS (C2) și EOC (C3). Dar:
- COS necesită contracte reale cu entități (nu există încă)
- EOC necesită scenarii de urgență validate (nu există încă)
- Ambele sunt canale private/instituționale care nu au utilizatori în faza demo

**Mitigare:** Implementarea se face cu date simulate ([SIMULATED]). Agenții AI testează flow-urile. Când apar clienți reali COS/EOC, infrastructura este gata.

---

### 3.5 DronePort Fizic vs Digital

v2 dedică un strat complet (L3) pentru DronePort, dar:
- Nu există DronePort-uri fizice încă
- Battery management necesită hardware IoT
- Safety points necesită validare pe teren

**Mitigare:** L3 se implementează ca **reprezentare digitală** a infrastructurii fizice viitoare. Datele sunt simulate, dar structura este reală. Când primul DronePort fizic devine operațional, software-ul este gata.

---

### 3.6 Simulare 1 Lună (Faza 4.6) Este Ambițioasă

Rularea a 29 agenți AI timp de 1 lună simulată necesită:
- LLM calls consistente (cost, rate limits)
- Orchestrare complexă (scenarii variate zilnic)
- Detecție bug-uri fiabilă (nu false positives)

**Mitigare:** Simularea poate fi accelerată (1 zi simulată = câteva minute reale). Agenții nu trebuie să fie "inteligenți" — trebuie să fie "sistematici" (parcurg flow-uri predefinite cu variații).

---

### 3.7 Website (L1) la Final Poate Întârzia Marketing

v2 pune website-ul (L1: Public Front) ultimul (Sprint 27-28). Dar:
- Marketing-ul are nevoie de website devreme
- Investitorii vor să vadă un site profesional
- SEO necesită timp pentru indexare

**Mitigare:** Website-ul este un produs separat și poate fi dezvoltat independent (alt proiect, alt sprint). Roadmap-ul v2 se referă la aplicația mobilă — website-ul poate fi paralel.

---

## 4. Tabel Comparativ Final

| Aspect | v1 (Tehnic) | v2 (Straturi) | Câștigător |
|--------|-------------|---------------|------------|
| Aliniere cu documentația canonică | Parțială | Completă (45 referințe) | **v2** |
| Audit din prima zi | ❌ (Faza 8) | ✅ (Sprint 1-2) | **v2** |
| Separare canale | Implicită | Explicită cu faze dedicate | **v2** |
| Granularitate AI | Monolitic (1 fază) | 7 faze cu dependențe clare | **v2** |
| DronePort | Sub-feature | Strat complet | **v2** |
| Simplitate execuție | ✅ (12 faze liniare) | ❌ (30 faze, dependențe complexe) | **v1** |
| Estimare realistă | ❌ ("2-3 sesiuni" pentru 29 agenți) | ✅ (28 sprint-uri detaliate) | **v2** |
| Risc de blocaj | Scăzut (dependențe relaxate) | Mediu (dependențe stricte) | **v1** |
| Conformitate legală | Menționată generic | Verificabilă per fază | **v2** |
| Scalabilitate plan | Limitată | Extensibilă (module transversale) | **v2** |
| Overhead management | Scăzut | Mediu-Ridicat | **v1** |
| Pregătire producție | Bună | Excelentă | **v2** |

---

## 5. Recomandare

Versiunea v2 (Straturi Canonice) este superioară pentru un proiect de complexitatea DROPi, din următoarele motive:

1. **Conformitate dovedibilă** — Fiecare pas poate fi verificat contra documentației canonice. Aceasta este esențială pentru investitori, autorități, și qa-debugger.

2. **Audit nativ** — Nu este un "add-on" ci o proprietate fundamentală a sistemului. Conform principiului canonic: "Orice decizie este documentată, explicabilă, auditabilă."

3. **Scalabilitate** — Când apar cerințe noi, se adaugă la stratul relevant fără a restructura totul.

4. **Testabilitate** — Agenții AI (L4) testează exact ce trebuie, pentru că depind de funcționalitatea reală (L2).

Provocările (complexitate, paralelism, dependențe stricte) sunt gestionabile prin:
- Sprint planning disciplinat
- Middleware generic de audit (interceptare automată)
- Date simulate pentru canale fără utilizatori reali încă
- Website ca proiect paralel independent

---

## 6. Următorul Pas Recomandat

Dacă adopți v2, primul sprint (1-2) conține:
- **Faza 2.1** — Autentificare reală (9 pași)
- **Faza 6.1** — Sistem de logare complet (7 pași)

Total: 16 pași, executabili într-o sesiune de lucru concentrată. Fiecare feature de auth va genera automat audit log — cele două faze se construiesc reciproc.

---

> **Document generat:** 27 Iunie 2026  
> **Autor:** Manus AI pentru fondatorul DROPi
