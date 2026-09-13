# DROPi — Architecture

## 1. Viziune arhitecturală

DROPi este o platformă multi-canal pentru livrare multimodală și, în C1 unde este autorizat, mobilitate de persoane, cu orchestrare digitală, suport AI și trasabilitate audit.

## 2. Structură de nivel înalt

### Canale operaționale
- C1: Marketplace
- C2: Contracted Operations
- C3: Emergency Operations
- Admin: guvernanță platformă

### Componente majore
- Aplicație mobilă (Expo/React Native)
- Backend API (Node.js + tRPC + DB)
- Workflows cloud (build/update/deploy)
- Sistem AI agentic (simulare/asistență pe roluri)

### Domenii de serviciu

- **Parcel Delivery** — comenzi și execuții pentru colete, conform `canonical/DELIVERY_MULTIMODAL.md`.
- **Passenger Mobility** — curse pentru persoane, cu lifecycle, autorizare, capacitate, siguranță și audit proprii, conform `canonical/PASSENGER_MOBILITY.md`.

Cele două domenii reutilizează identitatea, autentificarea și infrastructura comună, dar nu reutilizează permisiunea operațională sau sistemul de evidență. Passenger Mobility este plasat în C1; nu creează un canal nou.

Prezența în catalog și dreptul de operare sunt stări independente: ramura Passenger Mobility rămâne vizibilă în C1 ca serviciu blocat, iar onboardingul, pilotul controlat și operarea publică se activează separat numai după porțile canonice de autorizare.

## 3. Straturi canonice

Arhitectura urmează modelul pe straturi definit în documentația canonică (L2→L6→L4→L3→L5) și principiul:

> Livrarea pornește doar după validarea cererii, capacității și riscului.

## 4. Referințe arhitecturale

- `BLUEPRINT/DROPi_6_LAYERS_EXPLAINED.md`
- `canonical-structure.md`
- `canonical/AI_AGENT_SYSTEM.md`
- `canonical/DELIVERY_MULTIMODAL.md`
- `canonical/PASSENGER_MOBILITY.md`
- `04.zip` → `04/DROPI_CANONICAL/02_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`
