# Plan de Implementare — Marketplace DROPi (Aplicație Mobilă)

**Autor:** Manus AI  
**Versiune:** 1.0  
**Data:** 28 Iunie 2026  
**Status:** Propunere — în așteptarea aprobării utilizatorului

---

## 1. Obiectiv General

Implementarea funcționalităților marketplace în aplicația mobilă DROPi, conform documentelor canonice, cu accent pe:

1. Dashboard-ul comercianților (gestionare catalog, comenzi, analytics)
2. Integrarea partenerilor C2 (magazin intern vs. redirect extern + Logistic API)
3. Sistemul de badge-uri și încredere (trust score, badge-uri seller, badge-uri livrare)
4. Revizuirea dashboard-urilor admin cu responsabilități marketplace + audit logs
5. Conformitate completă cu regulile canonice de publicare și fluxuri financiare

---

## 2. Reguli Canonice Fundamentale (Respectate Strict)

Următoarele reguli sunt extrase din documentele canonice și vor fi respectate în totalitate:

> **Marketplace-ul NU este aplicația DROPi.** Aplicația operează cu COMENZI VALIDATE. Marketplace-ul este stratul de ofertă pe SITE. (Doc. 08.X)

**Reconciliere cu cererea utilizatorului:** Dashboard-ul comercianților în aplicație este un **panel de administrare** (gestionare catalog, comenzi primite, analytics), NU un marketplace public browsable. Comerciantul își gestionează produsele, dar afișarea publică este pe site-ul web.

> **Marketplace-ul DROPi este CONTROLAT.** Nu orice produs poate fi listat, nu orice utilizator poate lista nelimitat, vizibilitatea nu poate fi cumpărată. (Anexa 6B)

> **Partenerii B2B mari NU listează produse individuale în marketplace-ul public.** Ei operează prin canale B2B separate. (B2B_Logistics_Partners.md)

> **Badge-urile de încredere sunt indicator de reputație, NU garanție de calitate.** (Anexa 6B, §3.5.1)

---

## 3. Arhitectura Propusă

### 3.1 Modele de Date (Tabele Noi)

| Tabelă | Descriere | Câmpuri Cheie |
|--------|-----------|---------------|
| `stores` | Magazinele comercianților | id, ownerId, name, description, logoUrl, type (internal/external), externalUrl, apiKey, zone, status, trustScore, createdAt |
| `products` | Catalogul de produse | id, storeId, name, description, price, currency, images, category, weight, dimensions, deliveryModes (JSON), cancellationPolicy (JSON), status (draft/pending/approved/rejected/suspended), moderationNote, createdAt |
| `product_reviews` | Evaluări post-livrare | id, productId, orderId, userId, rating (1-5), qualityRating, comment, createdAt |
| `seller_badges` | Badge-uri comercianți | id, storeId, type (high_trust/new_activity/high_risk/restricted), reason, issuedAt, expiresAt, isActive |
| `delivery_badges` | Badge-uri livrare per produs | id, productId, mode (drone/terrestrial/multimodal), isEligible, conditions |
| `audit_logs` | Log-uri audit marketplace | id, actorId, actorRole, actorType (human/ai), action, entityType, entityId, details (JSON), ipAddress, timestamp |
| `store_analytics` | Statistici per magazin | id, storeId, period, totalOrders, completedOrders, cancelledOrders, avgRating, revenue, refunds |

### 3.2 Tipuri de Magazin

| Tip | Descriere | Funcționalitate |
|-----|-----------|-----------------|
| **internal** | Comercianți mici/medii fără magazin extern | Publică produse direct în DROPi marketplace, comenzi procesate prin DROPi |
| **external** | Parteneri C2 mari cu magazin propriu | Card de partener + redirect, integrare Logistic API pentru livrare DROPi |

---

## 4. Funcționalități de Implementat

### 4.1 Dashboard Comerciant (Merchant Dashboard)

**Ecrane:**

