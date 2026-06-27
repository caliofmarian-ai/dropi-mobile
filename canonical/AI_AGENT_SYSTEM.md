# DROPi — Sistem Canonic de Agenți AI

> **STATUS: CANONIC — NU SE ȘTERGE NICIODATĂ**
> Acest document este parte permanentă a arhitecturii DROPi.
> Orice versiune viitoare a aplicației TREBUIE să respecte aceste principii.

---

## 1. Principiul Fundamental: Dualitatea Cont Uman + Agent AI

Fiecare rol din platforma DROPi are **două entități inseparabile**:

| Entitate | Descriere |
|----------|-----------|
| **Contul Uman** | Persoana reală care ocupă funcția (când există) |
| **Agentul AI** | Entitate inteligentă care simulează SAU asistă acea funcție |

Aceste două entități sunt **întotdeauna prezente** pentru fiecare rol. Nu există cont fără agent AI asociat.

---

## 2. Modurile de Operare ale Agentului AI

### Mod 1: AI AUTONOM (Faza de dezvoltare / fără om real)

```
┌─────────────────────────────────────────┐
│  AGENT AI = ACTORUL PRINCIPAL           │
│                                         │
│  • Execută acțiunile rolului autonom    │
│  • Simulează comportamentul uman        │
│  • Testează platforma prin acțiuni reale│
│  • Raportează buguri și probleme        │
│  • Sugerează îmbunătățiri pentru rolul  │
│    său ("pătrățica" lui)                │
│  • Găsește probleme de logică           │
│  • Identifică inconsistențe în UX      │
│                                         │
│  Omul: NU EXISTĂ încă                   │
│  Adminul: SUPRAVEGHEAZĂ                 │
└─────────────────────────────────────────┘
```

### Mod 2: AI ASISTENT (Când un om real preia funcția)

```
┌─────────────────────────────────────────┐
│  OMUL = ACTORUL PRINCIPAL               │
│  AGENT AI = GHID + ASISTENT            │
│                                         │
│  • Ghidează omul în sarcinile zilnice   │
│  • Sugerează acțiuni optime             │
│  • Alertează despre probleme            │
│  • Ușurează munca prin automatizări     │
│  • Oferă context și explicații          │
│  • NU ia decizii fără aprobarea omului  │
│                                         │
│  Tranziția: Agentul "predă" controlul  │
│  dar rămâne prezent ca suport           │
└─────────────────────────────────────────┘
```

---

## 3. Skill-urile Fiecărui Agent AI

Fiecare agent AI are următoarele capabilități fundamentale:

### 3.1 Skill-uri Comune (toți agenții)

| Skill | Descriere |
|-------|-----------|
| **Bug Detection** | Identifică buguri în funcționalitatea "pătrățicii" sale |
| **Logic Validation** | Verifică dacă fluxurile de business au sens logic |
| **UX Audit** | Evaluează dacă interfața este intuitivă pentru rolul său |
| **Suggestion Engine** | Propune îmbunătățiri specifice rolului |
| **Compliance Check** | Verifică respectarea regulilor canonice |
| **Performance Monitor** | Monitorizează timpii de răspuns și eficiența |
| **Edge Case Discovery** | Găsește scenarii limită neacoperite |

### 3.2 Skill-uri Specifice per Rol

Fiecare agent AI știe **exact** ce trebuie să facă în "pătrățica" lui:

**C1 Marketplace:**
- Customer AI: Plasează comenzi, testează checkout, verifică tracking
- Merchant AI: Procesează comenzi, gestionează inventar, respectă timpi
- Pilot AI: Acceptă misiuni, execută pre-flight, raportează probleme
- Support AI: Răspunde la tickete, escaladează corect
- Analyst AI: Generează rapoarte, identifică tendințe
- Compliance AI: Verifică regulile, semnalează încălcări
- Fraud AI: Detectează pattern-uri suspecte
- Performance AI: Monitorizează KPI-uri
- Incident AI: Răspunde la incidente, coordonează rezolvarea

**C2 COS:**
- Ops Manager AI: Coordonează operațiuni contractate
- Logistics AI: Optimizează rute și resurse
- Fleet Manager AI: Gestionează vehicule și drone
- C2 Compliance AI: Verifică SLA-uri
- C2 Performance AI: Monitorizează performanța contractelor
- C2 Incident AI: Gestionează incidente operaționale
- C2 Analyst AI: Analizează date operaționale
- QA AI: Inspectează calitatea livrărilor

