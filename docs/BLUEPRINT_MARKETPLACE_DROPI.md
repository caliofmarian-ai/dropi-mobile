# BLUEPRINT — Marketplace DROPi

**Autor:** Manus AI  
**Versiune:** 1.0.0  
**Data:** 28 Iunie 2026  
**Clasificare:** Document Intern — Blueprint Tehnic  
**Status:** Propunere pentru Aprobare

---

## Cuprins

1. [Viziune și Scop](#1-viziune-și-scop)
2. [Principii Arhitecturale Canonice](#2-principii-arhitecturale-canonice)
3. [Taxonomia Participanților](#3-taxonomia-participanților)
4. [Arhitectura Sistemului](#4-arhitectura-sistemului)
5. [Modele de Date](#5-modele-de-date)
6. [Stratul 1 — Dashboard Comerciant](#6-stratul-1--dashboard-comerciant)
7. [Stratul 2 — Sistem de Încredere și Badge-uri](#7-stratul-2--sistem-de-încredere-și-badge-uri)
8. [Stratul 3 — Moderare și Reguli de Publicare](#8-stratul-3--moderare-și-reguli-de-publicare)
9. [Stratul 4 — Integrare Parteneri B2B (C2 Mari)](#9-stratul-4--integrare-parteneri-b2b-c2-mari)
10. [Stratul 5 — Dashboard-uri Admin și RBAC](#10-stratul-5--dashboard-uri-admin-și-rbac)
11. [Stratul 6 — Audit și Conformitate](#11-stratul-6--audit-și-conformitate)
12. [Stratul 7 — Fluxuri Financiare](#12-stratul-7--fluxuri-financiare)
13. [Stratul 8 — Badge-uri Livrare Multimodală](#13-stratul-8--badge-uri-livrare-multimodală)
14. [Conflicte de Logică și Rezolvări](#14-conflicte-de-logică-și-rezolvări)
15. [Excluderi Explicite](#15-excluderi-explicite)
16. [Plan de Execuție (Sprinturi)](#16-plan-de-execuție-sprinturi)
17. [Dependențe și Riscuri](#17-dependențe-și-riscuri)
18. [Referințe Canonice](#18-referințe-canonice)

---

## 1. Viziune și Scop

Acest Blueprint definește arhitectura completă, modelele de date, fluxurile operaționale, regulile de afaceri și specificațiile tehnice pentru implementarea funcționalităților marketplace în ecosistemul DROPi. Documentul servește drept sursă unică de adevăr pentru toate deciziile de implementare legate de marketplace și este construit exclusiv pe baza documentelor canonice din arhiva proiectului.

Scopul principal este de a oferi comercianților (parteneri C2) un **panel de administrare** complet în aplicația mobilă DROPi, prin care aceștia pot gestiona catalogul de produse, procesa comenzile primite, vizualiza analytics-ul magazinului și, în cazul partenerilor mari, configura integrarea API pentru livrare DROPi în magazinul lor extern. Totodată, Blueprint-ul definește sistemul de badge-uri și încredere, responsabilitățile fiecărui rol admin în contextul marketplace-ului, și cerințele de audit complet conform Capitolului 12 din documentele canonice.

---

## 2. Principii Arhitecturale Canonice

Următoarele principii sunt **non-negociabile** și derivă direct din documentele canonice:

> **Principiul 1 — Separarea Marketplace de Aplicație.** Marketplace-ul (stratul de ofertă publică, browsable) există exclusiv pe SITE-ul web DROPi. Aplicația mobilă operează cu COMENZI VALIDATE și funcții de administrare. Aplicația NU afișează listări comerciale publice și NU permite browsing de ofertă. [1]

> **Principiul 2 — Marketplace Controlat.** Nu orice produs poate fi listat, nu orice utilizator poate lista nelimitat, vizibilitatea nu poate fi cumpărată. Marketplace-ul DROPi este un ecosistem reglementat, nu un marketplace liber. [2]

> **Principiul 3 — Separare B2B de B2C.** Partenerii B2B mari (supermarketuri, lanțuri) NU listează produse individuale în marketplace-ul public. Ei operează prin canale B2B separate, cu integrare API. [3]

> **Principiul 4 — Badge-uri ca Indicator, nu Garanție.** Badge-urile de încredere reprezintă un indicator de reputație bazat pe date reale, nu o certificare sau garanție a calității produsului. DROPi nu validează calitatea produselor. [2]

> **Principiul 5 — Audit Total.** Toate acțiunile din marketplace sunt logate, imutabile, corelate și accesibile autorităților de audit. Acțiunile AI sunt marcate distinct cu "AI personal". [4]

> **Principiul 6 — Fiecare cont are dashboard propriu.** Separare clară între tipurile de conturi, cu funcționalități, permisiuni și limitări distincte per rol. Interoperabilitate fără haos. [5]

**Reconciliere cu cererea utilizatorului:** Dashboard-ul comercianților în aplicația mobilă este un **panel de administrare catalog** (gestionare produse, comenzi primite, analytics), nu un marketplace public browsable. Comerciantul își gestionează produsele din aplicație, iar afișarea publică este pe site-ul web.

---

## 3. Taxonomia Participanților

Marketplace-ul DROPi face o delimitare explicită între categoriile de utilizatori care pot participa la activitatea comercială. Această delimitare este comunicată clar către consumatori și aplicată prin reguli distincte.

| Categorie | Descriere | Regim Juridic | Listare | Limite |
|-----------|-----------|---------------|---------|--------|
| **Comercianți B2C** | Magazine locale, restaurante, producători autorizați | Autorizat comercial | Marketplace public | Nelimitat (conform licenței) |
| **Artizani** | Producători individuali, serii mici, handmade | Semi-autorizat | Marketplace public | Limitat numeric |
| **P2P** | Persoane fizice, livrări private | Neautorizat | NU în marketplace | 1-3 active, non-comercial |
| **Selleri Comunitari** | Neautorizați, în tranziție spre autorizare | Neautorizat | Marketplace public | Limitat numeric + temporal |
| **Parteneri B2B Mari** | Supermarketuri, lanțuri, retaileri | Autorizat B2B | Canale B2B SEPARATE | Card partener + redirect |

Fiecare categorie are reguli distincte de publicare, limite de listare, și obligații diferite față de sistemul de badge-uri. Sellerii comunitari sunt **obligați** să afișeze nivelul de încredere și nu pot publica fără badge vizibil. Livrările P2P nu sunt listate în marketplace, nu sunt browsable, și nu au caracter comercial.

---

## 4. Arhitectura Sistemului

### 4.1 Diagrama de Nivel Înalt

```
┌─────────────────────────────────────────────────────────────────┐
│                    SITE WEB DROPi (Marketplace Public)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Listări  │  │ Categorii│  │ Badge-uri│  │ Card Partener │  │
│  │ Produse  │  │ & Filtre │  │ Vizibile │  │ B2B (Redirect)│  │
│  └────┬─────┘  └──────────┘  └──────────┘  └───────────────┘  │
└───────┼─────────────────────────────────────────────────────────┘
        │ Cerere Validată
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              APLICAȚIA MOBILĂ DROPi (CORE Operațional)           │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │   Dashboard    │  │   Dashboard    │  │   Dashboard      │  │
│  │   Comerciant   │  │   Admin        │  │   Delivery       │  │
│  │                │  │                │  │   Partner         │  │
│  │ • Catalog      │  │ • Moderare     │  │                  │  │
│  │ • Comenzi      │  │ • Badge-uri    │  │ • Misiuni        │  │
│  │ • Analytics    │  │ • Audit Logs   │  │ • Livrări        │  │
│  │ • API Config   │  │ • Financial    │  │ • Status         │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              STRATUL DE AUDIT (Imutabil, Cap. 12)           │  │
│  │  Log_ID | Timestamp | Actor | Action | Entity | Details    │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              LOGISTIC API (Parteneri B2B Externi)                 │
│  POST /delivery/request │ GET /status │ Webhooks                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Fluxul Datelor

Fluxul principal al datelor în contextul marketplace-ului urmează o direcție clară: comerciantul publică produse prin dashboard-ul din aplicație, produsele trec prin moderare (automată + manuală), sunt afișate pe site-ul web (marketplace public), clientul inițiază o cerere de pe site, cererea validată ajunge în aplicație ca o comandă, comerciantul o procesează, iar livrarea este orchestrată de DROPi.

```
Comerciant (App) → Produs (Draft) → Moderare → Aprobare → Site (Public)
                                                              │
Client (Site) → Cerere → Validare → Comandă (App) → Comerciant → Livrare
```

---

## 5. Modele de Date

### 5.1 Tabela `stores` — Magazine

Reprezintă entitatea comercială a unui partener în ecosistemul DROPi.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | UUID | Da | Identificator unic |
| `ownerId` | UUID (FK → users) | Da | Proprietarul magazinului |
| `name` | VARCHAR(200) | Da | Numele magazinului |
| `description` | TEXT | Da | Descriere detaliată |
| `logoUrl` | VARCHAR(500) | Nu | URL logo magazin |
| `coverImageUrl` | VARCHAR(500) | Nu | Imagine de copertă |
| `type` | ENUM('internal', 'external') | Da | Tip magazin |
| `externalUrl` | VARCHAR(500) | Nu | URL magazin extern (doar tip external) |
| `apiKey` | VARCHAR(64) | Nu | Cheie API unică (doar tip external) |
| `webhookUrl` | VARCHAR(500) | Nu | URL webhook notificări |
| `zone` | VARCHAR(100) | Da | Zona operațională |
| `category` | VARCHAR(100) | Da | Categoria principală |
| `status` | ENUM('pending', 'active', 'suspended', 'closed') | Da | Status magazin |
| `trustScore` | INTEGER (0-100) | Da | Scor de încredere calculat |
| `totalOrders` | INTEGER | Da | Total comenzi procesate |
| `totalReviews` | INTEGER | Da | Total evaluări primite |
| `createdAt` | TIMESTAMP | Da | Data creării |
| `updatedAt` | TIMESTAMP | Da | Ultima actualizare |
| `suspendedAt` | TIMESTAMP | Nu | Data suspendării (dacă e cazul) |
| `suspensionReason` | TEXT | Nu | Motivul suspendării |

### 5.2 Tabela `products` — Produse

Fiecare produs listat în marketplace-ul DROPi, gestionat de comerciant prin dashboard-ul din aplicație.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | UUID | Da | Identificator unic |
| `storeId` | UUID (FK → stores) | Da | Magazinul care deține produsul |
| `name` | VARCHAR(300) | Da | Numele produsului |
| `description` | TEXT | Da | Descriere detaliată |
| `price` | DECIMAL(10,2) | Da | Preț fix (fără negociere) |
| `currency` | VARCHAR(3) | Da | Moneda (RON, EUR, etc.) |
| `images` | JSON (array URLs) | Da | Imagini produs (min. 1, max. 10) |
| `category` | VARCHAR(100) | Da | Categoria produsului |
| `subcategory` | VARCHAR(100) | Nu | Subcategoria |
| `weight` | DECIMAL(8,2) | Da | Greutate în grame |
| `dimensions` | JSON ({l, w, h}) | Da | Dimensiuni în cm |
| `deliveryModes` | JSON (array) | Da | Moduri livrare eligibile (calculat automat) |
| `cancellationPolicy` | JSON | Da | Politică anulare per stare |
| `stock` | INTEGER | Nu | Stoc disponibil (null = nelimitat) |
| `zone` | VARCHAR(100) | Da | Zona de disponibilitate |
| `status` | ENUM('draft', 'pending_review', 'approved', 'rejected', 'suspended') | Da | Status publicare |
| `moderationNote` | TEXT | Nu | Nota moderatorului (la reject/suspend) |
| `moderatedBy` | UUID (FK → users) | Nu | Cine a moderat |
| `moderatedAt` | TIMESTAMP | Nu | Când a fost moderat |
| `isActive` | BOOLEAN | Da | Vizibil în marketplace (doar dacă approved + active store) |
| `viewCount` | INTEGER | Da | Număr vizualizări |
| `orderCount` | INTEGER | Da | Număr comenzi |
| `createdAt` | TIMESTAMP | Da | Data creării |
| `updatedAt` | TIMESTAMP | Da | Ultima actualizare |

**Structura `cancellationPolicy` (JSON):**

```json
{
  "CREATED": { "refundable": true, "refundPercent": 100, "destination": "original_method" },
  "SCHEDULED": { "refundable": true, "refundPercent": 90, "destination": "wallet" },
  "PREPARING": { "refundable": true, "refundPercent": 50, "destination": "wallet" },
  "READY": { "refundable": false, "refundPercent": 0, "destination": null },
  "IN_DELIVERY": { "refundable": false, "refundPercent": 0, "destination": null }
}
```

### 5.3 Tabela `product_reviews` — Evaluări Post-Livrare

Evaluările sunt colectate exclusiv după livrarea confirmată și nu pot fi modificate sau șterse de seller.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | UUID | Da | Identificator unic |
| `productId` | UUID (FK → products) | Da | Produsul evaluat |
| `storeId` | UUID (FK → stores) | Da | Magazinul (denormalizat pentru query) |
| `orderId` | UUID | Da | Comanda asociată (1 review per comandă) |
| `userId` | UUID (FK → users) | Da | Clientul care evaluează |
| `overallRating` | INTEGER (1-5) | Da | Rating general |
| `qualityRating` | INTEGER (1-5) | Da | Calitate produs vs. descriere |
| `comment` | TEXT | Nu | Comentariu text |
| `isVerifiedPurchase` | BOOLEAN | Da | Achiziție verificată (întotdeauna true) |
| `createdAt` | TIMESTAMP | Da | Data evaluării |

### 5.4 Tabela `seller_badges` — Badge-uri Comercianți

Badge-urile sunt atribuite automat pe baza datelor și nu pot fi modificate manual decât prin override auditat de Admin Sistem.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | UUID | Da | Identificator unic |
| `storeId` | UUID (FK → stores) | Da | Magazinul |
| `type` | ENUM('high_trust', 'new_activity', 'high_risk', 'restricted') | Da | Tipul badge-ului |
| `reason` | TEXT | Da | Motivul atribuirii (generat automat sau manual) |
| `isActive` | BOOLEAN | Da | Badge activ |
| `issuedAt` | TIMESTAMP | Da | Data emiterii |
| `expiresAt` | TIMESTAMP | Nu | Data expirării (null = permanent) |
| `overriddenBy` | UUID (FK → users) | Nu | Admin care a făcut override (dacă e cazul) |
| `overrideReason` | TEXT | Nu | Justificarea override-ului |

### 5.5 Tabela `delivery_badges` — Badge-uri Livrare per Produs

Calculat automat pe baza greutății, dimensiunilor și zonei de disponibilitate a produsului.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | UUID | Da | Identificator unic |
| `productId` | UUID (FK → products) | Da | Produsul |
| `mode` | ENUM('drone', 'terrestrial', 'multimodal') | Da | Modul de livrare |
| `isEligible` | BOOLEAN | Da | Eligibil pentru acest mod |
| `conditions` | TEXT | Nu | Condiții speciale |
| `calculatedAt` | TIMESTAMP | Da | Ultima recalculare |

### 5.6 Tabela `audit_logs` — Log-uri Audit Marketplace

Conform Capitolului 12 din documentele canonice, toate acțiunile sunt logate imutabil.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | UUID | Da | Log_ID unic |
| `timestamp` | TIMESTAMP (UTC) | Da | Momentul acțiunii |
| `actorId` | UUID (FK → users) | Da | Cine a efectuat acțiunea |
| `actorRole` | VARCHAR(50) | Da | Rolul actorului la momentul acțiunii |
| `actorType` | ENUM('human', 'ai', 'system') | Da | Tipul actorului |
| `aiEntityId` | VARCHAR(100) | Nu | ID-ul agentului AI (dacă actorType = 'ai') |
| `action` | VARCHAR(100) | Da | Acțiunea efectuată |
| `entityType` | VARCHAR(50) | Da | Tipul entității afectate (store, product, badge, etc.) |
| `entityId` | UUID | Da | ID-ul entității afectate |
| `details` | JSON | Da | Detalii complete (before/after state) |
| `ipAddress` | VARCHAR(45) | Nu | Adresa IP a actorului |
| `deviceInfo` | VARCHAR(200) | Nu | Informații dispozitiv |
| `severity` | ENUM('info', 'warning', 'critical') | Da | Severitatea |
| `isPhantomMode` | BOOLEAN | Da | Dacă acțiunea a fost în phantom mode |
| `phantomAdminId` | UUID | Nu | Admin-ul care era în phantom mode |

### 5.7 Tabela `store_analytics` — Statistici Agregate

Statistici pre-calculate pentru performanța dashboard-ului comerciantului.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | UUID | Da | Identificator unic |
| `storeId` | UUID (FK → stores) | Da | Magazinul |
| `period` | VARCHAR(10) | Da | Perioada (YYYY-MM-DD sau YYYY-MM) |
| `periodType` | ENUM('daily', 'monthly') | Da | Tipul perioadei |
| `totalOrders` | INTEGER | Da | Total comenzi |
| `completedOrders` | INTEGER | Da | Comenzi finalizate |
| `cancelledOrders` | INTEGER | Da | Comenzi anulate |
| `avgRating` | DECIMAL(3,2) | Da | Rating mediu |
| `revenue` | DECIMAL(12,2) | Da | Venituri brute |
| `commissionPaid` | DECIMAL(12,2) | Da | Comision plătit DROPi |
| `refundsIssued` | DECIMAL(12,2) | Da | Refund-uri emise |
| `newReviews` | INTEGER | Da | Evaluări noi |
| `productViews` | INTEGER | Da | Vizualizări produse |
| `calculatedAt` | TIMESTAMP | Da | Ultima calculare |

---

## 6. Stratul 1 — Dashboard Comerciant

### 6.1 Ecrane și Funcționalități

Dashboard-ul comerciantului este panoul de administrare prin care partenerii C2 își gestionează activitatea comercială în ecosistemul DROPi. Acesta este accesibil exclusiv utilizatorilor cu rol de "merchant" sau "partner" și oferă o viziune completă asupra magazinului, produselor, comenzilor și performanței.

| Ecran | Rută | Funcționalitate Principală |
|-------|------|---------------------------|
| Dashboard Principal | `/merchant` | Statistici zilnice, comenzi noi, trust score, badge-uri active, alerte |
| Configurare Magazin | `/merchant/store-setup` | Creare/editare magazin, tip (intern/extern), logo, zonă, categorie |
| Lista Produse | `/merchant/products` | Toate produsele cu filtru per status, căutare, sortare |
| Produs Nou | `/merchant/products/new` | Formular creare produs cu toate câmpurile obligatorii |
| Detalii Produs | `/merchant/products/[id]` | Vizualizare/editare produs, status, badge-uri livrare, reviews |
| Comenzi | `/merchant/orders` | Comenzi primite, accept/pregătire/finalizare, istoric |
| Analytics | `/merchant/analytics` | Grafice venituri, evaluări, performanță, comparație perioade |
| Integrare API | `/merchant/api-integration` | (doar external) API key, webhook config, documentație, test |

### 6.2 Dashboard Principal — Componente

Ecranul principal al comerciantului afișează un rezumat operațional complet:

**Secțiunea Header:**
- Numele magazinului + logo
- Trust Score (indicator vizual 0-100)
- Badge-uri active (vizibile, colorate conform tipului)
- Status magazin (active/pending/suspended)

**Secțiunea Statistici Rapide (carduri):**
- Comenzi astăzi / Comenzi în așteptare
- Venituri luna curentă
- Rating mediu (ultimele 30 zile)
- Produse active / Produse pending review

**Secțiunea Comenzi Recente:**
- Lista ultimelor 5 comenzi cu status
- Buton "Vezi toate comenzile"

**Secțiunea Alerte:**
- Produse respinse (necesită atenție)
- Badge-uri noi emise
- Notificări de la admin

### 6.3 Configurare Magazin

Formularul de configurare a magazinului diferă în funcție de tipul ales:

**Câmpuri comune (ambele tipuri):**
- Numele magazinului (obligatoriu, max 200 caractere)
- Descriere (obligatoriu, min 50 caractere)
- Logo (upload imagine, recomandat 512x512)
- Imagine copertă (upload, recomandat 1200x400)
- Zona operațională (selectare din listă predefinită)
- Categoria principală (selectare din categorii aprobate)

**Câmpuri specifice tip `internal`:**
- Program de lucru (ore deschidere/închidere per zi)
- Adresa fizică (opțional, pentru pickup)
- Telefon contact (obligatoriu)

**Câmpuri specifice tip `external`:**
- URL magazin extern (obligatoriu, validat)
- URL webhook pentru notificări (obligatoriu)
- Descriere integrare (cum funcționează livrarea)
- API key (generat automat, afișat o singură dată)

### 6.4 Formular Produs Nou

Crearea unui produs nou respectă strict regulile de publicare din Anexa 6B. Formularul este structurat în secțiuni:

**Secțiunea 1 — Informații de Bază:**
- Numele produsului (obligatoriu, max 300 caractere)
- Descriere detaliată (obligatoriu, min 100 caractere)
- Preț fix (obligatoriu, numeric, fără negociere)
- Moneda (RON implicit, selectabil)
- Categoria (obligatoriu, din lista aprobată)
- Subcategoria (opțional)

**Secțiunea 2 — Imagini:**
- Minimum 1 imagine, maximum 10
- Format acceptat: JPG, PNG, WebP
- Dimensiune minimă: 600x600px
- Prima imagine = imagine principală

**Secțiunea 3 — Specificații Fizice (pentru calculul badge-urilor livrare):**
- Greutate în grame (obligatoriu)
- Dimensiuni: lungime x lățime x înălțime în cm (obligatoriu)
- Ambalare specială necesară (da/nu)
- Fragil (da/nu)

**Secțiunea 4 — Politică de Anulare (OBLIGATORIE):**
- Per fiecare stare a comenzii (CREATED, SCHEDULED, PREPARING, READY, IN_DELIVERY):
  - Refund permis: Da/Nu
  - Procent refund: 0-100%
  - Destinație sumă: metoda originală / portofel DROPi

**Secțiunea 5 — Disponibilitate:**
- Zona de disponibilitate (moștenită de la magazin, editabilă)
- Stoc (opțional, null = nelimitat)
- Disponibil de la / până la (opțional, pentru produse sezoniere)

După completare, produsul intră în status `pending_review` și este trimis la moderare.

---

## 7. Stratul 2 — Sistem de Încredere și Badge-uri

### 7.1 Filosofia Sistemului

Sistemul de încredere DROPi are rol **informativ și preventiv**, nu rol de certificare sau garantare. DROPi nu validează calitatea produselor și nu efectuează inspecții sanitare sau comerciale. În schimb, platforma colectează evaluări reale de la consumatori, monitorizează comportamentul post-livrare și identifică tipare de risc sau neconformitate.

### 7.2 Calculul Trust Score

Trust Score-ul este un indicator numeric (0-100) calculat automat pe baza a 5 componente ponderate. Calculul se efectuează la fiecare eveniment relevant (nouă evaluare, nouă reclamație, anulare) și printr-un job periodic (zilnic).

| Componentă | Pondere | Formula |
|------------|---------|---------|
| Evaluări post-livrare | 35% | (suma_rating / max_posibil) × 100 |
| Calitate vs. descriere | 20% | (quality_ratings_pozitive / total) × 100 |
| Rata comenzi finalizate | 20% | (completate / total_comenzi) × 100 |
| Conformitate reguli | 15% | 100 - (penalizări_active × 10) |
| Absența reclamațiilor | 10% | 100 - (reclamații_validate / total_comenzi × 100) |

**Reguli de calcul:**
- Minimum 3 comenzi completate pentru a avea un scor valid (altfel: badge "Activitate Nouă")
- Scorul este media ponderată a celor 5 componente
- Scorul nu poate fi modificat manual (doar prin override auditat de Admin Sistem)
- Recalculare la fiecare eveniment + job zilnic de reconciliere

### 7.3 Badge-uri Seller

Badge-urile sunt atribuite automat pe baza Trust Score-ului și a comportamentului. Ele sunt vizibile public pe fiecare card de produs și pe pagina magazinului.

| Badge | Condiție de Atribuire | Condiție de Revocare | Vizibilitate |
|-------|----------------------|---------------------|--------------|
| **Încredere Ridicată** (verde) | Trust Score ≥ 85 AND comenzi ≥ 20 AND 0 reclamații validate în ultimele 90 zile | Trust Score < 80 SAU reclamație validată | Public, pe card produs + pagina magazin |
| **Activitate Nouă** (albastru) | Comenzi completate < 5 | Comenzi completate ≥ 5 | Public, informativ |
| **Risc Crescut** (galben) | Trust Score < 40 SAU ≥ 3 reclamații validate în ultimele 30 zile | Trust Score ≥ 50 AND 0 reclamații în ultimele 30 zile | Public, avertisment vizibil |
| **Restricționat** (roșu) | Suspendare activă (automată sau manuală) | Reactivare de către Admin | Public, produse invizibile |

**Reguli badge-uri:**
- Un magazin poate avea UN SINGUR badge activ la un moment dat (cel cu prioritatea cea mai mare)
- Prioritate: Restricționat > Risc Crescut > Activitate Nouă > Încredere Ridicată
- Badge-urile sunt actualizate dinamic și imposibil de eliminat/ascuns de seller
- Override manual posibil DOAR de Admin Sistem, cu justificare obligatorie (logată în audit)

### 7.4 Mecanism de Eliminare Naturală

Sistemul aplică măsuri progresive automate bazate pe date, fără intervenție umană:

| Nivel | Condiție | Acțiune Automată | Reversibilitate |
|-------|----------|------------------|-----------------|
| 1 — Avertisment | Trust Score < 40 timp de 7 zile | Notificare seller + badge "Risc Crescut" | Automată la îmbunătățire scor |
| 2 — Limitare | Trust Score < 30 timp de 30 zile | Reducere vizibilitate produse (nu apar în primele rezultate) | Automată la scor ≥ 50 |
| 3 — Suspendare | ≥ 3 raportări neconformitate validate SAU Trust Score < 20 | Suspendare temporară (30 zile), produse invizibile | Reactivare manuală Admin |
| 4 — Eliminare | Încălcări siguranță SAU suspendare repetată (≥ 3) | Eliminare acces marketplace | Apel posibil, decizie Owner |

---

## 8. Stratul 3 — Moderare și Reguli de Publicare

### 8.1 Fluxul de Moderare

Fiecare produs nou sau modificat semnificativ trece printr-un proces de moderare în două etape:

**Etapa 1 — Moderare Automată (instant):**
- Verificare câmpuri obligatorii completate
- Verificare dimensiuni/greutate în limite acceptabile
- Verificare preț > 0 și format corect
- Verificare imagini (min 1, format valid, dimensiune minimă)
- Verificare politică anulare completă (toate stările definite)
- Verificare limită listări (pentru selleri comunitari: max 3 active)
- Verificare cuvinte interzise în titlu/descriere

**Etapa 2 — Moderare Manuală (Operator Zonal sau Admin):**
- Verificare conținut imagini (adecvat, real, nu stock generic)
- Verificare descriere (corespunde cu imaginile, nu este înșelătoare)
- Verificare categorie (corect atribuită)
- Verificare conformitate cu regulile zonei
- Decizie: Aprobare / Respingere (cu motivație obligatorie)

### 8.2 Reguli de Publicare (Conform Anexa 6B)

| Regulă | Descriere | Consecință Încălcare |
|--------|-----------|---------------------|
| Preț fix obligatoriu | Fără negociere, licitații, "preț la cerere" | Respingere automată |
| Politică anulare completă | Definită per FIECARE stare a comenzii | Respingere automată |
| Greutate și dimensiuni reale | Nu estimative, nu "aproximativ" | Respingere + avertisment |
| Imagini reale ale produsului | Nu stock, nu generate AI, nu ale altui produs | Respingere + penalizare scor |
| Descriere fidelă | Corespunde cu produsul real livrat | Reclamație → penalizare scor |
| Categorie corectă | Produsul aparține categoriei selectate | Respingere |
| Limite listare respectate | Selleri comunitari: max 3 active simultan | Blocare automată |
| Zona corectă | Produsul disponibil doar în zona declarată | Respingere |

### 8.3 Status-uri Produs și Tranziții

```
Draft ──→ Pending Review ──→ Approved ──→ [Active în marketplace]
                │                │
                ▼                ▼
            Rejected        Suspended
                │                │
                ▼                ▼
        [Editare] ──→ Pending Review    [Reactivare Admin]
```

---

## 9. Stratul 4 — Integrare Parteneri B2B (C2 Mari)

### 9.1 Modelul de Integrare

Partenerii B2B mari (supermarketuri, lanțuri, retaileri cu magazin extern propriu) nu listează produse individuale în marketplace-ul public DROPi. În schimb, ei beneficiază de două moduri de integrare:

**Model A — Logistic API (Principal):**
Clientul comandă pe platforma partenerului. La checkout, apare opțiunea "Livrare prin DROPi". Partenerul transmite cererea de livrare către DROPi prin API. DROPi orchestrează livrarea complet (alocare pilot, mod transport, rută, tracking).

**Model B — Redirect Controlat:**
Marketplace-ul public DROPi afișează un Card de Partener (logo, descriere, categorie, badge-uri). Clientul este redirecționat către platforma partenerului. DROPi nu gestionează comanda produsului, doar livrarea (dacă partenerul folosește Logistic API).

### 9.2 Specificații Logistic API

**Autentificare:** API Key unic per partener, transmis în header `X-DROPi-API-Key`.

**Endpoint-uri:**

| Endpoint | Metodă | Descriere |
|----------|--------|-----------|
| `/api/v1/delivery/request` | POST | Inițiere cerere livrare |
| `/api/v1/delivery/:id/status` | GET | Interogare status |
| `/api/v1/delivery/:id/cancel` | POST | Anulare cerere |
| `/api/v1/delivery/estimate` | POST | Estimare (informativă, non-contractuală) |
| `/api/v1/delivery/:id/tracking` | GET | URL tracking (pentru clientul final) |

**Payload cerere livrare:**

```json
{
  "externalOrderId": "PARTNER-ORD-12345",
  "pickup": {
    "address": "Str. Exemplu 10, București",
    "contactName": "Depozit Central",
    "contactPhone": "+40700000000",
    "readyAt": "2026-06-28T14:00:00Z"
  },
  "delivery": {
    "address": "Str. Destinație 5, București",
    "contactName": "Ion Popescu",
    "contactPhone": "+40711111111",
    "notes": "Etaj 3, interfon 12"
  },
  "package": {
    "weight": 2500,
    "dimensions": { "l": 30, "w": 20, "h": 15 },
    "fragile": false,
    "description": "Produse alimentare"
  },
  "preferences": {
    "preferredMode": "terrestrial",
    "urgency": "standard"
  }
}
```

**Webhook notificări (trimise de DROPi către partener):**

```json
{
  "event": "delivery.status_changed",
  "deliveryId": "dropi-del-uuid",
  "externalOrderId": "PARTNER-ORD-12345",
  "newStatus": "in_transit",
  "timestamp": "2026-06-28T14:30:00Z",
  "details": {
    "estimatedArrival": "2026-06-28T15:00:00Z",
    "trackingUrl": "https://track.dropi.app/del-uuid"
  }
}
```

### 9.3 Ecranul API Integration (în app, doar tip external)

Comercianții cu magazin de tip `external` au acces la un ecran dedicat de configurare API:

- Vizualizare API Key (ascuns parțial, buton "Arată"/"Copiază")
- Regenerare API Key (cu confirmare, invalidează cheia veche)
- Configurare Webhook URL (cu buton "Test Webhook")
- Documentație API inline (endpoint-uri, exemple, coduri eroare)
- Istoric apeluri API (ultimele 50, cu status și response time)
- Status integrare (activ/inactiv, ultimul apel reușit)

---

## 10. Stratul 5 — Dashboard-uri Admin și RBAC

### 10.1 Matrice RBAC Marketplace

Fiecare rol admin are responsabilități și permisiuni distincte în contextul marketplace-ului. Separarea este strictă și auditată.

| Permisiune | Owner | Admin Sistem | Operator Zonal | Auditor |
|------------|-------|--------------|----------------|---------|
| Vizualizare statistici globale marketplace | Da | Da | Zona proprie | Da (read-only) |
| Moderare produse (approve/reject) | Da | Da | Zona proprie | Nu |
| Suspendare/reactivare magazin | Da | Da | Nu | Nu |
| Override badge-uri (cu justificare) | Da | Da | Nu | Nu |
| Gestionare categorii produse | Da | Da | Nu | Nu |
| Vizualizare audit logs | Da | Da | Zona proprie | Da (complet) |
| Export audit logs | Da | Nu | Nu | Da |
| Rapoarte financiare | Da | Nu | Nu | Da |
| Phantom mode (acces cont user) | Da | Da | Nu | Nu |
| Configurare reguli marketplace | Da | Da | Nu | Nu |
| Eliminare acces marketplace | Da | Da (cu aprobare Owner) | Nu | Nu |
| Acces log-uri autorități | Da | Nu | Nu | Da |

### 10.2 Ecrane Admin Marketplace

| Ecran | Rută | Roluri Acces | Funcționalitate |
|-------|------|--------------|-----------------|
| Dashboard Marketplace | `/admin/marketplace` | Owner, Admin, Operator, Auditor | Statistici globale, produse pending, alerte |
| Moderare Produse | `/admin/marketplace/products` | Owner, Admin, Operator | Lista produse pending, approve/reject cu motivație |
| Gestionare Magazine | `/admin/marketplace/stores` | Owner, Admin | Lista magazine, status, suspendare, badge-uri |
| Audit Logs | `/admin/marketplace/audit-logs` | Owner, Auditor | Vizualizare log-uri imutabile, filtrare, export |
| Categorii | `/admin/marketplace/categories` | Owner, Admin | CRUD categorii, subcategorii, reguli per categorie |
| Rapoarte Financiare | `/admin/marketplace/financial` | Owner, Auditor | Comisioane, escrow, venituri, refund-uri |
| Phantom Mode | `/admin/phantom` | Owner, Admin | Selectare user → vizualizare cont (logat separat) |

### 10.3 Phantom Mode — Specificații

Phantom Mode permite administratorilor să vizualizeze contul oricărui utilizator sau agent AI fără a se autentifica cu credențialele acestuia. Funcționalitatea este accesibilă direct din dashboard-ul admin, prin selectarea unui utilizator din listă.

**Reguli Phantom Mode:**
- Toate acțiunile efectuate în phantom mode sunt logate cu `isPhantomMode: true` și `phantomAdminId`
- Log-urile phantom mode sunt clar separate de acțiunile reale ale utilizatorului
- Admin-ul poate: vizualiza log-uri, acțiuni, comenzi, produse, badge-uri
- Admin-ul poate: bloca cont, citi mesaje (pentru audit), modifica status
- Admin-ul NU poate: modifica parola, șterge date, efectua tranzacții financiare

---

## 11. Stratul 6 — Audit și Conformitate

### 11.1 Principii de Audit (Cap. 12)

Sistemul de audit DROPi respectă următoarele principii fundamentale:

**Imutabilitate:** Log-urile nu pot fi modificate, șterse sau suprascrise de niciun rol operațional. Nici Owner-ul nu poate șterge log-uri.

**Corelabilitate:** Fiecare log este corelat cu entitățile relevante (Store_ID, Product_ID, Order_ID, User_ID) pentru a permite reconstruirea completă a unui flux.

**Timestamp UTC:** Toate log-urile folosesc UTC, indiferent de zona temporală a actorului.

**Acces rol-based:** Doar Owner și Auditor au acces complet la log-uri. Operator Zonal vede doar log-urile din zona sa.

**Marcaj AI:** Acțiunile efectuate de agenți AI sunt marcate cu semn distinct "AI personal" și includ ID-ul specific al agentului.

### 11.2 Acțiuni Logate în Marketplace

| Acțiune | Severitate | Detalii Capturate |
|---------|-----------|-------------------|
| `store.created` | info | Toate câmpurile magazinului |
| `store.updated` | info | Câmpuri modificate (before/after) |
| `store.suspended` | warning | Motivul, cine a suspendat |
| `store.reactivated` | info | Cine a reactivat, condiții |
| `product.created` | info | Toate câmpurile produsului |
| `product.submitted_for_review` | info | Product_ID, Store_ID |
| `product.approved` | info | Moderator_ID, notă |
| `product.rejected` | warning | Moderator_ID, motivație obligatorie |
| `product.suspended` | warning | Motiv, automat/manual |
| `product.updated` | info | Câmpuri modificate |
| `product.deleted` | warning | Motivul ștergerii |
| `badge.issued` | info | Tip badge, condiție, automat/manual |
| `badge.revoked` | info | Motiv revocare |
| `badge.overridden` | critical | Admin_ID, justificare obligatorie |
| `trust_score.recalculated` | info | Scor vechi → scor nou, componente |
| `trust_score.threshold_crossed` | warning | Prag depășit, acțiune declanșată |
| `moderation.auto_check` | info | Rezultat verificare automată |
| `phantom_mode.entered` | critical | Admin_ID, Target_User_ID |
| `phantom_mode.action` | critical | Ce acțiune a efectuat admin-ul |
| `phantom_mode.exited` | info | Durată sesiune |
| `api_key.generated` | info | Store_ID, hash parțial |
| `api_key.regenerated` | warning | Store_ID, motivul |
| `delivery.requested_via_api` | info | Partner_ID, detalii cerere |
| `financial.commission_calculated` | info | Sumă, procent, perioadă |
| `financial.escrow_released` | info | Sumă, destinatar |

### 11.3 Retenție și Export

Log-urile sunt reținute conform politicii de retenție (Anexa 12.B):
- Log-uri operaționale: 2 ani
- Log-uri financiare: 10 ani (conform legislației fiscale)
- Log-uri de securitate: 5 ani
- Export disponibil în format JSON și CSV pentru autorități

---

## 12. Stratul 7 — Fluxuri Financiare

### 12.1 Model A — Escrow DROPi (Implicit)

Modelul implicit și recomandat pentru toate tranzacțiile din marketplace. Clientul plătește DROPi, care reține fondurile până la confirmarea livrării, apoi eliberează către comerciant.

```
Client plătește → DROPi Escrow → Confirmare livrare → Eliberare către Comerciant
                      │
                      ├── Comision marketplace (X%)
                      ├── Taxă livrare
                      └── Taxe operaționale
```

**Componente reținute de DROPi:**
- Comision marketplace (procent configurat per categorie)
- Taxă livrare (calculată pe baza distanței, modului, greutății)
- Taxe operaționale (procesare plată, asigurare, etc.)

**Reguli Escrow:**
- Fondurile sunt eliberate la 24h după confirmarea livrării (perioadă de contestare)
- În caz de reclamație, fondurile rămân blocate până la rezolvare
- Refund-ul respectă politica de anulare definită per produs

### 12.2 Model B — Plată Directă (Exclusiv Comercianți Autorizați B2C)

Disponibil DOAR pentru comercianți autorizați cu licență comercială verificată. Clientul plătește direct comerciantul, DROPi facturează separat livrarea.

**Restricții:**
- DROPi NU garantează refund-ul produsului
- DROPi garantează DOAR livrarea
- Disponibil doar pentru comercianți cu Trust Score ≥ 80

### 12.3 Interziceri Financiare

| Interzis | Motiv |
|----------|-------|
| Plăți externalizate pentru artizani/P2P | Risc fiscal, lipsă audit |
| Plăți cash neînregistrate | Imposibil de auditat |
| Plăți off-platform | Eludare comision, risc client |
| Criptomonede | Reglementare insuficientă (în prezent) |
| Negociere preț | Marketplace controlat, preț fix |
| Licitații | Nu corespunde modelului DROPi |

---

## 13. Stratul 8 — Badge-uri Livrare Multimodală

### 13.1 Calculul Eligibilității

Badge-urile de livrare sunt calculate automat la crearea/modificarea produsului, pe baza specificațiilor fizice și a zonei de disponibilitate.

| Badge | Condiții Eligibilitate | Afișare |
|-------|----------------------|---------|
| **Eligibil Dronă** | Greutate ≤ 5000g AND dimensiuni max 40×30×20cm AND zona acoperită de DronePort AND nu este fragil (sau ambalare specială confirmată) | Pictogramă dronă pe card produs |
| **Terestru** | Orice produs, zona acoperită de flotă terestră | Pictogramă vehicul pe card produs |
| **Multimodal** | Zona cu DronePort + flotă terestră, transfer posibil | Pictogramă combinată pe card produs |

### 13.2 Reguli Badge-uri Livrare

Badge-urile de livrare sunt **indicative**, nu garantează metoda finală de livrare. Metoda efectivă este determinată la momentul orchestrării comenzii pe baza disponibilității, condițiilor meteo, și preferinței clientului.

**Important:** Conform documentelor canonice (07.X.1), este **strict interzis** să se afișeze:
- Estimări de timp de livrare garantate
- Promisiuni de cost fix de livrare
- Badge-uri "rapid", "garantat", "autonom"
- Comparații cu alte servicii de curierat

Badge-urile de livrare informează clientul despre **posibilitățile** de livrare, nu despre garanții.

---

## 14. Conflicte de Logică și Rezolvări

Pe parcursul analizei documentelor canonice, au fost identificate 5 conflicte potențiale de logică. Fiecare a fost rezolvat prin interpretare contextuală și aplicarea principiului ierarhiei documentelor (Anexa 6B > Cap. 08.X > Cap. 07.X.1).

| # | Conflict | Surse | Rezolvare Adoptată |
|---|----------|-------|-------------------|
| 1 | Marketplace în aplicație vs. "NU există în app" | Doc. 08.X vs. cerere utilizator | Dashboard = panel ADMINISTRARE (backend), nu marketplace public browsable. Comerciantul gestionează, nu browsează. |
| 2 | Rating public livrare interzis vs. badge-uri încredere obligatorii | Doc. 07.X.1 vs. Anexa 6B §3.5 | Badge-uri = reputație SELLER (permis). Interzis = rating performanță LIVRARE/curier/dronă. Sunt concepte diferite. |
| 3 | Parteneri C2 mari "în marketplace" | B2B_Partners vs. Anexa 6B | Card de partener + redirect (model B). NU listează produse individuale. Integrare prin Logistic API. |
| 4 | Estimări timp livrare interzise vs. API estimate | Doc. 07.X.1 vs. Logistic API | API returnează estimare marcată explicit "informativă, non-contractuală". NU se afișează ca SLA sau garanție. |
| 5 | Buton "Comandă acum" interzis vs. procesare comenzi în app | Doc. 07.X.1 vs. dashboard merchant | Interdicția se aplică marketplace-ului PUBLIC (site). În app, comerciantul are "Pregătește comanda" — funcție de administrare, nu de cumpărare. |

---

## 15. Excluderi Explicite

Următoarele funcționalități sunt **explicit excluse** din implementare, conform documentelor canonice:

| Element Exclus | Document Sursă | Motiv |
|----------------|----------------|-------|
| Marketplace public browsable în aplicația mobilă | Doc. 08.X | "Marketplace-ul NU există în aplicația DROPi" |
| Buton "Comandă acum" / "Livrare instant" / "Plătește" | Doc. 07.X.1 | Strict interzis în UI marketplace |
| Estimări timp garantate | Doc. 07.X.1 | Doar informativ, non-contractual |
| Checkout complet în aplicație | Doc. 08.X | Marketplace = site, app = execuție |
| Licitații / negociere preț | Anexa 6B | Marketplace controlat, preț fix |
| Rating public performanță livrare | Doc. 07.X.1 | Interzis (diferit de badge-uri seller) |
| Tracking live drone pe hartă în marketplace | Doc. 07.X.1 | Interzis în contextul marketplace |
| Comparații cu servicii de curierat | Doc. 07.X.1 | Strict interzis |
| Badge-uri "rapid", "garantat", "autonom" | Doc. 07.X.1 | Promisiuni interzise |
| Plăți în criptomonede | Financial_Flow | Reglementare insuficientă |
| White-label B2B (faza curentă) | B2B_Partners §4.3 | Marcat pentru implementare viitoare |
| AI Agent Pairing complet (faza curentă) | Knowledge base | Marcat pentru implementare viitoare |

---

## 16. Plan de Execuție (Sprinturi)

### Sprint A — Fundație (Prioritate Maximă)

**Obiectiv:** Crearea infrastructurii de bază: tabele DB, CRUD-uri server, audit middleware, și primele ecrane UI.

| Task | Tip | Descriere |
|------|-----|-----------|
| A.1 | DB | Creare tabele: `stores`, `products`, `product_reviews`, `seller_badges`, `delivery_badges`, `audit_logs`, `store_analytics` |
| A.2 | Server | CRUD Store: create, update, get, getMyStore, list (admin) |
| A.3 | Server | CRUD Products: create, update, delete, list (per store), get, changeStatus |
| A.4 | Server | Audit Log Middleware: interceptare automată toate mutațiile marketplace |
| A.5 | UI | Merchant Dashboard principal (statistici, comenzi recente, trust score) |
| A.6 | UI | Store Setup screen (formular creare/editare magazin, tip intern/extern) |

### Sprint B — Catalog și Moderare

**Obiectiv:** Implementarea regulilor de publicare, moderare automată + manuală, și ecranele de gestiune produse.

| Task | Tip | Descriere |
|------|-----|-----------|
| B.1 | Server | Validare reguli publicare (greutate, dimensiuni, categorie, politică anulare) |
| B.2 | Server | Moderare endpoint: approve/reject cu motivație obligatorie |
| B.3 | Server | Calcul automat badge-uri livrare per produs |
| B.4 | UI | Products list screen (filtru per status, căutare, sortare) |
| B.5 | UI | New Product screen (formular complet cu toate secțiunile) |
| B.6 | UI | Product Detail/Edit screen (cu badge-uri livrare, reviews, status) |
| B.7 | UI | Admin — Moderare produse (lista pending, approve/reject) |

### Sprint C — Trust și Badge-uri

**Obiectiv:** Implementarea completă a sistemului de încredere, badge-uri automate, și mecanism de eliminare naturală.

| Task | Tip | Descriere |
|------|-----|-----------|
| C.1 | Server | Calcul Trust Score (formula ponderată, recalculare la eveniment + job zilnic) |
| C.2 | Server | Logica atribuire badge-uri (automat, bazat pe reguli din §7.3) |
| C.3 | Server | Mecanism eliminare naturală (4 niveluri progresive) |
| C.4 | Server | Product Reviews: creare evaluare post-livrare, calcul impact scor |
| C.5 | UI | Badge-uri vizibile pe merchant dashboard (scor + badge activ) |
| C.6 | UI | Badge-uri vizibile pe product cards (pentru afișare pe site) |
| C.7 | UI | Admin — Gestionare badge-uri (override auditat cu justificare) |

### Sprint D — Admin și Audit

**Obiectiv:** Dashboard-uri admin complete cu responsabilități marketplace, audit logs viewer, phantom mode.

| Task | Tip | Descriere |
|------|-----|-----------|
| D.1 | Server | Audit logs query (filtrare multi-criteriu, paginare, export JSON/CSV) |
| D.2 | Server | Phantom mode (admin acces cont user, logat separat, restricții) |
| D.3 | UI | Admin Marketplace Dashboard (statistici globale, alerte, pending) |
| D.4 | UI | Admin Stores Management (lista magazine, status, suspendare) |
| D.5 | UI | Admin Audit Logs Viewer (read-only, filtrable, exportabil) |
| D.6 | UI | Admin Financial Reports (comisioane, escrow, venituri per perioadă) |
| D.7 | UI | Admin Categories Management (CRUD categorii + reguli per categorie) |
| D.8 | UI | Phantom Mode screen (selectare user → vizualizare cont) |

### Sprint E — Integrare B2B și Logistic API

**Obiectiv:** Endpoint-uri API pentru parteneri externi, generare API key, webhooks, documentație in-app.

| Task | Tip | Descriere |
|------|-----|-----------|
| E.1 | Server | Logistic API endpoints (delivery request, status, cancel, estimate) |
| E.2 | Server | API key generation + validare + rate limiting |
| E.3 | Server | Webhook notifications (status changes, confirmări) |
| E.4 | Server | Redirect controlat (card partener → magazin extern) |
| E.5 | UI | Merchant API Integration screen (API key, webhook config, docs) |
| E.6 | UI | API documentation in-app (endpoint-uri, exemple, coduri eroare) |
| E.7 | UI | Istoric apeluri API (ultimele 50, status, response time) |

---

## 17. Dependențe și Riscuri

| Risc | Impact | Probabilitate | Mitigare |
|------|--------|---------------|----------|
| Complexitate calcul Trust Score | Mediu | Ridicată | Implementare incrementală: formula simplificată inițial, rafinare ulterior |
| Escrow financiar necesită integrare plăți reale | Ridicat | Ridicată | Faza 1: simulare/mock escrow. Faza 2: integrare procesor plăți |
| Logistic API necesită documentație externă completă | Mediu | Medie | Documentație in-app + sandbox de test pentru parteneri |
| Zonare necesită date geografice precise | Mediu | Medie | Inițial: zone definite manual. Ulterior: geocoding automat |
| Moderare manuală poate deveni bottleneck | Ridicat | Medie | Moderare automată robustă + alertare admin la volum mare |
| Badge override fără justificare | Ridicat | Scăzută | Justificare obligatorie + audit log + notificare Owner |
| Phantom mode abuz | Ridicat | Scăzută | Logare completă + alertare la sesiuni lungi + restricții acțiuni |

---

## 18. Referințe Canonice

| # | Document | Locație | Conținut Relevant |
|---|----------|---------|-------------------|
| [1] | Doc. 08.X — Absența marketplace-ului din aplicația DROPi | 01_CANONICAL_DOCS/00_MasterPlan/02_PRODUS & TEHNOLOGIE/ | Separarea marketplace (site) de aplicație (CORE) |
| [2] | Anexa 6B — Marketplace Controlat DROPi | 03_VOLUME_II_PRODUCT_TECH/Cap_06_Product_DROPi/ | Reguli marketplace, badge-uri, trust system, moderare |
| [3] | B2B_Logistics_Partners.md | 03_VOLUME_II_PRODUCT_TECH/Cap_06_Product_DROPi/ | Integrare parteneri B2B, Logistic API, modele |
| [4] | Anexa 12.A — Structură Log-uri | 01_CANONICAL_DOCS/00_MasterPlan/ | Structura audit logs, tipuri, retenție |
| [5] | Anexa 8.A — Mapare Roluri & Permisiuni | 01_CANONICAL_DOCS/00_MasterPlan/ | RBAC complet, permisiuni per rol |
| [6] | Doc. 07.X.1 — Reguli de Design UI Marketplace | 01_CANONICAL_DOCS/00_MasterPlan/02_PRODUS & TEHNOLOGIE/ | Interdicții UI, elemente permise/interzise |
| [7] | Marketplace_Financial_Flow.md | 03_VOLUME_II_PRODUCT_TECH/Cap_06_Product_DROPi/ | Modele financiare, escrow, interziceri |
| [8] | Delivery_Multimodal.md | 03_VOLUME_II_PRODUCT_TECH/Cap_06_Product_DROPi/ | Badge-uri livrare, moduri transport, fallback |
| [9] | Doc. 15 — Integrare, Interoperabilitate și Ecosistem | 01_CANONICAL_DOCS/00_MasterPlan/ | Checklist integrare, API, webhook |
| [10] | Reputation_Ranking_System.md | 03_VOLUME_II_PRODUCT_TECH/Cap_06_Product_DROPi/ | Sistem reputație, ranking, componente scor |

---

**Sfârșit Blueprint — Versiune 1.0.0**

*Acest document este sursa unică de adevăr pentru implementarea marketplace-ului DROPi în aplicația mobilă. Orice decizie de implementare care nu este acoperită de acest Blueprint trebuie escaladată pentru aprobare înainte de execuție.*
