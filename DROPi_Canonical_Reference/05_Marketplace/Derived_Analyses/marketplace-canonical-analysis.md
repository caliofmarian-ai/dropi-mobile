# Marketplace Canonical Analysis — Key Findings

## Source Documents Analyzed
1. **06.X** — Marketplace-ul DROPi — Poziționare corectă
2. **07.X** — Marketplace-ul în cadrul site-ului DROPi
3. **07.X.1** — Reguli de Design UI Marketplace
4. **08.X** — Absența marketplace-ului din aplicația DROPi
5. **08.X.1** — Aliniere Cap. 8 → Cap. 11
6. **08.X.2** — Diagramă Secvențială Canonică
7. **08.0.1.0** — Anexa 8.A — Mapare Roluri & Permisiuni (RBAC)
8. **12.0.0** — Anexa 12.A — Structură Log-uri
9. **15** — Integrare, Interoperabilitate și Ecosistem
10. **15.3** — Checklist de Integrare Partener
11. **Anexa 6B** — Marketplace Controlat DROPi (Volume II)
12. **B2B_Logistics_Partners.md** — Parteneri Logistici B2B
13. **Marketplace_Financial_Flow.md** — Fluxuri Financiare
14. **Delivery_Multimodal.md** — Livrare Multimodală

---

## CRITICAL ARCHITECTURAL RULE

> **Marketplace-ul NU există în aplicația DROPi (CORE).**
> Aplicația operează exclusiv cu COMENZI VALIDATE.
> Marketplace-ul este UI de ofertă pe SITE, nu în aplicație.

### Implicație pentru implementare:
- Aplicația mobilă DROPi este CORE-ul operațional
- Marketplace-ul este pe SITE (web) — un strat de prezentare
- Aplicația primește CERERI validate din marketplace (site)
- Aplicația NU afișează listări comerciale, NU permite browsing de ofertă

### RECONCILIERE CU CEREREA UTILIZATORULUI:
Utilizatorul dorește dashboard-uri pentru comercianți/parteneri C2 în aplicație.
Conform documentelor canonice, aceasta este PERMISĂ deoarece:
- Comercianții au rol "Partener" cu permisiuni specifice
- Dashboard-ul lor gestionează COMENZI (nu marketplace browsing)
- Gestionarea catalogului de produse este o funcție de ADMINISTRARE (nu de afișare publică)
- Partenerii C2 mari au integrare prin API/redirect, nu prin marketplace public

**Concluzie:** Dashboard-ul comercianților în aplicație = gestionare catalog + comenzi + analytics.
NU = marketplace public browsable.

---

## TIPURI DE PARTICIPANȚI ÎN MARKETPLACE

| Tip | Descriere | Regim | Listare |
|-----|-----------|-------|---------|
| Comercianți B2C | Magazine locale, restaurante, producători | Marketplace public | Produse cu preț fix |
| Artizani | Producători individuali, serii mici | Marketplace public | Limitat |
| P2P | Persoane fizice, livrări private | Marketplace public | 1-3 active simultan |
| Selleri comunitari | Neautorizați, tranziție | Marketplace public | Limitat numeric+temporal |
| Comercianți mari B2B | Supermarketuri, lanțuri | Canale B2B SEPARATE | NU în marketplace public |

---

## MODURI DE INTEGRARE B2B (Parteneri C2 Mari)

### 4.1 Logistic API (Model Principal)
- Client comandă pe platforma partenerului
- La checkout: opțiunea "Livrare prin DROPi"
- Partenerul transmite cererea de livrare către DROPi
- DROPi orchestrează livrarea complet

### 4.2 Redirect Controlat
- Marketplace-ul public afișează un CARD de partener
- Clientul este redirecționat către platforma partenerului
- DROPi NU gestionează comanda produsului
- DROPi gestionează EXCLUSIV livrarea

### 4.3 White-Label
- DROPi operează livrarea fără vizibilitate publică
- Integrare complet contractuală B2B

---

## SISTEM DE ÎNCREDERE ȘI BADGE-URI

### Componente Scor de Încredere:
- Evaluări post-livrare ale consumatorilor
- Raportări privind calitatea produsului
- Istoricul reclamațiilor
- Rata comenzilor anulate sau returnate
- Respectarea regulilor marketplace-ului

### Tipuri de Badge-uri:
- Indicator de încredere RIDICATĂ
- Indicator de activitate NOUĂ / istoric limitat
- Indicator de RISC crescut
- Restricții temporare

### Reguli Badge-uri:
- Vizibile public
- Actualizate dinamic
- Imposibil de eliminat/ascuns de seller
- DROPi NU modifică manual scorurile
- Selleri comunitari OBLIGAȚI să afișeze nivelul de încredere

### Badge-uri Livrare (per produs):
- 🚁 Dronă (aerian)
- 🚗 Terestru (auto/van/bicicletă)
- 🔄 Multimodal (mixt)
- Badge-urile NU garantează metoda finală

