# DROPi — BLUEPRINT OFICIAL

> **Versiune:** 1.0  
> **Data:** 27 Iunie 2026  
> **Status:** APROBAT — Baza de lucru pentru toate sesiunile viitoare  
> **Proprietar:** Fondatorul DROPi

---

## Ce Este Acest Blueprint

Acest director conține documentația de referință care ghidează **întreaga implementare** a platformei DROPi Mobile. Orice sesiune de lucru viitoare trebuie să consulte aceste documente înainte de a începe implementarea.

---

## Documente Incluse

| # | Fișier | Rol |
|---|--------|-----|
| 1 | **DROPi_ROADMAP_BY_LAYERS.md** | Roadmap-ul principal — 191 pași organizați pe cele 6 straturi canonice |
| 2 | **DROPi_6_LAYERS_EXPLAINED.md** | Explicație detaliată a celor 6 straturi ale arhitecturii platformei |
| 3 | **DROPi_ROADMAP_COMPARISON.md** | Analiză comparativă v1 (tehnic) vs v2 (straturi) — justificarea deciziei |
| 4 | **DROPi_REGISTRATION_FLOW_REPORT.md** | Raport complet: fluxul de înregistrare, tipuri cont, activare, securitate, limitări |

---

## Ordinea de Implementare (Sumar)

```
L2 (APPLICATION CORE — 62 pași)
  → L6 (AUDIT CORE — 18 pași, în paralel cu L2)
    → L4 (LOGIC CORE / AI — 46 pași)
      → L3 (PHYSICAL CORE / DronePort — 19 pași)
        → L5 (OPERATIONAL CORE — 21 pași)
          → L1 (PUBLIC FRONT / Website — 8 pași)

+ 17 pași module transversale (Securitate, QA, Offline, Publish)
= 191 pași total, ~28 sprint-uri
```

---

## Reguli de Utilizare

1. **Consultare obligatorie** — Orice sesiune nouă de lucru pe DROPi Mobile consultă acest blueprint
2. **Conformitate canonică** — Fiecare implementare respectă referințele canonice din roadmap
3. **Audit din prima zi** — Orice feature nou generează audit log automat
4. **Separare canale** — C1/C2/C3/Admin nu se amestecă niciodată
5. **qa-debugger validation** — Orice livrabil verificat contra masterplan înainte de publicare
6. **Versionare** — Blueprint-ul se actualizează doar cu aprobare explicită

---

## Relația cu Alte Documente

| Document | Locație | Relație |
|----------|---------|---------|
| Masterplan | `/home/ubuntu/.manus/config/project-file/masterplan.md` | Sursă de adevăr strategică |
| Documentație canonică | `/home/ubuntu/docs/DROPI_CANONICAL/` | Sursă de adevăr pentru reguli |
| todo.md | `/home/ubuntu/dropi-mobile/todo.md` | Tracking execuție curentă |
| design.md | `/home/ubuntu/dropi-mobile/design.md` | Specificații UI/UX |

---

> **Acest blueprint înlocuiește** DROPi_IMPLEMENTATION_ROADMAP.md (v1, bazat pe features tehnice).  
> **Motivul:** Alinierea cu arhitectura canonică a platformei (cele 6 straturi).
