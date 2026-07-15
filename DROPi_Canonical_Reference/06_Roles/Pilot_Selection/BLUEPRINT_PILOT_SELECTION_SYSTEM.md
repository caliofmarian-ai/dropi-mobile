# Blueprint: Sistem de Selecție a Piloților DROPi

**Versiune:** 1.0  
**Data:** 28.06.2026  
**Status:** Draft — în așteptare aprobare  
**Referințe canonice:** Cap. 6 Product DROPi, Delivery_Multimodal.md, B2B_Logistics_Partners.md, Pre_Orchestrare_Zonala.md

---

## 1. Scop și Context

Acest blueprint definește arhitectura completă a sistemului de selecție a piloților în ecosistemul DROPi, respectând separarea strictă dintre canale și regulile canonice de alocare. Sistemul diferențiază fundamental între selecția automată (C1 Marketplace) și selecția manuală condiționată (C2/C3 COS), asigurând conformitate cu documentația canonică.

---

## 2. Reguli Canonice (Sursa de Adevăr)

### 2.1 C1 — Marketplace Comercial

> „Marketplace-ul NU oferă: alocare manuală către un pilot anume" — Cap. 6, §6.1.3

> „Marketplace-ul nu permite: desemnare manuală de piloți; amestec cu fluxuri COS." — Cap. 6, §6.3.7

> „Pilotul NU este ales «primul care apasă». Selecția este făcută de sistem pe baza: eligibilității tehnice, poziționării, ratingului, istoricului de livrări, mecanismelor de rotație." — Delivery_Multimodal, §5

În C1, selecția pilotului este **exclusiv automată**, realizată de algoritmul DSS (Decision Support System) fără intervenție umană. Clientul nu vede și nu poate alege pilotul.

### 2.2 C2/C3 — COS (Controlled Operations System)

> „O entitate are nevoie să desemneze misiuni către piloți dedicați" — Cap. 6, §6.4.1

> „COS și Marketplace sunt separate prin: reguli distincte de alocare" — Cap. 6, §6.4.3

> „COS oferă entității control asupra fluxului (logic), nu control ierarhic asupra pilotului." — Cap. 6, §6.4.4.A

În C2/C3, operatorul (Operations Manager, Dispatch Manager, Emergency Coordinator) **poate selecta manual** un pilot din lista de piloți eligibili, sub condiția că pilotul are **rating suficient de bun** și îndeplinește criteriile de eligibilitate.

### 2.3 Criterii de Selecție (Algoritmice)

Conform Delivery_Multimodal §5, criteriile de selecție sunt, în ordine:

| Prioritate | Criteriu | Descriere |
|:---:|---|---|
| 1 | Eligibilitate tehnică | Verificări aprobate, vehicul compatibil, licență validă |
| 2 | Poziționare | Distanța față de punctul de pickup |
| 3 | Rating | Scorul compozit al pilotului (calculat din istoric) |
| 4 | Istoric de livrări | Număr total livrări, rată de completare, incidente |
| 5 | Mecanisme de rotație | Echitate în distribuția misiunilor |

---

## 3. Arhitectura Datelor

### 3.1 Tabel Nou: `pilotProfiles`

Acest tabel extinde informațiile despre piloți (utilizatori cu `dropiRole = "delivery_partner"`) cu date de performanță și eligibilitate.

