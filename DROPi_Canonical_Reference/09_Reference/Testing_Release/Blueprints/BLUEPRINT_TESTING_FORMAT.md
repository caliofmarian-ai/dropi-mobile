# BLUEPRINT: Format Livrare Teste după Checkpoint

**Status:** PERMANENT REQUIREMENT  
**Data:** 2026-06-28  
**Versiune:** 1.0  
**Aplicabilitate:** Fiecare checkpoint livrat, fără excepție

---

## Regulă Obligatorie

După **fiecare checkpoint** salvat, agentul TREBUIE să livreze utilizatorului următoarea structură exactă:

---

## Format Obligatoriu

### 1. Titlu

```
Checkpoint [nume/număr] — Teste
```

Exemplu:
```
Checkpoint a3f7624e (Pilot Real Names) — Teste
```

### 2. Lista de Teste Numerotată

O listă numerotată cu testele manuale pe care utilizatorul trebuie să le execute pe dispozitiv (Expo Go / device fizic). Fiecare test descrie:

- Acțiunea exactă de efectuat (navigare, tap, input)
- Rezultatul așteptat (ce trebuie să vadă utilizatorul)

Exemplu:
```
1. Demo Mode → Delivery Partner → apasă "🏆 Leaderboard"
2. Verifică numele — vezi "Andrei Dumitrescu", "Alexandru Popescu" etc.?
3. Apasă pe un pilot → pe profilul detaliat vezi numele real?
4. Filtrează pe "Bucharest" — vezi piloții din zona corectă?
5. Filtrează pe "Cluj" — vezi piloții din zona corectă?
```

### 3. Opțiune Binară la Sfârșit

După lista de teste ȘI după sugestiile de avansare (next steps), agentul TREBUIE să ofere utilizatorului alegerea:

```
---
✅ **Întreaga listă de teste a trecut**
❌ **A picat**
```

### 4. Comportament pe Răspuns

| Răspuns utilizator | Acțiune agent |
|---|---|
| ✅ "Întreaga listă de teste a trecut" | Continuă cu următorul sprint/feature |
| ❌ "A picat" | Agentul verifică automat, diagnostichează problema, aplică fix, salvează checkpoint nou, re-livrează lista de teste |

---

## Cerințe Suplimentare Pre-Checkpoint

Înainte de a salva checkpoint-ul, agentul TREBUIE să:

1. Ruleze `npx tsc --noEmit` — zero erori TypeScript
2. Ruleze `npx vitest run` — toate testele trec
3. Verifice `todo.md` — toate itemurile completate marcate cu `[x]`

---

## Structura Completă a Mesajului Post-Checkpoint

```
[Rezumat scurt al lucrării — max 100 cuvinte]

---

## Checkpoint [nume/număr] — Teste

1. [Test 1 — acțiune + rezultat așteptat]
2. [Test 2 — acțiune + rezultat așteptat]
3. [Test N — acțiune + rezultat așteptat]

---

**Next steps:**

1. [Sugestie concretă 1]
2. [Sugestie concretă 2]
3. [Sugestie concretă 3]

---

✅ **Întreaga listă de teste a trecut**
❌ **A picat**
```

---

## Note

- Această regulă este **permanentă** și se aplică la FIECARE checkpoint, indiferent de complexitate.
- Dacă utilizatorul răspunde "A picat", agentul NU cere detalii suplimentare — verifică automat și repară.
- Lista de teste trebuie să fie **specifică** checkpoint-ului curent (nu generică).
- Testele trebuie să fie executabile pe dispozitiv real sau Expo Go web preview.
