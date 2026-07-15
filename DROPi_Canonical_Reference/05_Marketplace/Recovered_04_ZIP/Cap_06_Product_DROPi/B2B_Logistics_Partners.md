# B2B Logistics Partners DROPi  
**Document canonic – integrarea comercianților mari și a lanțurilor logistice**

> Status: CANONIC — FROZEN  
> Ultima revizie: 28.01.2026  
> Rol: Sursă de adevăr pentru parteneriatele logistice B2B DROPi  

Acest document definește modul în care DROPi
colaborează cu comercianți mari, lanțuri comerciale,
supermarketuri și alte entități cu volum ridicat,
fără a afecta structura și funcționarea
marketplace-ului public DROPi.

---

## 1. Principiul fundamental

DROPi NU tratează comercianții mari
ca vânzători standard din marketplace.

Aceștia sunt integrați exclusiv ca:
- **parteneri logistici B2B**,
- **clienți de infrastructură DROPi**,
- **surse de volum operațional constant**.

Marketplace-ul public DROPi
nu este un catalog general de produse
și nu este destinat expunerii masive de SKU-uri.

---

## 2. Delimitare structurală

Există o separare strictă între:

- **Marketplace-ul public DROPi**
  (comercianți mici, artizani, P2P)

și

- **Canalele B2B DROPi**
  (supermarketuri, lanțuri, retaileri mari)

Această separare este:
- tehnică,
- operațională,
- financiară,
- de UX.

---

## 3. Ce NU fac partenerii B2B în DROPi

Comercianții mari și supermarketurile:

- NU listează produse individuale
  în marketplace-ul public DROPi;
- NU apar în căutarea standard de produse;
- NU utilizează mini-market integrat;
- NU concurează cu comercianții mici locali;
- NU influențează algoritmii marketplace-ului.

---

## 4. Moduri de integrare B2B permise

### 4.1 Integrare Logistic API (model principal)

- clientul comandă pe platforma partenerului;
- la checkout apare opțiunea „Livrare prin DROPi”;
- partenerul transmite cererea de livrare către DROPi;
- DROPi orchestrează livrarea complet.

DROPi facturează:
- livrarea,
- utilizarea DronePort,
- servicii logistice suplimentare.

---

### 4.2 Redirect controlat

- marketplace-ul public afișează
  un card de partener („Supermarket X”);
- clientul este redirecționat
  către platforma partenerului;
- DROPi NU gestionează comanda produsului;
- DROPi gestionează exclusiv livrarea.

---

### 4.3 Logistică B2B White-Label

- DROPi operează livrarea
  fără vizibilitate publică;
- clientul nu vede brandul DROPi;
- integrare complet contractuală B2B.

Acest model este utilizat
pentru volume foarte mari
sau cerințe operaționale speciale.

---

## 5. Rolul DronePort în B2B

Pentru partenerii B2B,
DronePort-urile DROPi pot funcționa ca:

- puncte de consolidare,
- buffer logistic,
- puncte de transfer multimodal,
- hub-uri de livrare programată.

DronePort-ul permite:
- decuplarea pregătirii de livrare,
- gestionarea volumelor mari,
- livrare etapizată către clienți finali.

---

## 6. Pre-orchestrare și predictibilitate

Partenerii B2B pot transmite:

- estimări de volum,
- ferestre orare,
- cerere programată.

DROPi utilizează aceste date
pentru:
- poziționarea piloților,
- pregătirea infrastructurii,
- reducerea timpilor morți.

Pre-orchestrarea B2B
nu interferează cu marketplace-ul public.

---

## 7. Regim financiar B2B

În parteneriatele B2B:

- DROPi NU procesează plata produselor;
- fluxurile financiare ale produselor
  rămân în sistemele partenerului;
- DROPi facturează exclusiv servicii logistice.

Plata livrării:
- este contractuală,
- bazată pe volum,
- predictibilă,
- auditată separat.

---

## 8. Clasificare de risc operațional B2B

DROPi poate clasifica partenerii B2B
pe niveluri de risc operațional,
în funcție de:

- volumul zilnic de livrări,
- criticitatea livrărilor,
- respectarea SLA-urilor,
- istoricul incidentelor.

Această clasificare:
- nu este publică,
- este utilizată exclusiv intern,
- poate influența prioritizarea resurselor
  și condițiile contractuale.

---

## 9. Limitarea volumului B2B per zonă

DROPi își rezervă dreptul
de a limita temporar sau permanent
volumul livrărilor B2B într-o zonă,
în cazul în care:

- capacitatea operațională este depășită,
- marketplace-ul public ar fi afectat,
- apar riscuri de siguranță sau performanță.

Această limitare:
- este o măsură de protecție sistemică,
- nu constituie încălcarea contractului,
- este aplicată conform regulilor interne.

---

## 10. Suspendare operațională B2B

DROPi poate suspenda temporar
livrările unui partener B2B
în situații precum:

- incidente de siguranță,
- volume neanunțate,
- nerespectarea regulilor operaționale,
- risc major pentru ecosistem.

Suspendarea:
- este documentată,
- este auditată,
- poate fi ridicată
  după remedierea cauzelor.

---

## 11. Audit, loguri și responsabilitate

Pentru fiecare livrare B2B:

- există identificator unic;
- sunt logate:
  - cererea,
  - execuția,
  - livrarea,
  - incidentele;
- responsabilitățile sunt clar delimitate.

DROPi răspunde exclusiv
pentru execuția logistică,
nu pentru conținutul comenzilor B2B.

---

## 12. Ce NU face DROPi în B2B

DROPi:

- NU devine marketplace-ul supermarketurilor;
- NU gestionează catalogul lor;
- NU preia responsabilități comerciale;
- NU garantează stocuri sau prețuri;
- NU interferează cu relația client–partener.

---

## 13. Rol canonic

Acest document este referință canonică pentru:

- Cap. 6 — Produsul DROPi  
- Marketplace_Controlat_DROPi.md  
- Marketplace_Financial_Flow.md  
- Pre_Orchestrare_Zonala.md  
- contracte B2B și integrare tehnică  

Orice integrare B2B
se face exclusiv conform acestui document.

---

## 14. Concluzie

DROPi tratează partenerii mari
nu ca vânzători,
ci ca **clienți de infrastructură logistică**.

Separarea dintre marketplace-ul public
și canalele B2B:
- protejează ecosistemul,
- permite scalare,
- asigură profitabilitate,
- menține controlul și claritatea.

Acesta este modelul B2B DROPi.