```sql
CREATE TABLE pilotProfiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,           -- FK → users.id
  -- Rating compozit (0.00 - 5.00)
  rating DECIMAL(3,2) DEFAULT 0.00 NOT NULL,
  -- Componente rating
  completionRate DECIMAL(5,2) DEFAULT 100.00,  -- % livrări finalizate cu succes
  onTimeRate DECIMAL(5,2) DEFAULT 100.00,      -- % livrări la timp
  incidentRate DECIMAL(5,2) DEFAULT 0.00,      -- % livrări cu incidente
  customerRating DECIMAL(3,2) DEFAULT 5.00,    -- Rating mediu de la clienți (1-5)
  -- Statistici
  totalDeliveries INT DEFAULT 0 NOT NULL,
  totalB2bDeliveries INT DEFAULT 0 NOT NULL,
  totalFailedDeliveries INT DEFAULT 0 NOT NULL,
  lastDeliveryAt TIMESTAMP NULL,
  -- Disponibilitate
  isAvailable BOOLEAN DEFAULT FALSE NOT NULL,
  currentLat DECIMAL(10,8) NULL,
  currentLng DECIMAL(11,8) NULL,
  lastPositionUpdate TIMESTAMP NULL,
  -- Capacități
  maxWeightGrams INT DEFAULT 5000,
  vehicleTypes JSON,                    -- ["drone", "car", "van", "ebike"]
  operatingZones JSON,                  -- ["zone_a", "zone_b"]
  -- COS eligibilitate
  cosEligible BOOLEAN DEFAULT FALSE NOT NULL,  -- Aprobat pentru misiuni COS
  cosMinRating DECIMAL(3,2) DEFAULT 4.00,      -- Rating minim pentru COS manual
  -- Rotație
  lastAssignedAt TIMESTAMP NULL,
  assignmentCount24h INT DEFAULT 0,
  -- Timestamps
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

### 3.2 Tabel Nou: `pilotRatingHistory`

Logarea istoricului de rating pentru audit și trasabilitate.

```sql
CREATE TABLE pilotRatingHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pilotProfileId INT NOT NULL,          -- FK → pilotProfiles.id
  previousRating DECIMAL(3,2) NOT NULL,
  newRating DECIMAL(3,2) NOT NULL,
  reason VARCHAR(200) NOT NULL,         -- "delivery_completed", "delivery_failed", "customer_review", "incident_reported"
  deliveryId INT NULL,                  -- FK → deliveries.id sau b2bDeliveries.id
  deliveryType ENUM('marketplace', 'b2b') NULL,
  calculationDetails JSON,              -- Detalii calcul (ponderile folosite)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### 3.3 Relația cu Tabelele Existente

| Tabel existent | Relație | Scop |
|---|---|---|
| `users` | `pilotProfiles.userId → users.id` | Identificare pilot |
| `verifications` | Join pe `userId` | Eligibilitate tehnică (licențe aprobate) |
| `deliveries` | Join pe `pilotId` | Istoric marketplace |
| `b2bDeliveries` | Join pe `assignedPilotId` | Istoric B2B |

---

## 4. Algoritmul de Selecție Automată (C1)

### 4.1 Flux de Selecție

```
Comandă intră în READY
    │
    ▼
┌─────────────────────────────────┐
│ 1. Filtrare eligibilitate       │
│    - dropiRole = delivery_partner│
│    - isActive = true            │
│    - isAvailable = true         │
│    - verifications approved     │
│    - vehicleType compatibil     │
│    - operatingZone corespunde   │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│ 2. Scoring compozit             │
│    score = w1×proximity         │
│          + w2×rating            │
│          + w3×completionRate    │
│          + w4×rotationBonus     │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│ 3. Selecție top candidat        │
│    - Cel mai mare scor          │
│    - Notificare pilot           │
│    - Timeout acceptare (60s)    │
│    - Dacă refuză → next pilot   │
└─────────────────────────────────┘
```

### 4.2 Formula de Scoring

```
score = (0.30 × proximityScore)
      + (0.30 × ratingScore)
      + (0.25 × completionScore)
      + (0.15 × rotationBonus)
```

Unde:
- **proximityScore** = 1.0 - (distanță_km / raza_maximă_km), clamped [0, 1]
- **ratingScore** = pilotProfile.rating / 5.0
- **completionScore** = pilotProfile.completionRate / 100.0
- **rotationBonus** = 1.0 - (assignmentCount24h / maxAssignments24h), clamped [0, 1]

### 4.3 Ponderi Configurabile

Ponderile sunt stocate în configurația sistemului și pot fi ajustate de admin fără modificare de cod.

---

## 5. Selecția Manuală Condiționată (C2/C3)

### 5.1 Condiții de Acces

Selecția manuală este disponibilă **doar** pentru:

| Rol | Canal | Permisiune |
|---|---|---|
| `operations_manager` | C2 | Poate selecta pilot pentru livrări COS Modul 1 |
| `logistics_coordinator` | C2 | Poate selecta pilot pentru livrări COS Modul 1 |
| `fleet_manager` | C2 | Poate selecta pilot din flota proprie (COS Modul 2) |
| `dispatch_manager` | C3 | Poate selecta pilot pentru misiuni de urgență |
| `emergency_coordinator` | C3 | Poate selecta pilot pentru misiuni critice |
| `resource_allocator` | C3 | Poate selecta pilot pentru alocare resurse |

### 5.2 Condiția de Rating

Un pilot apare în dropdown-ul de selecție manuală **doar dacă**:

```
pilotProfile.rating >= pilotProfile.cosMinRating (default: 4.00)
AND pilotProfile.cosEligible = TRUE
AND verifications.status = "approved" (cel puțin licența relevantă)
AND pilotProfile.isActive = TRUE
```