| Ecran | Funcționalitate |
|-------|-----------------|
| `app/merchant/index.tsx` | Dashboard principal — statistici, comenzi recente, badge-uri, trust score |
| `app/merchant/store-setup.tsx` | Configurare magazin (tip, detalii, logo, zonă) |
| `app/merchant/products/index.tsx` | Lista produselor cu status (draft/pending/approved/rejected/suspended) |
| `app/merchant/products/[id].tsx` | Detalii produs — editare, politică anulare, badge-uri livrare |
| `app/merchant/products/new.tsx` | Creare produs nou (conform regulile de publicare) |
| `app/merchant/orders.tsx` | Comenzi primite — accept/pregătire/status |
| `app/merchant/analytics.tsx` | Analytics — venituri, evaluări, performanță |
| `app/merchant/api-integration.tsx` | (doar external) Configurare API key, documentație widget livrare |

**Reguli de Publicare Produs (conform Anexa 6B):**
- Preț fix obligatoriu (fără negociere, fără licitații)
- Politică de anulare obligatorie per stare (CREATED → IN_DELIVERY)
- Categorie și greutate/dimensiuni obligatorii (pentru eligibilitate livrare)
- Moderare automată + manuală înainte de aprobare
- Badge-uri livrare calculate automat (dronă/terestru/multimodal)
- Limite de listare pentru selleri comunitari (1-3 active simultan)

### 4.2 Sistem de Badge-uri și Încredere

**Trust Score — Componente:**

| Componentă | Pondere | Sursă |
|------------|---------|-------|
| Evaluări post-livrare consumatori | 35% | product_reviews |
| Raportări calitate produse | 20% | Reclamații |
| Rata comenzi anulate/returnate | 20% | Istoric comenzi |
| Respectarea regulilor marketplace | 15% | Audit automat |
| Istoric reclamații | 10% | Dispute |

**Badge-uri Seller:**

| Badge | Condiție | Vizibilitate |
|-------|----------|--------------|
| 🟢 Încredere Ridicată | Trust score > 85%, min. 20 comenzi | Public, pe card produs |
| 🔵 Activitate Nouă | < 5 comenzi completate | Public, informativ |
| 🟡 Risc Crescut | Trust score < 40% SAU reclamații repetate | Public, avertisment |
| 🔴 Restricționat | Suspendare temporară | Public, produse invizibile |

**Badge-uri Livrare (per produs):**

| Badge | Condiție |
|-------|----------|
| 🚁 Eligibil Dronă | Greutate < 5kg, dimensiuni compatibile, zonă acoperită |
| 🚗 Terestru | Orice produs, zonă acoperită |
| 🔄 Multimodal | Zonă cu DronePort, transfer posibil |

**Mecanism de Eliminare Naturală:**
- Trust score < 30% timp de 30 zile → limitare vizibilitate automată
- 3+ raportări neconformitate validate → suspendare temporară
- Încălcări siguranță → eliminare acces marketplace (cu audit)

### 4.3 Dashboard-uri Admin Revizuite

**Roluri Admin și Responsabilități Marketplace:**

| Rol | Responsabilități Marketplace | Acces |
|-----|------------------------------|-------|
| **Admin Sistem** | Configurare globală marketplace, management categorii, reguli publicare, override badge-uri (auditat) | Complet |
| **Operator Zonal** | Moderare produse din zona sa, aprobare/respingere listări, gestionare incidente locale | Zona proprie |
| **Auditor** | Vizualizare log-uri marketplace, decizii, istoric, rapoarte | Read-only, complet |
| **Owner** | Acces la TOTUL inclusiv audit logs financiare, securitate, rapoarte instituționale | Complet + Audit |

**Ecrane Admin Noi:**

| Ecran | Rol | Funcționalitate |
|-------|-----|-----------------|
| `app/admin/marketplace/index.tsx` | Admin/Owner | Dashboard marketplace — statistici, produse pending, badge-uri |
| `app/admin/marketplace/products.tsx` | Admin/Operator | Moderare produse — aprobare/respingere cu motivație |
| `app/admin/marketplace/stores.tsx` | Admin | Gestionare magazine — status, suspendare, badge-uri |
| `app/admin/marketplace/audit-logs.tsx` | Owner/Auditor | Vizualizare log-uri imutabile, filtrare, export |
| `app/admin/marketplace/categories.tsx` | Admin | Gestionare categorii de produse |
| `app/admin/marketplace/financial.tsx` | Owner/Auditor | Rapoarte financiare, comisioane, escrow status |

