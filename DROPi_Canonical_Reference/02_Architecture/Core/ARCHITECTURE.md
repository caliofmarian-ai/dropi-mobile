# DROPi — Architecture

## 1. Viziune arhitecturală

DROPi este o platformă logistică multi-canal, cu orchestrare digitală, suport AI și trasabilitate audit.

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

## 3. Straturi canonice

Arhitectura urmează modelul pe straturi definit în documentația canonică (L2→L6→L4→L3→L5) și principiul:

> Livrarea pornește doar după validarea cererii, capacității și riscului.

## 4. Referințe arhitecturale

- `BLUEPRINT/DROPi_6_LAYERS_EXPLAINED.md`
- `canonical-structure.md`
- `canonical/AI_AGENT_SYSTEM.md`
- `canonical/DELIVERY_MULTIMODAL.md`
- `04.zip` → `04/DROPI_CANONICAL/02_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`