Pragul `cosMinRating` este configurabil per pilot și per entitate COS. Valoarea implicită este **4.00 din 5.00**.

### 5.3 Informații Afișate în Dropdown

Operatorul vede pentru fiecare pilot eligibil:

| Câmp | Exemplu | Scop |
|---|---|---|
| Nume | "Ion Popescu" | Identificare |
| Rating | ★ 4.7 | Calitate |
| Livrări completate | 342 | Experiență |
| Rată completare | 98.5% | Fiabilitate |
| Vehicul | Dronă / Auto | Compatibilitate |
| Distanță estimată | ~2.3 km | Proximitate |
| Disponibilitate | 🟢 Disponibil | Status real-time |
| Ultima misiune | acum 45 min | Rotație |

### 5.4 Flux UI pentru Selecție Manuală

```
Operator deschide delivery pending
    │
    ▼
┌─────────────────────────────────┐
│ Buton "Atribuie Pilot"          │
│ (vizibil doar C2/C3)            │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│ Modal: Lista piloți eligibili   │
│ - Filtru: vehicul, zonă        │
│ - Sort: rating desc (default)  │
│ - Doar piloți cu rating >= 4.0 │
│ - Status disponibilitate live  │
└─────────────────┬───────────────┘
                  │ Selectează pilot
                  ▼
┌─────────────────────────────────┐
│ Confirmare: "Atribuie misiunea  │
│ pilotului Ion Popescu (★4.7)?"  │
│ [Confirmă] [Anulează]          │
└─────────────────┬───────────────┘
                  │ Confirmă
                  ▼
┌─────────────────────────────────┐
│ Server: assignPilot mutation    │
│ - Validează eligibilitate       │
│ - Actualizează status           │
│ - Trigger webhook               │
│ - Log audit                     │
└─────────────────────────────────┘
```

---

## 6. Calculul Ratingului

### 6.1 Formula de Rating Compozit

```
rating = (0.40 × completionRate/100)×5
       + (0.25 × onTimeRate/100)×5
       + (0.20 × customerRating)
       + (0.15 × (1 - incidentRate/100))×5
```

Ratingul este recalculat după fiecare livrare finalizată, eșuată sau review primit.

### 6.2 Evenimente care Modifică Ratingul

| Eveniment | Efect | Pondere |
|---|---|---|
| Livrare completată cu succes | ↑ completionRate, ↑ onTimeRate | Mare |
| Livrare eșuată (pilot fault) | ↓ completionRate, ↑ incidentRate | Mare |
| Review pozitiv client (4-5★) | ↑ customerRating | Medie |
| Review negativ client (1-2★) | ↓ customerRating | Medie |
| Incident raportat | ↑ incidentRate | Mare |
| Livrare cu întârziere | ↓ onTimeRate | Mică |
| Fallback activat (nu pilot fault) | Neutru | — |

### 6.3 Protecții Anti-Manipulare

Sistemul include protecții conform principiilor canonice (Cap. 6, §6.5.3 DSS):

- Rating-ul nu poate fi influențat manual de niciun actor.
- Calculul este determinist și auditat.
- Fiecare modificare de rating generează o intrare în `pilotRatingHistory`.
- Piloții noi încep cu rating 0.00 și au nevoie de minimum 10 livrări completate pentru a fi eligibili COS.

---

## 7. Endpoint-uri API

### 7.1 Server-side (tRPC Router: `pilotSelectionRouter`)

| Procedure | Tip | Acces | Descriere |
|---|---|---|---|
| `getEligiblePilots` | query | C2/C3 roles | Returnează piloții eligibili pentru selecție manuală |
| `getAutoSelectedPilot` | query | system/admin | Rulează algoritmul automat și returnează top candidat |
| `assignPilotManual` | mutation | C2/C3 roles | Atribuie manual un pilot (cu validare rating) |
| `updatePilotAvailability` | mutation | delivery_partner | Pilotul își setează disponibilitatea |
| `updatePilotPosition` | mutation | delivery_partner | Actualizare poziție GPS |
| `recalculateRating` | mutation | system | Recalculează rating după eveniment |
| `getPilotProfile` | query | delivery_partner/admin | Vizualizare profil pilot cu statistici |
| `getPilotLeaderboard` | query | admin | Top piloți per zonă/canal |

### 7.2 Validări Server-Side

Pentru `assignPilotManual`:

```typescript
// 1. Verifică rolul operatorului (C2/C3 only)
if (!["C2", "C3"].includes(caller.channel)) throw FORBIDDEN;

// 2. Verifică eligibilitatea pilotului
const profile = await getPilotProfile(pilotId);
if (profile.rating < profile.cosMinRating) throw RATING_TOO_LOW;
if (!profile.cosEligible) throw NOT_COS_ELIGIBLE;
if (!profile.isAvailable) throw PILOT_UNAVAILABLE;

// 3. Verifică documentele
const verifs = await getApprovedVerifications(pilotId);
if (verifs.length === 0) throw NO_APPROVED_VERIFICATIONS;

// 4. Atribuie și loghează
await assignDelivery(deliveryId, pilotId);
await logAudit("manual_pilot_assignment", { operatorId, pilotId, deliveryId, channel });
await triggerWebhooks(storeId, "delivery.assigned", payload);
```

---

## 8. Componente UI

### 8.1 `PilotPickerModal` (Nou)

Componentă modal pentru selecția manuală a pilotului, vizibilă doar în dashboardurile C2/C3.

**Props:**
- `deliveryId: number` — ID-ul livrării pentru care se selectează pilot
- `onSelect: (pilotId: number) => void` — Callback la selecție
- `onClose: () => void` — Închidere modal
- `filters?: { vehicleType?, zone?, minRating? }` — Filtre opționale

**Comportament:**
- Afișează lista piloților eligibili sortați descrescător după rating
- Include filtre pentru vehicul, zonă, disponibilitate
- Afișează indicator de distanță estimată față de pickup
- Confirmă selecția printr-un dialog secundar
- Dezactivează piloții indisponibili (grayed out, fără acțiune)

### 8.2 `AutoAssignBadge` (Nou)

Componentă care indică selecția automată în C1, fără interacțiune.

**Comportament:**
- Afișează "Selecție automată" cu icon de sistem
- La hover/press arată criteriile folosite (rating, proximitate, rotație)
- Nu permite override manual

### 8.3 Modificări la Dashboardurile Existente

| Dashboard | Modificare |
|---|---|
| Operations Manager (C2) | Butonul "Assign" deschide `PilotPickerModal` în loc de hardcoded pilotId |
| Dispatch Manager (C3) | Butonul "Dispatch" deschide `PilotPickerModal` |
| Emergency Coordinator (C3) | Butonul "Assign" deschide `PilotPickerModal` cu filtru urgency |
| Merchant Orders (C1) | Afișează `AutoAssignBadge` — fără selecție manuală |

---

## 9. Integrare cu Sistemele Existente

### 9.1 WebSocket Live Tracking

Când un pilot este selectat (manual sau automat), poziția sa este broadcast-ată prin WebSocket-ul existent (`/ws/tracking`) către:
- Operatorul care l-a atribuit (C2/C3)
- Merchantul partener (prin webhook)
- Clientul final (dacă aplicabil)

### 9.2 Webhook Trigger

La atribuirea unui pilot, webhook-ul `delivery.assigned` include:

```json
{
  "event": "delivery.assigned",
  "deliveryId": 123,
  "trackingCode": "DRP-ABC123",
  "pilot": {
    "id": 45,
    "name": "Ion P.",
    "rating": 4.7,
    "vehicleType": "drone",
    "estimatedArrival": "2026-06-28T15:30:00Z"
  },
  "assignmentType": "manual",
  "assignedBy": {
    "operatorId": 12,
    "role": "operations_manager",
    "channel": "C2"
  }
}
```

### 9.3 Audit Log

Fiecare selecție (automată sau manuală) generează o intrare în `auditLogs`:

```json
{
  "action": "pilot_assigned",
  "actorId": 12,
  "targetId": 45,
  "channel": "C2",
  "details": {
    "deliveryId": 123,
    "assignmentType": "manual",
    "pilotRating": 4.7,
    "selectionCriteria": "manual_cos_eligible",
    "alternativesConsidered": 5
  }
}
```

---

## 10. Migrare și Populare Date

### 10.1 Migrare Inițială

La crearea tabelului `pilotProfiles`, se populează automat din datele existente:

1. Se identifică toți utilizatorii cu `dropiRole = "delivery_partner"`.
2. Se calculează `totalDeliveries` din tabelul `deliveries` + `b2bDeliveries`.
3. Se calculează `completionRate` din raportul completed/total.
4. Rating-ul inițial se setează pe baza datelor existente sau la 3.00 (neutru) dacă nu există istoric.
5. `cosEligible` se setează `TRUE` doar pentru piloții cu minimum 10 livrări și rating >= 4.00.