### 4.4 Audit Logs (Conformitate Cap. 12)

**Structura fiecărui log:**

```
Log_ID | Timestamp_UTC | Actor_ID | Actor_Role | Actor_Type (human/ai) |
Action | Entity_Type | Entity_ID | Details (JSON) | IP_Address | Severity
```

**Acțiuni logate în marketplace:**
- Creare/editare/ștergere produs
- Schimbare status produs (pending → approved/rejected)
- Modificare trust score
- Emitere/revocare badge
- Suspendare/reactivare magazin
- Aprobare/respingere listare (cu motivație)
- Acces phantom mode admin
- Override manual (cu justificare obligatorie)

**Reguli audit:**
- Log-urile sunt IMUTABILE (nu pot fi șterse/modificate)
- Acțiuni AI marcate cu semn distinct "AI personal"
- Acces read-only pentru rolul Auditor
- Corelate prin Store_ID, Product_ID, Order_ID
- Retenție conform politicii (Anexa 12.B)

### 4.5 Integrare Parteneri C2 Mari (Logistic API)

**Flux:**
1. Partenerul C2 își creează magazinul de tip `external`
2. Primește API key unic
3. Configurează webhook URL pentru notificări
4. Integrează widget-ul DROPi în checkout-ul propriu
5. La comandă: partenerul apelează DROPi Logistic API → cerere de livrare
6. DROPi orchestrează livrarea (pilot, mod, rută)
7. Status updates trimise via webhook

**Endpoint-uri API (documentate în app):**
- `POST /api/delivery/request` — Inițiere cerere livrare
- `GET /api/delivery/:id/status` — Status livrare
- `POST /api/delivery/:id/cancel` — Anulare
- `GET /api/delivery/estimate` — Estimare (informativă, non-contractuală)

---

## 5. Conflicte de Logică Rezolvate

| Conflict | Rezolvare |
|----------|-----------|
| Marketplace în aplicație vs. "NU există în app" | Dashboard = panel ADMINISTRARE (backend), nu marketplace public browsable |
| Rating public livrare interzis vs. badge-uri încredere | Badge-uri = reputație SELLER (permis). Interzis = rating performanță LIVRARE/curier |
| Parteneri C2 mari în marketplace | Card de partener + redirect (model 4.2). NU listează produse individuale |
| Estimări timp livrare interzise | Afișăm "informativ, non-contractual" — NU "garantat" sau "SLA" |
| Buton "Comandă acum" interzis pe site | În app (dashboard merchant) avem "Pregătește comanda" — diferit de marketplace public |

---

## 6. Upgrade-uri Suplimentare Identificate

Pe lângă cererea inițială, am identificat următoarele upgrade-uri relevante din documentele canonice:

| # | Upgrade | Sursă Canonică | Prioritate |
|---|---------|----------------|-----------|
| 1 | **Zonare marketplace** — produse vizibile doar în zona relevantă | Anexa 6B, §4 | Ridicată |
| 2 | **Politică anulare per produs** — definită obligatoriu per stare | Financial_Flow, §5 | Ridicată |
| 3 | **Limite listare P2P** — max 1-3 active simultan, temporal | Anexa 6B, §3.3.1 | Medie |
| 4 | **Phantom mode admin** — admin poate vedea contul oricărui user | Knowledge base | Medie |
| 5 | **AI agent pairing** — fiecare cont uman are un agent AI echivalent | Knowledge base | Viitor |
| 6 | **Moderare automată** — audit automat listări + comportament | Anexa 6B, §3.5.6 | Ridicată |
| 7 | **Escrow financiar** — Model A implicit, separare fonduri | Financial_Flow, §2.1 | Ridicată |
| 8 | **White-label B2B** — livrare fără vizibilitate brand DROPi | B2B_Partners, §4.3 | Viitor |
| 9 | **Pre-orchestrare** — estimări volum de la parteneri B2B | B2B_Partners, §6 | Viitor |
| 10 | **Fallback operațional** — redirecționare DronePort, schimbare mod | Delivery_Multimodal, §10 | Ridicată |

