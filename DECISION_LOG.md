# DROPi — Decision Log

## Scop

Registru central pentru deciziile de proiect, cu trimitere la sursele canonice.

## Decizii active (rezumat)

1. Repository-ul este sursa de adevăr pentru implementare.
2. `canonical/SESSION_HANDOVER.md` se actualizează obligatoriu la final de sesiune.
3. Build/update mobil rulează prin EAS + GitHub Actions.
4. Runtime mobil real folosește telefon + Expo Dev Client + backend cloud.
5. `main` este branch protejat, promovare doar prin PR.
6. Figma și Canva sunt instrumente plătite, autorizate de Project Owner pentru utilizarea normală în proiectul `caliofmarian-ai/dropi-mobile`; nu este necesară o nouă aprobare pentru fiecare task obișnuit de design/creative.
7. Figma este companionul activ pentru UI/UX, design system, prototipare, visual QA și handoff; GitHub/runtime rămâne autoritatea de produs.
8. Canva este companion pentru prezentări, review, store/static marketing și comunicare vizuală; nu poate fabrica product/release claims.
9. Runway este autorizat, dar rămâne `HOLD` până în faza finală de producție: **NO RUNWAY CREDIT CONSUMPTION BEFORE THE FINAL PRODUCTION PHASE**, exceptând o nouă instrucțiune explicită a Project Owner-ului.
10. Tooling/design pentru `dropi-mobile` nu importă automat source truth, PR/issue state sau UI din produse sibling precum `DROPi-Tycoon`.
11. Modelul de produs DROPi este **livrare multimodală**, nu drone-only și nu generic courier: dronă + auto + van + e-bike + livrare multimodală/staged, cu DronePort / vehicle depot / transfer hub, handoff și fallback conform `canonical/DELIVERY_MULTIMODAL.md`.
12. Companionul Figma activ pentru produs este `DROPi Multimodal Delivery — UI/UX System` (`lfrk6LCDrRNdQZhICIs3R0`). Direcția Figma inițială generică `DROPi Mobile — UI/UX Design System` este SUPERSEDED ca autoritate de design activă și nu trebuie folosită fără reconciliere cu canonul multimodal.
13. UI/UX nu poate prezenta badge-urile de mod de livrare drept garanție, Marketplace drept autoritate de validare/start livrare, clientul drept selector al pilotului sau Mission Radar drept reprezentarea completă a produsului.
14. Passenger Mobility este un domeniu de serviciu distinct în C1, nu o extensie a unei livrări și nu un canal C4/taxi. `orders`/`deliveries` pentru colete nu devin sistemul de evidență al curselor.
15. Contul și rolurile canonice rămân comune, dar autoritatea operațională este exprimată prin capabilități distincte per serviciu, persoană, operator, vehicul, jurisdicție, zonă și perioadă. `users.isVerified` și un permis de conducere nu pot autoriza transportul de persoane.
16. Prima planificare acoperă C1 Passenger Mobility în România și Filipine. C2 este rezervat și dezactivat până la o decizie separată; C3 exclude transportul alternativ, medical, de pacient sau de urgență.
17. Orice piață funcționează printr-un `jurisdiction pack` versionat și fail-closed. Pentru triciclete în Filipine, serviciul rămâne blocat până la alegerea LGU-ului exact din Zone 0 și confirmarea scrisă a francizei, rutelor/zonei, capacității, asigurării și acceptării dispecerizării prin aplicație.
18. Modelul juridic este hibrid per jurisdicție: DROPi Core păstrează produsul și guvernanța, iar entitatea platformei/Zone Operatorul și operatorii de transport dețin autorizațiile și contractele cerute local, validate de consilier juridic înainte de lansare.
19. Passenger Mobility figurează permanent ca ramură distinctă în C1 după livrarea shell-ului de produs, chiar înainte de autorizare. Starea implicită este vizibilă și blocată; onboardingul, pilotul și operarea publică se deblochează etapizat și independent. Vizibilitatea nu permite colectarea datelor de cursă și nu conferă autoritate operațională.

## Surse ale deciziilor

- `canonical/SESSION_HANDOVER.md` (secțiunea „Decizii Importante Luate”)
- `canonical/AI_DEVELOPMENT_HANDOVER_CANON.md`
- `canonical/DELIVERY_MULTIMODAL.md`
- `canonical/PASSENGER_MOBILITY.md`
- `docs/research/PASSENGER_MOBILITY_LEGAL_BASELINE_RO_PH.md`
- `docs/ux/PASSENGER_MOBILITY_UX_SPEC.md`
- `docs/planning/PASSENGER_MOBILITY_IMPLEMENTATION_PLAN.md`
- `canonical/AUTHORIZED_TOOLING.md`

## Reguli de actualizare

- Fiecare decizie nouă trebuie:
  1. formulată clar,
  2. justificată,
  3. legată de sursă (fișier/PR/log).