### 10.2 Recalculare Periodică

Un job periodic (zilnic) recalculează rating-urile pe baza ultimelor 90 de zile de activitate, pentru a reflecta performanța recentă.

---

## 11. Securitate și Conformitate

### 11.1 Separare Canale

Conform Cap. 6, §6.6.6, separarea este implementată prin:

- Endpoint-ul `getEligiblePilots` verifică `caller.channel ∈ ["C2", "C3"]`
- Endpoint-ul `assignPilotManual` verifică `caller.dropiRole ∈ [roles C2/C3 permise]`
- În C1, nu există niciun endpoint de selecție manuală expus

### 11.2 Protecția Piloților Self-Employed

Conform Cap. 6, §6.6.1:

- Selecția manuală în COS **nu creează obligație** pentru pilot
- Pilotul poate refuza misiunea atribuită manual (rămâne self-employed)
- Refuzul nu afectează rating-ul pilotului
- Selecția manuală este o **propunere**, nu o comandă ierarhică

### 11.3 Audit Complet

Fiecare acțiune legată de selecție este logată:
- Cine a selectat (operator ID, rol, canal)
- Pe cine a selectat (pilot ID, rating la momentul selecției)
- De ce (delivery ID, criterii)
- Când (timestamp)
- Rezultat (acceptat/refuzat de pilot)

---

## 12. Plan de Implementare

### Faza 1: Schema și Migrare
- Creare tabel `pilotProfiles`
- Creare tabel `pilotRatingHistory`
- Migrare date existente
- Recalculare rating-uri inițiale

### Faza 2: Backend — Rating Engine
- Implementare `recalculateRating` procedure
- Hook-uri pe delivery completion/failure
- Job periodic de recalculare

### Faza 3: Backend — Selection Router
- `pilotSelectionRouter` cu toate endpoint-urile
- Algoritm automat de scoring (C1)
- Validare manuală cu rating gate (C2/C3)
- Integrare audit logs

### Faza 4: Frontend — PilotPickerModal
- Componentă modal cu listă piloți
- Filtre și sortare
- Integrare în dashboardurile C2/C3
- AutoAssignBadge pentru C1

### Faza 5: Integrare și Testare
- Wire webhook payload cu pilot info
- Integrare WebSocket pentru poziție pilot
- Teste unitare pentru algoritm scoring
- Teste de integrare pentru flow complet

---

## 13. Metrici de Succes

| Metrică | Target | Măsurare |
|---|---|---|
| Timp mediu de atribuire (C1 auto) | < 30 secunde | De la READY la assigned |
| Rată acceptare piloți (C1) | > 85% | Piloți care acceptă prima propunere |
| Rating mediu piloți COS | >= 4.2 | Media rating piloți selectați manual |
| Zero selecții manuale în C1 | 0 | Audit log verificare |
| Conformitate audit | 100% | Toate selecțiile logate |

---

## 14. Riscuri și Mitigări

| Risc | Impact | Mitigare |
|---|---|---|
| Pilot cu rating bun refuză misiunea COS | Întârziere livrare | Fallback la next eligible pilot, timeout 60s |
| Rating manipulat prin review-uri false | Selecție incorectă | Anti-fraud: max 1 review/client/pilot/zi, detectare pattern |
| Operator selectează pilot indisponibil | Misiune blocată | Validare server-side disponibilitate la momentul assign |
| Prea puțini piloți eligibili COS | Bottleneck | Alertă admin când < 3 piloți eligibili per zonă |
| Confuzie canal (C1 operator încearcă manual) | Breach separare | RBAC strict + UI nu afișează opțiunea |

---

## 15. Dependențe

| Dependență | Status | Blocker? |
|---|---|---|
| Tabel `users` cu `dropiRole` | ✅ Existent | Nu |
| Tabel `verifications` | ✅ Existent | Nu |
| Tabel `deliveries` | ✅ Existent | Nu |
| Tabel `b2bDeliveries` | ✅ Existent | Nu |
| WebSocket `/ws/tracking` | ✅ Implementat | Nu |
| Webhook trigger system | ✅ Implementat | Nu |
| Audit logs table | ✅ Existent | Nu |
| GPS tracking pilot | ⚠️ Parțial (WebSocket) | Nu — se extinde |

---

*Acest blueprint este supus aprobării înainte de implementare. Orice modificare a regulilor canonice necesită revizuirea Cap. 6 și actualizarea acestui document.*