---

## 7. Plan de Execuție (Sprinturi)

### Sprint A — Fundație (Prioritate Maximă)
- [ ] DB: Creare tabele `stores`, `products`, `product_reviews`, `seller_badges`, `delivery_badges`, `audit_logs`
- [ ] Server: CRUD store (create, update, get, list)
- [ ] Server: CRUD products (create, update, delete, list, change status)
- [ ] Server: Audit log middleware (logare automată toate acțiunile)
- [ ] UI: Merchant Dashboard principal (statistici, comenzi recente)
- [ ] UI: Store Setup screen (tip magazin, detalii, logo)

### Sprint B — Catalog & Moderare
- [ ] Server: Product publishing rules (validare greutate, dimensiuni, categorie, politică anulare)
- [ ] Server: Moderare endpoint (approve/reject cu motivație)
- [ ] Server: Badge-uri livrare calculate automat per produs
- [ ] UI: Products list screen (cu status indicators)
- [ ] UI: New product screen (formular complet cu politică anulare)
- [ ] UI: Product detail/edit screen
- [ ] UI: Admin — Moderare produse (approve/reject)

### Sprint C — Trust & Badge-uri
- [ ] Server: Trust score calculation (cron/on-event)
- [ ] Server: Badge assignment logic (automat, bazat pe reguli)
- [ ] Server: Mecanism eliminare naturală (auto-suspendare)
- [ ] UI: Badge-uri vizibile pe merchant dashboard
- [ ] UI: Badge-uri vizibile pe product cards (pentru consumatori)
- [ ] UI: Admin — Gestionare badge-uri (override auditat)

### Sprint D — Admin & Audit
- [ ] Server: Audit logs query (filtrare, paginare, export)
- [ ] UI: Admin Marketplace Dashboard (statistici globale)
- [ ] UI: Admin Stores management (status, suspendare)
- [ ] UI: Admin Audit Logs viewer (read-only, filtrable)
- [ ] UI: Admin Financial reports (comisioane, escrow)
- [ ] Server: Phantom mode (admin acces cont user, logat separat)

### Sprint E — Integrare B2B & API
- [ ] Server: Logistic API endpoints (delivery request, status, cancel, estimate)
- [ ] Server: API key generation + validation
- [ ] Server: Webhook notifications
- [ ] UI: Merchant API Integration screen (doar tip external)
- [ ] UI: API documentation in-app
- [ ] Server: Redirect controlat (card partener → magazin extern)

---

## 8. Ce NU Implementăm (Conform Documentelor Canonice)

| Element | Motiv Excludere |
|---------|-----------------|
| Marketplace public browsable în app | Canonic: "NU există în aplicație" |
| Buton "Comandă acum" / "Livrare instant" | Strict interzis (07.X.1) |
| Estimări timp garantate | Interzis — doar informativ |
| Checkout complet în app | Marketplace = site, app = execuție |
| Licitații / negociere preț | Marketplace controlat, preț fix |
| Rating public performanță livrare | Interzis (07.X.1) |
| Tracking live drone pe hartă | Interzis în marketplace |
| Comparații cu curieri | Interzis (07.X.1) |

---

## 9. Dependențe și Riscuri

| Risc | Mitigare |
|------|----------|
| Complexitate trust score calculation | Implementare incrementală, inițial simplificat |
| Escrow financiar necesită integrare plăți | Faza 1: simulare/mock, Faza 2: integrare reală |
| Logistic API necesită documentație externă | Widget/SDK documentat în app, implementare completă ulterior |
| Zonare necesită date geografice | Utilizare zone definite manual inițial |

---

## 10. Concluzie

Acest plan respectă integral documentele canonice DROPi, rezolvă conflictele de logică identificate, și include toate upgrade-urile relevante descoperite în arhivă. Implementarea se face în 5 sprinturi, de la fundație la integrare B2B, cu audit complet și badge-uri funcționale.

**Aștept confirmarea ta pentru a începe implementarea Sprint A.**