**C3 EOC:**
- Emergency Coordinator AI: Declară și coordonează urgențe
- Dispatch AI: Alocă resurse rapid (<3 min)
- Resource Allocator AI: Gestionează depleția resurselor
- Comms AI: Coordonează comunicațiile multi-canal
- C3 Analyst AI: Analiză în timp real
- Incident Commander AI: Ia decizii critice (OVERRIDE)

**Admin:**
- System Admin AI: Monitorizează sănătatea platformei
- Security AI: Detectează amenințări
- Audit AI: Verifică conformitatea
- Config AI: Gestionează configurări
- Analytics AI: Generează rapoarte executive
- Support Coord AI: Coordonează echipa de support

---

## 4. Mecanismul de Tranziție AI → Uman

Când un om real se înregistrează și preia un rol:

```
Pasul 1: Omul creează cont → Sistemul detectează rolul
Pasul 2: Agentul AI trece din Mod AUTONOM în Mod ASISTENT
Pasul 3: Agentul AI face "onboarding" omului:
         - Îi explică responsabilitățile
         - Îi arată acțiunile prioritare
         - Îi oferă context despre starea curentă
Pasul 4: Omul preia controlul
Pasul 5: Agentul AI rămâne ca ghid pasiv + alertor activ
```

---

## 5. Raportarea Agenților AI către Admin

Fiecare agent AI raportează periodic:

```
┌─────────────────────────────────────────┐
│  RAPORT AGENT AI                        │
├─────────────────────────────────────────┤
│  Rol: [numele rolului]                  │
│  Canal: [C1/C2/C3/Admin]               │
│  Mod: [AUTONOM / ASISTENT]             │
│  Perioadă: [ultimele 24h]              │
├─────────────────────────────────────────┤
│  ACȚIUNI EXECUTATE: [lista]             │
│  BUGURI GĂSITE: [lista cu severitate]   │
│  PROBLEME DE LOGICĂ: [lista]            │
│  SUGESTII DE ÎMBUNĂTĂȚIRE: [lista]     │
│  EDGE CASES DESCOPERITE: [lista]        │
│  STARE GENERALĂ: [OK / ATENȚIE / CRITIC]│
└─────────────────────────────────────────┘
```

---

## 6. Reguli Canonice Non-Negociabile

1. **Agentul AI NU se șterge niciodată** — poate fi dezactivat, dar nu eliminat
2. **Fiecare rol are EXACT UN agent AI** — nu mai mulți, nu zero
3. **Agentul AI respectă RBAC** — nu poate face acțiuni în afara "pătrățicii" lui
4. **Toate acțiunile agentului sunt logate** — audit complet
5. **Adminul poate vedea orice agent** — transparență totală
6. **Tranziția AI→Uman este ireversibilă** — odată ce un om preia, agentul rămâne asistent
7. **Agentul AI nu ia decizii financiare** fără aprobare umană (în Mod ASISTENT)
8. **Rapoartele sunt obligatorii** — fiecare agent raportează cel puțin zilnic

---

## 7. Arhitectura Tehnică (Direcție)

```
┌─────────────────────────────────────────────────┐
│                PLATFORMA DROPi                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Cont 1   │  │ Cont 2   │  │ Cont N   │     │
│  │ (Uman?)  │  │ (Uman?)  │  │ (Uman?)  │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │              │              │            │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐     │
│  │ Agent AI │  │ Agent AI │  │ Agent AI │     │
│  │ Customer │  │ Merchant │  │ Pilot    │     │
│  │ (AUTONOM) │  │(ASISTENT)│  │ (AUTONOM)│     │
│  └──────────┘  └──────────┘  └──────────┘     │
│       │              │              │            │
│       └──────────────┼──────────────┘            │
│                      │                           │
│              ┌───────▼───────┐                   │
│              │  AI ENGINE    │                   │
│              │  (LLM + Rules)│                   │
│              └───────────────┘                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 8. Versioning

Acest document: **v1.0.0** — Creat pe 27 Iunie 2026
Ultima actualizare: 27 Iunie 2026
Autor: Definit de fondator, documentat de Manus AI

---

> **REAMINTIRE: Acest document este CANONIC.**
> Nu se modifică fără aprobarea explicită a fondatorului.
> Orice dezvoltator sau agent AI care lucrează pe proiect TREBUIE să citească acest document.
