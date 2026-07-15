# Marketplace Financial Flow DROPi  
**Document canonic – fluxuri financiare și reguli de tranzacționare în marketplace**

> Status: CANONIC — FROZEN  
> Ultima revizie: 28.01.2026  
> Rol: Sursă de adevăr pentru fluxurile financiare din marketplace-ul DROPi  

Acest document definește regulile, modelele și limitările
privind tranzacțiile financiare desfășurate
în cadrul marketplace-ului DROPi.

Documentul are rol de guvernanță financiară,
audit și delimitare a responsabilităților
între DROPi, comercianți și clienți.

---

## 1. Principiul fundamental

DROPi NU este vânzătorul produselor
și NU este o instituție financiară.

DROPi operează un marketplace logistic
cu suport financiar condiționat,
în care fluxurile monetare sunt strict delimitate,
trasabile și auditate.

Separarea dintre:
- plata produsului,
- plata livrării,
- taxele DROPi
este obligatorie și non-negociabilă.

---

## 2. Modele financiare acceptate în marketplace

Marketplace-ul DROPi suportă EXCLUSIV
următoarele modele financiare:

### 2.1 Model A — Plată procesată prin DROPi (escrow / facilitator)

Acest model este implicit și recomandat.

Flux:
- clientul plătește suma către DROPi,
- DROPi reține fondurile temporar,
- fondurile sunt eliberate către comerciant
  conform regulilor operaționale și de livrare.

DROPi poate reține:
- comision de marketplace,
- taxă de livrare,
- taxe operaționale (DronePort, infrastructură).

Acest model permite:
- refund controlat,
- compensare corectă,
- audit complet.

---

### 2.2 Model B — Plată direct la comerciant (externalizat)

Acest model este permis EXCLUSIV
comercianților autorizați (B2C).

Flux:
- clientul plătește direct comerciantului,
- DROPi NU gestionează banii produsului,
- DROPi facturează separat livrarea
  și eventual taxele de listare.

În acest model:
- DROPi NU garantează refund-ul produsului,
- disputele comerciale sunt între client și comerciant.

Modelul trebuie afișat explicit în UI.

---

## 3. Modele financiare interzise

Următoarele modele sunt EXCLUSE:

- plăți externalizate pentru artizani sau P2P,
- plăți cash neînregistrate,
- plăți off-platform fără trasabilitate,
- tranzacții prin criptomonede (în prezent).

Orice tranzacție care nu respectă
modelele acceptate este considerată neconformă
și poate fi blocată de sistem.

---

## 4. Regimuri financiare pe tipuri de vânzători

### 4.1 Comercianți mici / locali (B2C)

- pot utiliza Model A sau Model B,
- pot avea mini-market integrat,
- DROPi percepe comisioane conform contractului.

---

### 4.2 Artizani și producători individuali

- sunt obligați să utilizeze Model A,
- NU pot externaliza plățile,
- toate tranzacțiile sunt procesate prin DROPi.

Motiv:
- audit,
- trasabilitate,
- aplicarea comisioanelor,
- protecția platformei.

---

### 4.3 Utilizatori P2P

- toate plățile se fac EXCLUSIV prin DROPi,
- plățile externalizate sunt interzise,
- DROPi aplică automat comisioanele.

Marketplace-ul DROPi nu funcționează
ca platformă de anunțuri fără intermediere.

---

### 4.4 Comercianți mari / supermarketuri

- NU tranzacționează financiar prin marketplace-ul public,
- operează prin canale B2B separate,
- DROPi facturează exclusiv serviciile logistice.

Fluxurile financiare ale produselor
rămân în afara marketplace-ului public DROPi.

---

## 5. Politica de anulare și consecințele financiare

Pentru FIECARE produs listat în marketplace,
comerciantul este obligat să definească
o politică de anulare financiară explicită,
corelată cu stările comenzii:

- CREATED
- SCHEDULED
- PREPARING (înainte de începere)
- PREPARING (după începere)
- READY
- IN DELIVERY

Pentru fiecare stare,
politica trebuie să conțină:
- refund permis sau interzis,
- valoare FIXĂ (sumă sau procent),
- destinația sumei (client / comerciant / DROPi).

Valorile:
- NU sunt estimative,
- NU sunt negociabile ulterior,
- NU pot fi modificate după comandă.

---

## 6. Vizibilitate și consimțământ

Politica de anulare:
- este vizibilă la listarea produsului,
- este vizibilă la checkout,
- este acceptată explicit de client.

Fără acceptarea politicii,
comanda nu poate fi plasată.

DROPi nu aplică reguli financiare
care nu au fost declarate și acceptate.

---

## 7. Anularea comenzii și execuția financiară

În momentul anulării:
- clientul este informat clar
  asupra consecințelor financiare aplicabile,
- clientul confirmă anularea în cunoștință de cauză,
- sistemul aplică automat regulile declarate.

DROPi nu arbitrează emoțional
și nu modifică politicile declarate.

---

## 8. Refund, compensare și decontare

Refund-ul și compensarea:
- sunt declanșate de evenimente operaționale,
- sunt executate de sistemul financiar,
- sunt corelate cu logurile de livrare.

DROPi:
- NU amestecă fondurile clienților cu fondurile proprii,
- utilizează conturi separate pentru escrow,
- respectă principiile de separare contabilă.

---

## 9. Audit, loguri și trasabilitate

Pentru fiecare comandă există:

- Order_ID unic,
- model financiar utilizat,
- sume implicate,
- evenimente de anulare,
- consimțământ client,
- timestamp-uri complete.

Toate datele sunt:
- auditate,
- păstrate conform legislației,
- accesibile pentru controale autorizate.

---

## 10. Ce NU face DROPi financiar

DROPi:

- NU procesează plăți neautorizate,
- NU calculează sume discreționar,
- NU modifică politici financiare post-factum,
- NU permite tranzacții off-platform necontrolate,
- NU garantează profit sau refund.

---

## 11. Rol canonic

Acest document este referință canonică pentru:

- Cap. 6 — Produsul DROPi  
- Marketplace_Controlat_DROPi.md  
- Pre_Orchestrare_Zonala.md  
- contracte comerciale  
- audit și conformitate  

Orice contradicție financiară
se corectează conform acestui document.

---

## 12. Concluzie

Marketplace-ul DROPi funcționează
pe principii de transparență,
delimitare și responsabilitate financiară.

Banii sunt:
- declarați,
- calculați,
- acceptați,
- auditați.

Aceasta este baza sustenabilității
și credibilității ecosistemului DROPi.