### Mecanism de Eliminare Naturală:
- Evaluări negative repetate → limitare vizibilitate
- Raportări neconformitate → suspendare temporară
- Încălcări siguranță → eliminare acces marketplace

---

## FLUXURI FINANCIARE

### Model A — Escrow DROPi (implicit/recomandat):
- Client plătește → DROPi reține → Eliberare către comerciant
- DROPi reține: comision marketplace + taxă livrare + taxe operaționale
- Permite refund controlat, compensare, audit complet

### Model B — Plată directă la comerciant:
- EXCLUSIV comercianți autorizați B2C
- DROPi facturează separat livrarea
- DROPi NU garantează refund-ul produsului

### Interzise:
- Plăți externalizate pentru artizani/P2P
- Plăți cash neînregistrate
- Plăți off-platform
- Criptomonede (în prezent)

### Politică Anulare (OBLIGATORIE per produs):
- Definită per stare: CREATED, SCHEDULED, PREPARING, READY, IN_DELIVERY
- Refund permis/interzis + valoare fixă + destinație sumă
- Vizibilă la listare + checkout
- Acceptată explicit de client

---

## ROLURI RBAC CANONICE

| Rol | Permisiuni |
|-----|-----------|
| Client | Inițiere cerere, vizualizare stare proprie, anulare controlată |
| Partener | Creare cereri comerciale, pregătire colet, vizualizare status comenzi proprii |
| Pilot | Acceptare/refuz misiune, supervizare zbor, intervenție/fallback, raportare incidente |
| Operator Zonal | Alocare piloți, gestionare zone, suspendare operațională locală |
| Admin Sistem | Configurare globală, management roluri, acces complet (auditat) |
| Auditor | Acces read-only, log-uri, decizii, istoric, fără drept de execuție |

---

## AUDIT & LOGURI (Cap. 12)

### Structură Log:
- Log_ID unic, Tip log, Timestamp UTC, Sursă, Entitate asociată, Acțiune, Rezultat, Severitate

### Tipuri de Log-uri:
- Log Acțiuni Utilizatori (User_ID, Rol, Tip acțiune, Context, IP/device)
- Log Decizii DSS (Recomandare, Factori, Nivel încredere, Decizie umană)
- Log de Zbor (Drone_ID, Flight_ID, Stare, Eveniment)
- Log DronePort (DronePort_ID, Tip eveniment, Rezultat)
- Log Acces & Autentificare (Login, Schimbare parolă, Revocare)

### Reguli:
- Imutabile, corelate, timestampate UTC
- Acces rol-based, read-only pentru audit
- Niciun rol operațional nu poate modifica log-uri
- Acțiuni AI marcate cu semn distinct "AI personal"

---

## REGULI UI MARKETPLACE (07.X.1)

### PERMISE:
- Descrieri produse, imagini statice, preț informativ
- Zonă generală de disponibilitate, categorii
- Buton "Vezi detalii", buton "Inițiază cerere"
- Mesaje educaționale privind limitele DROPi

### STRICT INTERZISE:
- Buton "Comandă acum" / "Livrare instant" / "Plătește"
- Checkout complet în site
- Estimări de timp de livrare
- Promisiuni de cost fix
- Tracking live / status comenzi
- Hartă cu drone/rute
- SLA-uri
- Badge-uri "rapid", "garantat", "autonom"
- Comparații cu curieri/marketplace-uri
- Rating public de livrare / scoruri de performanță

---

## CONFLICTE DE LOGICĂ IDENTIFICATE

### Conflict 1: Marketplace în aplicație vs. document canonic
**Document:** "Marketplace-ul NU există în aplicația DROPi"
**Cerere utilizator:** Dashboard comercianți cu produse în aplicație
**Rezolvare:** Dashboard-ul comercianților = panel de ADMINISTRARE catalog (backend), nu marketplace public. Comerciantul gestionează produsele sale, dar afișarea publică este pe SITE.

### Conflict 2: Rating public de livrare interzis vs. badge-uri de încredere
**Document 07.X.1:** Interzis "rating public de livrare" și "scoruri de performanță"
**Document Anexa 6B:** Sistem de încredere cu badge-uri obligatorii
**Rezolvare:** Badge-urile de încredere sunt permise (indicator reputație seller). Ce este interzis sunt rating-urile de LIVRARE (performanță curier/dronă). Diferența: reputația COMERCIANTULUI (permisă) vs. performanța LIVRĂRII (interzisă).

### Conflict 3: Parteneri C2 mari - unde apar?
**Document B2B:** "NU listează produse individuale în marketplace-ul public"
**Cerere utilizator:** Parteneri C2 să aibă magazin în marketplace
**Rezolvare:** Parteneri C2 mari = CARD de partener cu redirect (model 4.2). Parteneri C2 mici (fără magazin extern) = pot lista produse direct (intră în economia C1).
