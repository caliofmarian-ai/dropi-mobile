# CAPITOLUL 6 — PRODUSUL DROPi (v2)
**Structura produsului și delimitarea canalelor operaționale**

Status: CANONIC — DRAFT  
Ultima revizie: 28.01.2026  
Rol: Definirea clară a produsului DROPi, a componentelor sale și a canalelor de operare, ca bază pentru implementarea aplicației (Cap. 8) și pentru delimitările de răspundere și compliance (Cap. 12)

---

## 6.0 Introducere — Ce este produsul DROPi (pe înțelesul tuturor)

DROPi nu este o „aplicație de livrări” clasică și nici un marketplace simplu.
DROPi este o platformă care organizează livrări prin mai multe canale distincte,
cu reguli diferite de acces, execuție și răspundere.

Motivul pentru care produsul DROPi este „mai mult decât o aplicație” este simplu:
în logistică apar situații foarte diferite, cu cerințe diferite de control.

Exemple:
- livrări comerciale obișnuite (public) — unde piloții sunt self-employed și acceptă voluntar;
- operațiuni controlate (private/instituționale) — unde o entitate poate cere control, confidențialitate, audit separat;
- urgențe / necesitate — unde se activează scenarii speciale, dar siguranța rămâne prioritatea absolută.

DROPi rezolvă această diversitate printr-o arhitectură de produs împărțită în:
1) o componentă publică (Marketplace Comercial),
2) un sistem de operațiuni controlate (COS — Controlled Operations System),
3) infrastructură de suport și audit (DronePort, loguri, guvernanță).

Scopul acestui capitol este să definească produsul DROPi clar și complet,
astfel încât oricine (investitor, partener, autoritate, echipă tehnică)
să înțeleagă:
- ce există în produs,
- cum se separă canalele,
- cine execută livrările,
- cine este responsabil pentru ce.

---

## 6.1 Definiții canonice (terminologie de bază)

Această secțiune definește termenii folosiți în documentația DROPi.
Este important ca acești termeni să fie înțeleși identic de toți actorii,
pentru a evita confuzii legale și operaționale.

### 6.1.1 „Ecosistemul DROPi”
Ecosistemul DROPi = toate rolurile, canalele și regulile prin care platforma permite livrări coordonate:
- clienți,
- comercianți,
- piloți,
- entități private cu logistică proprie,
- autorități,
- DronePort-uri,
- canale publice și private.

Ecosistemul este conceptul larg.
Produsul este partea structurată și implementabilă a acestui ecosistem.

### 6.1.2 „Produsul DROPi”
Produsul DROPi = setul de componente și canale care există efectiv în platformă
și care pot fi implementate, operate, auditate și monetizate.

În practica DROPi, produsul este împărțit în:
- Marketplace Comercial (public),
- COS (operațiuni controlate),
- Infrastructură (DronePort + audit/logare).

### 6.1.3 „Marketplace Comercial (Public)”
Marketplace Comercial = zona publică a DROPi, destinată comerțului standard:
- comercianți mici/medii își expun oferta,
- clienții comandă,
- livrările sunt executate de piloți self-employed.

Marketplace-ul NU oferă:
- alocare manuală către un pilot anume,
- control asupra flotei,
- confidențialitate avansată,
- audit separat pe entitate.

Marketplace-ul este construit pentru:
- volum,
- acces ușor,
- reguli uniforme pentru toți.

### 6.1.4 „Pilot self-employed”
Pilot self-employed = pilot independent (nu angajat DROPi) care execută livrări în marketplace.
Caracteristici:
- acceptă comenzi voluntar,
- poate refuza fără a fi „obligat” ca angajat,
- lucrează ca prestator independent.

Important:
Self-employed ≠ „pilot fără reguli”.
Înseamnă doar că nu există raport de muncă între pilot și DROPi.

### 6.1.5 „COS — Controlled Operations System”
COS = componenta produsului DROPi pentru operațiuni controlate, private sau instituționale.

COS există pentru situații în care marketplace-ul public nu este suficient,
de exemplu când o entitate are nevoie de:
- control asupra alocării misiunilor,
- confidențialitate ridicată,
- audit separat,
- separare completă față de piața publică.

COS NU este „urgență” prin definiție.
COS este despre CONTROL operațional.
Urgența este doar un posibil scenariu de utilizare.

### 6.1.6 „COS — Modul 1” (Execuție prin ecosistemul DROPi)
COS Modul 1 = entitatea folosește canal COS, dar execuția livrărilor este realizată
de piloții self-employed ai ecosistemului DROPi, în baza unui contract COS.

Pe scurt:
- entitatea cere control și separare,
- DROPi orchestrează,
- piloții sunt tot self-employed (voluntar).

### 6.1.7 „COS — Modul 2” (Execuție proprie a entității)
COS Modul 2 = entitatea are flotă proprie (drone/vehicule) și personal propriu (angajat/contractat),
iar DROPi furnizează platforma ca sistem de orchestrare logică și audit.

Pe scurt:
- entitatea execută,
- entitatea este responsabilă pentru autorizații și operare,
- DROPi nu preia răspundere pentru execuția umană sau pentru echipamentele entității.

### 6.1.8 „EOC / canal de urgență”
EOC (Emergency Operations Channel) = canal dedicat pentru solicitări speciale,
folosit în scenarii de urgență/necesitate sau priorități critice, conform regulilor din Cap. 12 și PB-07.

Important:
- EOC este un „canal” (transportă solicitări speciale),
- COS este „sistem” (regim de operare controlată).
În practică, EOC poate fi o interfață/flow din cadrul COS.

### 6.1.9 „Orchestrare” (în DROPi)
Orchestrare = coordonare logică a fluxurilor (cine primește ce, când, pe ce reguli),
fără a însemna comandă ierarhică asupra oamenilor.

DROPi orchestrează:
- fluxuri,
- reguli,
- validări,
- audit.

DROPi NU „comandă” personalul entităților terțe.

### 6.1.10 „Audit” și „loguri”
Audit = capacitatea de a reconstrui factual un eveniment:
- cine a cerut,
- ce s-a decis,
- ce s-a executat,
- ce s-a oprit și de ce.

Loguri = datele tehnice care susțin auditul.
Auditul în DROPi este:
- tehnic,
- informațional,
- orientat spre trasabilitate,
nu disciplinar asupra terților.

---

## 6.2 De ce DROPi are mai mult de un produs

Majoritatea platformelor de livrare încearcă să rezolve
toate tipurile de cereri printr-un singur model operațional.
Această abordare funcționează doar pentru scenarii simple
și generează probleme serioase atunci când complexitatea crește.

DROPi pornește de la o realitate diferită:
în logistică nu există un singur tip de livrare,
un singur tip de actor
sau un singur nivel de control necesar.

---

### 6.2.1 Problema unui produs unic în logistică

Un produs unic care încearcă să acopere toate scenariile
duce inevitabil la conflicte între:

- livrări comerciale obișnuite (volum mare, reguli simple);
- livrări care necesită control, confidențialitate sau audit;
- situații de urgență sau necesitate;
- actori cu statut juridic diferit
  (self-employed, angajați, instituții).

În astfel de sisteme apar frecvent:
- confuzii de responsabilitate;
- presiuni asupra piloților;
- promisiuni nerealiste către clienți;
- blocaje operaționale;
- risc legal și reputațional.

DROPi evită aceste probleme
prin separarea produsului
în componente distincte,
fiecare optimizată pentru un tip clar de utilizare.

---

### 6.2.2 Logica separării în DROPi

DROPi separă produsul
nu din motive de complexitate tehnică,
ci din motive de claritate operațională și juridică.

Principiul de bază este următorul:
actori diferiți, cu nevoi diferite,
nu trebuie forțați să funcționeze
sub aceleași reguli.

De exemplu:
- un comerciant mic nu are nevoie de control asupra flotei;
- un lanț mare de magazine nu poate opera eficient
  fără control și audit intern;
- o autoritate publică are obligații legale
  diferite față de un actor privat;
- un pilot self-employed nu poate fi tratat
  ca un angajat cu obligație de execuție.

Separarea produsului permite fiecărui actor
să opereze într-un cadru adecvat,
fără a afecta restul ecosistemului.

---

### 6.2.3 Cele trei produse DROPi (viziune de ansamblu)

Pe baza acestor diferențe,
DROPi este construit în jurul
a trei produse complementare:

1) **Marketplace Comercial (Public)**  
   – pentru livrări comerciale standard,
     cu piloți self-employed
     și reguli uniforme;

2) **COS — Controlled Operations System**  
   – pentru operațiuni controlate,
     private sau instituționale,
     cu separare completă față de piața publică;

3) **Infrastructura DROPi**  
   – DronePort, audit, logare și suport decizional,
     care susțin ambele produse
     fără a le amesteca.

Fiecare produs este clar delimitat,
dar interoperabil atunci când este necesar,
prin reguli explicite.

---

### 6.2.4 Beneficiile acestei abordări

Separarea produsului în DROPi permite:

- scalare fără blocaje;
- protecția piloților self-employed;
- integrarea actorilor mari
  fără a destabiliza marketplace-ul;
- gestionarea urgențelor
  fără a transforma platforma
  într-un serviciu public;
- claritate pentru investitori și autorități.

Această arhitectură
nu este o limitare,
ci un avantaj competitiv structural.

---

### 6.2.5 Consecință pentru capitolele următoare

Din această structură rezultă direct:

- **Cap. 7 (Site)** explică produsele,
  fără a expune canale private;
- **Cap. 8 (Aplicația)** implementează
  roluri, conturi și reguli diferite;
- **Cap. 12 (Urgențe & Compliance)** definește
  limitele, nu funcționalitățile;
- contractele și politicile
  diferă în funcție de produs.

Capitolul 6 este punctul
din care toate aceste diferențe
devin clare și ne-negociabile.

---

## 6.3 Marketplace Comercial (Public)

Marketplace-ul comercial DROPi este componenta publică a produsului DROPi,
destinată inițierii livrărilor comerciale și comunitare
într-un cadru controlat, zonal și auditat.

Marketplace-ul:
- NU este un marketplace deschis necontrolat;
- NU este un spațiu de negociere liberă;
- NU este un sistem de licitații;
- NU este un operator de transport;
- NU oferă acces implicit la livrări cu drone.

Rolul marketplace-ului este
de a facilita întâlnirea cererii cu oferta
și inițierea livrării,
fără a transfera către DROPi
calitatea de vânzător, producător,
distribuitor sau garant.

Această componentă este separată structural
de COS (Controlled Operations System)
și nu se amestecă cu:
- canale private;
- canale instituționale;
- operațiuni cu flotă dedicată.

---

## 6.3.0 Controlul Marketplace-ului și al livrărilor

Marketplace-ul comercial DROPi este un marketplace CONTROLAT,
nu un spațiu deschis nefiltrat.

Controlul este aplicat unitar pe următoarele niveluri:
- control la postare (categorii permise, restricții);
- control la vizibilitate (zonare geografică);
- control logistic (capacitate, siguranță, infrastructură);
- control al eligibilității pentru livrarea cu dronă.

Publicarea unei listări este condiționată de validarea acesteia
conform regulilor platformei DROPi.
Nu toate produsele sau categoriile sunt acceptate.
DROPi poate respinge, limita sau retrage o listare
în orice moment, în funcție de siguranță, conformitate și risc.

Publicarea unei listări NU garantează livrarea
și NU garantează livrarea cu dronă.

Livrarea cu dronă reprezintă un regim special,
disponibil doar pentru un subset de produse,
categorii și condiții validate.
Eligibilitatea este stabilită exclusiv de platformă,
în funcție de reguli operaționale și de siguranță,
și poate fi activată, limitată sau suspendată
independent de interesul comercial al vânzătorilor sau clienților.

---

### 6.3.1 Structurare pe categorii și zonare

Marketplace-ul este organizat
pe categorii de produse,
fiecare categorie având reguli dedicate
de:

- tip produs permis;
- ambalare;
- eligibilitate logistică;
- prioritate operațională.

Produsele sunt afișate și livrate
în mod **zonal by design**.

Zonarea influențează:
- vizibilitatea listărilor;
- disponibilitatea livrării;
- eligibilitatea pentru livrare cu dronă;
- infrastructura utilizabilă (ex. DronePort).

Prioritățile de livrare
(ex. alimente perisabile)
au caracter **operațional**,
nu reprezintă promisiuni absolute
și nu obligă piloții.

---

### 6.3.2 Comercianți autorizați (B2C)

Comercianții autorizați sunt entități
care desfășoară activitate comercială formală,
conform legislației aplicabile.

Aceștia:
- pot lista produse în mod continuu;
- pot gestiona cataloage proprii;
- utilizează marketplace-ul public;
- folosesc livrarea prin piloți self-employed.

Comercianții B2C:
- sunt vânzătorii legali ai produselor;
- răspund pentru calitatea și conformitatea acestora;
- nu controlează flota;
- nu desemnează manual piloți;
- nu impun priorități de livrare.

DROPi oferă exclusiv
infrastructură tehnologică și logistică.

---

### 6.3.3 Artizani și creatori independenți

Artizanii sunt persoane fizice
care produc în mod direct bunuri
manual sau semi-artizanal,
în serii mici sau unicat.

Statutul de artizan
este definit prin **producție**,
nu prin existența unei autorizații comerciale.

Artizanii:
- pot fi autorizați sau neautorizați;
- sunt considerați producători;
- listează exclusiv bunuri realizate de ei;
- utilizează marketplace-ul public;
- nu au acces la COS.

Artizanii:
- NU sunt selleri comunitari;
- NU desfășoară revânzare;
- NU includ activități de preparare alimentară.

Răspunderea pentru bunurile produse
revine exclusiv artizanului.

---

### 6.3.4 Vânzători locali de produse alimentare (Food Vendors)

Vânzătorii locali de produse alimentare
(food vendors) sunt persoane fizice
care prepară și oferă alimente
pentru consum imediat,
în mod local și de mică amploare.

Aceștia pot include:
- street food vendors;
- grill / barbecue local;
- fast food local;
- preparare de mâncare la domiciliu.

Food vendors:
- pot fi autorizați sau neautorizați,
  în funcție de cadrul legal local;
- sunt tratați ca o categorie distinctă
  datorită riscului alimentar;
- pot lista produse alimentare
  doar în categoriile permise.

Food vendors:
- NU sunt artizani;
- NU sunt selleri comunitari;
- NU beneficiază de regim COS.

DROPi:
- nu prepară alimentele;
- nu controlează procesul de gătire;
- nu garantează siguranța alimentară;
- oferă exclusiv intermediere
  logistică și tehnologică.

Răspunderea pentru produsele alimentare
revine exclusiv vânzătorului local,
conform legislației aplicabile.

---

### 6.3.5 Selleri comunitari neautorizați (listări publice ocazionale)

Sellerii comunitari neautorizați sunt
persoane fizice care publică ocazional
oferte publice pentru bunuri
pe care NU le produc,
în scop non-profesional și limitat.

Aceștia:
- nu sunt producători;
- nu sunt comercianți autorizați;
- nu desfășoară activitate repetitivă.

Pot:
- publica un număr limitat de listări;
- oferi donații;
- vinde ocazional bunuri cu preț fix.

Nu pot:
- lista permanent;
- utiliza licitații sau negociere liberă;
- beneficia de promovare avansată;
- accesa COS sau EOC.

Răspunderea pentru bunurile oferite
revine exclusiv sellerului comunitar.

---

### 6.3.6 Livrări P2P private (Peer-to-Peer)

Livrările P2P private reprezintă
transferuri directe între persoane fizice,
inițiate pentru destinatari specifici.

Caracteristici:
- nu reprezintă ofertă publică;
- nu sunt listate în marketplace;
- nu sunt browsable;
- nu au caracter comercial.

Livrările P2P:
- sunt executate exclusiv de piloți self-employed;
- au acceptare voluntară;
- nu utilizează COS sau EOC.

DROPi:
- nu devine vânzător;
- nu inspectează fizic conținutul coletului;
- impune respectarea regulilor declarative
  și tehnice privind bunurile permise,
  inclusiv pentru livrările cu drone.

Răspunderea revine exclusiv expeditorului.

---

### 6.3.7 Rolul piloților self-employed

Toate livrările din Marketplace-ul comercial
sunt executate exclusiv de piloți self-employed.

Piloții:
- nu sunt angajați DROPi;
- acceptă comenzile voluntar;
- pot refuza comenzi fără penalizare;
- nu au obligație de execuție.

Marketplace-ul nu permite:
- alocare forțată;
- desemnare manuală de piloți;
- amestec cu fluxuri COS.

---

### 6.3.8 Principii de funcționare

Marketplace-ul comercial DROPi
funcționează pe baza următoarelor principii:

- **Control la postare**
- **Structurare pe categorii**
- **Zonare geografică**
- **Selecție logistică**
- **Badge-uri informative și semnale interne**
- **Eligibilitate selectivă pentru drone**

Badge-urile pot fi utilizate
ca semnale interne pentru selecția logistică,
inclusiv eligibilitatea pentru livrare cu dronă,
fără a constitui garanții
sau promisiuni contractuale.

Marketplace-ul și COS coexistă,
dar nu se confundă.

---

## 6.4 COS — Controlled Operations System (explicat pas cu pas)

COS (Controlled Operations System) este componenta produsului DROPi
destinată operațiunilor care nu pot fi gestionate corect
prin Marketplace-ul Comercial (public).

Pe scurt:
- Marketplace = „public, uniform, self-employed, voluntar”
- COS = „privat/controlat, acces contractual, separare totală”

COS nu este un marketplace.
COS este un sistem de operare controlată,
care permite entităților (private sau instituționale)
să ruleze operațiuni cu reguli dedicate,
fără a afecta piața publică.

---

### 6.4.1 De ce există COS (problema pe care o rezolvă)

Există scenarii în care Marketplace-ul public este insuficient, de exemplu:

- o entitate are nevoie de confidențialitate ridicată;
- o entitate are nevoie de audit separat;
- o entitate are nevoie să desemneze misiuni către piloți dedicați;
- o entitate operează în mai multe locații și vrea control intern;
- o entitate are flotă proprie sau personal propriu.

Dacă am încerca să rezolvăm aceste scenarii în marketplace,
am produce:
- confuzii de responsabilitate;
- presiuni asupra piloților self-employed;
- avantaje incorecte pentru entități mari;
- risc de autorizare „prin platformă”;
- risc legal pentru DROPi.

COS există exact pentru a separa aceste situații.

---

### 6.4.2 Cine poate folosi COS

COS este accesibil doar:

- entităților private cu nevoi operaționale avansate (B2B),
- entităților instituționale (B2G),
- doar pe bază de contract,
- doar cu conturi dedicate,
- doar cu separare de date și audit.

COS nu este vizibil public
și nu este accesibil utilizatorilor marketplace standard.

---

### 6.4.3 Principiul separării COS față de Marketplace

COS și Marketplace sunt separate prin:

- conturi distincte (public vs COS);
- reguli distincte de alocare;
- date separate (audit separat);
- interfețe separate;
- canale de comandă diferite.

Regula canonică:
**niciun actor COS nu intră automat în marketplace**
și niciun actor marketplace nu intră automat în COS.

Orice trecere între canale este excepțională,
contractuală și auditată.

---

### 6.4.4 Cele două moduri COS (cheia produsului)

COS este construit cu două moduri de operare,
care pot coexista în aceeași platformă,
dar nu se amestecă implicit.

---

#### 6.4.4.A COS Modul 1 — Execuție prin ecosistemul DROPi

În COS Modul 1:
- entitatea NU are flotă proprie sau piloți proprii;
- entitatea folosește COS pentru control și separare;
- execuția livrărilor este realizată de piloții self-employed ai ecosistemului DROPi.

Acest mod este util pentru:
- faza inițială (pilotare);
- validarea operațiunilor controlate;
- entități care nu vor să investească încă în flotă.

Reguli importante:
- piloții rămân self-employed;
- acceptarea rămâne voluntară;
- COS nu transformă pilotul în angajat;
- COS oferă entității control asupra fluxului (logic),
  nu control ierarhic asupra pilotului.

---

#### 6.4.4.B COS Modul 2 — Execuție proprie a entității

În COS Modul 2:
- entitatea are flotă proprie (drone/vehicule);
- entitatea are piloți proprii (angajați sau contractați);
- entitatea are autorizații proprii pentru operare;
- DROPi furnizează platforma ca orchestrare logică, audit și coordonare.

Acest mod este util pentru:
- entități mari (lanțuri, francize, retail);
- entități cu logistică internă;
- entități care vor control complet asupra resurselor lor.

Reguli canonice:
- DROPi nu furnizează piloți în acest mod;
- DROPi nu preia obligații de execuție umană;
- DROPi nu transferă autorizare;
- răspunderea pentru operare revine entității care execută efectiv misiunea.

COS Modul 2 este un canal privat:
- nu intră în marketplace;
- nu concurează cu self-employed;
- păstrează datele separate.

Indiferent de modul COS utilizat,
operarea cu drone rămâne supusă
regulilor de siguranță,
geofencing și limitări operaționale
definite de platforma DROPi
și de cadrul legal aplicabil.

---

### 6.4.5 Tranziția între Modul 1 și Modul 2

Tranziția de la COS Modul 1 la COS Modul 2:
- nu este automată;
- nu este garantată;
- nu este unilaterală.

Este condiționată de:
- validare juridică;
- validare operațională;
- confirmarea autorizațiilor entității;
- audit de separare canale și date.

DROPi își rezervă dreptul
de a accepta sau refuza tranziția,
în funcție de conformitate și risc.

---

### 6.4.6 COS și urgențele (delimitare importantă)

COS nu este definit ca „urgență”.
COS este despre control operațional.

În situații de necesitate sau urgență:
- se pot activa scenarii speciale (Cap. 12);
- se poate folosi un canal dedicat (PB-07 / EOC),
dar regulile de siguranță și precedență rămân aceleași.

COS este infrastructura de control.
Urgența este un scenariu de utilizare,
nu o identitate a COS.

---

### 6.4.7 Ce câștigă DROPi din COS (clar pentru investitori)

COS creează valoare deoarece:
- permite colaborări cu actori mari fără a distruge marketplace-ul;
- adaugă fluxuri de venit B2B/B2G (licență, integrare, suport);
- păstrează ecosistemul public stabil;
- permite audit și separare strictă de responsabilitate.

COS este mecanismul care permite scalare „mare”
fără a compromite modelul self-employed
și fără a crea confuzii juridice.

---

## 6.5 Infrastructura DROPi

Infrastructura DROPi reprezintă stratul de suport
care permite funcționarea coerentă a produsului,
indiferent de canalul utilizat
(Marketplace Comercial sau COS).

Această infrastructură NU este un produs separat
și NU execută livrări în mod autonom.
Rolul său este de a susține,
securiza și audita operațiunile,
fără a prelua responsabilitatea execuției.

---

### 6.5.1 Rolul infrastructurii în produs

Infrastructura DROPi are următoarele funcții principale:

- susține funcționarea marketplace-ului public;
- susține canalele COS (Modul 1 și Modul 2);
- permite separarea canalelor și a datelor;
- asigură trasabilitate și audit;
- permite reacție controlată în situații speciale.

Infrastructura este neutră față de actorii implicați
și nu creează relații de subordonare
sau obligații de execuție.

---

### 6.5.2 DronePort — infrastructură fizică de suport

DronePort-urile sunt puncte logistice fizice
integrate în ecosistemul DROPi
cu rol de suport operațional.

DronePort-urile pot funcționa ca:
- puncte de transfer multimodal;
- puncte de staționare temporară;
- puncte de fallback logistic;
- puncte de consolidare a fluxurilor.

DronePort-urile NU sunt:
- centre de comandă;
- baze de operare aeriană independente;
- spații publice de distribuție;
- substitut pentru infrastructura statului.

Utilizarea DronePort-urilor
este condiționată de:
- eligibilitate de siguranță;
- reguli de acces;
- context operațional activ.
Utilizarea DronePort-urilor nu conferă drept
de operare aeriană și nu substituie
autorizările operatorilor.

---

### 6.5.3 DSS / AI asistat (suport decizional)

DROPi utilizează mecanisme de suport decizional
(DSS – Decision Support Systems),
inclusiv componente asistate de AI,
pentru a sprijini funcționarea platformei.

Rolul DSS este:
- de a propune rute;
- de a evalua capacitatea;
- de a sugera priorități;
- de a detecta conflicte sau riscuri.

Important:
DSS NU ia decizii finale
și NU comandă execuția.

Deciziile finale aparțin:
- piloților (în marketplace);
- entităților (în COS Modul 2);
- regulilor contractuale și de siguranță.

---

### 6.5.4 Sistemul de audit și logare

Infrastructura DROPi include
un sistem de logare și audit
care permite reconstrucția factuală
a oricărei operațiuni.

Acest sistem înregistrează:
- cereri;
- alocări;
- acceptări;
- refuzuri;
- opriri;
- evenimente de fallback;
- schimbări de stare.

Auditul este:
- tehnic;
- informațional;
- orientat spre trasabilitate;
nu disciplinar și nu ierarhic.

---

### 6.5.5 Separarea infrastructurii pe canale

Infrastructura DROPi este proiectată
pentru a permite separarea clară
între:

- Marketplace Comercial;
- COS privat;
- COS instituțional.

Această separare include:
- separare de date;
- separare de loguri;
- separare de acces;
- separare de vizibilitate.

Nicio componentă de infrastructură
nu permite amestecarea implicită
a canalelor sau a responsabilităților.

---

### 6.5.6 Neutralitatea juridică a infrastructurii

Utilizarea infrastructurii DROPi,
inclusiv DronePort, DSS și sistemele de audit,
nu transferă răspundere operațională
și nu creează obligații de execuție
pentru DROPi.

Responsabilitatea pentru:
- execuția livrărilor;
- operarea echipamentelor;
- deciziile umane;
- respectarea autorizațiilor,

revine exclusiv actorilor
care execută efectiv aceste acțiuni.

Infrastructura DROPi
susține produsul,
dar nu înlocuiește
responsabilitatea legală a utilizatorilor.

---

### 6.5.7 Rolul infrastructurii în scalare și reziliență

Prin această infrastructură,
DROPi poate:
- scala fără a amesteca canale;
- integra actori mari fără a destabiliza marketplace-ul;
- răspunde controlat în situații speciale;
- menține claritate juridică și operațională.

Infrastructura este astfel
un element cheie de stabilitate,
nu un factor de risc.


---

## 6.6 Separare și protecție — de ce canalele nu se amestecă

Separarea strictă dintre Marketplace-ul Comercial și COS
nu este o alegere de design arbitrară,
ci un mecanism fundamental de protecție
pentru întregul ecosistem DROPi.

Amestecarea canalelor ar crea:
- confuzii de responsabilitate;
- presiuni incorecte asupra piloților;
- avantaje neloiale pentru anumiți actori;
- risc juridic și de autorizare;
- instabilitate operațională.

Prin urmare, separarea este deliberată,
documentată și aplicată tehnic.

---

### 6.6.1 Protecția piloților self-employed

Marketplace-ul comercial funcționează
exclusiv cu piloți self-employed,
care acceptă comenzi voluntar
și nu pot fi tratați ca personal obligat.

Amestecarea cu fluxuri COS ar putea:
- crea presiuni indirecte de acceptare;
- induce așteptări de disponibilitate continuă;
- transforma voluntariatul în obligație mascată.

Separarea canalelor asigură că:
- piloții self-employed nu sunt „rezervă” pentru COS;
- piloții pot refuza fără consecințe;
- marketplace-ul rămâne un spațiu echitabil.

---

### 6.6.2 Protecția marketplace-ului public

Marketplace-ul public este construit
pentru acces larg și reguli uniforme,
în care livrările către clienți finali
sunt executate de piloți self-employed,
în regim voluntar și echitabil.

Dacă entitățile cu flotă proprie
ar livra implicit către clienți finali
prin canale paralele,
ar apărea riscul de:
- concurență incorectă cu comercianții mici;
- distorsionare a prețurilor;
- captare disproporționată a capacității logistice;
- reducere a oportunităților
  pentru piloții self-employed.

Din acest motiv,
COS Modul 2 (operare cu flotă proprie)
este destinat în principal:
- operațiunilor interne ale entității;
- livrărilor B2B;
- transferurilor între sedii;
- scenariilor instituționale sau speciale,
nu livrărilor comerciale publice către clienți finali.

Livrările comerciale către clienți finali
rămân, prin design,
în Marketplace-ul Comercial,
pentru a menține echilibrul ecosistemului.

Excepțiile sunt posibile doar
în situații limitate,
când capacitatea marketplace-ului
este temporar insuficientă,
și sunt:
- strict controlate;
- limitate în timp;
- auditate;
- fără a crea drepturi permanente
  pentru entitățile cu flotă proprie.
  
---

### 6.6.3 Protecția entităților care folosesc COS

Entitățile care utilizează COS
au nevoi diferite de marketplace:
- confidențialitate;
- control intern;
- audit separat;
- responsabilitate clar delimitată.

Amestecarea cu fluxuri publice
ar compromite aceste cerințe
și ar crea riscuri pentru entități.

Separarea canalelor permite:
- operare predictibilă;
- respectarea obligațiilor interne;
- protejarea datelor sensibile.

---

### 6.6.4 Protecția juridică și de autorizare

Din perspectivă legală,
amestecarea canalelor ar putea fi interpretată ca:
- delegare implicită de responsabilitate;
- transfer indirect de autorizare;
- control mascat asupra personalului terț.

Separarea explicită permite DROPi să demonstreze că:
- fiecare actor rămâne responsabil pentru execuția sa;
- platforma nu comandă oameni;
- utilizarea software-ului nu conferă drepturi de operare.

Această delimitare este esențială
pentru acceptabilitatea platformei
în fața autorităților.

---

### 6.6.5 Protecția împotriva conflictelor de interes

Separarea canalelor previne situații precum:
- un pilot angajat care influențează marketplace-ul;
- utilizarea infrastructurii COS pentru avantaje comerciale;
- acces preferențial mascat.

Regula canonică este:
niciun canal nu oferă avantaje
în afara regulilor sale proprii.

Excepțiile sunt:
- rare;
- contractuale;
- documentate;
- auditate.

---

### 6.6.6 Aplicarea tehnică a separării

Separarea canalelor nu este doar declarativă.
Ea este implementată prin:

- conturi distincte;
- roluri și permisiuni diferite (RBAC);
- interfețe separate;
- separare de date și loguri;
- politici de acces și audit.

Aceste mecanisme sunt detaliate
în Capitolul 8 — Aplicația DROPi.

---

### 6.6.7 Consecințe în cazul încălcării separării

Încălcarea regulilor de separare
poate duce la:

- restricționarea accesului;
- suspendarea conturilor;
- rezilierea colaborării;
- raportare internă pentru audit.

Aplicarea măsurilor este:
- proporțională;
- documentată;
- orientată spre protecția ecosistemului,
nu spre penalizare arbitrară.

---

### 6.6.8 Principiul final

Separarea canalelor în DROPi
nu limitează produsul,
ci îl face sustenabil.

Fără această separare,
platforma ar deveni:
- imprevizibilă;
- riscantă juridic;
- vulnerabilă operațional.

Cu această separare,
DROPi poate scala
fără a compromite
siguranța, echitatea
sau claritatea responsabilităților.

---

### 6.6.9 Relația dintre COS cu flotă proprie și marketplace-ul public

Pentru a menține echilibrul ecosistemului DROPi,
livrările către clienți finali
sunt realizate, prin design,
prin Marketplace-ul Comercial.

Entitățile care operează COS Modul 2
(utilizare cu flotă proprie)
nu folosesc acest canal
pentru livrări comerciale publice,
decât în situații excepționale,
când capacitatea marketplace-ului
este temporar insuficientă.

Aceste situații:
- sunt limitate în timp;
- sunt monitorizate;
- sunt auditate;
- nu conferă prioritate;
- nu creează drepturi permanente.

COS cu flotă proprie
nu înlocuiește marketplace-ul,
ci îl completează,
fără a afecta sustenabilitatea
piloților self-employed.

---

## 6.7 Rolul Capitolului 6 în arhitectura documentației DROPi

Capitolul 6 are rol canonic în documentația DROPi.
El definește produsul în sine,
structura acestuia
și delimitarea clară a canalelor de operare.

Tot ceea ce este descris în acest capitol
reprezintă **sursa de adevăr** privind:
- ce produse există în DROPi;
- cine poate utiliza fiecare produs;
- cum sunt separate canalele;
- ce tip de livrări sunt permise;
- ce tip de livrări NU sunt permise.

---

### 6.7.1 Relația cu celelalte capitole

Capitolul 6 este punctul de referință pentru:

- **Capitolul 7 — Site-ul DROPi**  
  Site-ul comunică public
  doar produsele și principiile
  definite în Capitolul 6,
  fără a expune canale private
  sau mecanisme interne.

- **Capitolul 8 — Aplicația DROPi**  
  Aplicația implementează
  rolurile, conturile,
  permisiunile (RBAC)
  și separarea canalelor
  exact așa cum sunt definite aici.

- **Capitolul 12 — Emergency, Resilience & Continuity**  
  Capitolul 12 stabilește
  limitele, răspunderea
  și regimurile speciale,
  fără a redefini produsul,
  care este deja fixat în Capitolul 6.

- **Contracte, politici și playbook-uri**  
  Toate documentele operaționale
  (PB-02, PB-07, politici de pilot,
  politici de asset alignment)
  derivă direct din structura produsului
  definită în acest capitol.

---

### 6.7.2 Precedență canonică

În cazul oricărei neconcordanțe
între descrieri de produs,
interfețe, comunicare publică
sau documente auxiliare,
**Capitolul 6 prevalează**.

Niciun alt capitol
nu poate modifica implicit:
- structura produsului;
- separarea canalelor;
- regulile de acces;
- delimitarea responsabilităților.

Modificarea produsului DROPi
se face exclusiv prin revizuirea
explicită a Capitolului 6.

---

### 6.7.3 Scopul final al Capitolului 6

Scopul acestui capitol este:
- să ofere claritate totală
  pentru investitori;
- să prevină interpretări greșite
  din partea autorităților;
- să protejeze piloții self-employed;
- să permită scalarea către B2B și instituțional
  fără a distruge marketplace-ul public;
- să creeze o bază solidă
  pentru implementarea tehnică.

Capitolul 6 nu este un document de marketing.
Este un document de arhitectură de produs,
care permite DROPi să crească
fără a-și compromite modelul.

---

### 6.7.4 Închidere de capitol

Prin definirea clară a:
- Marketplace-ului Comercial;
- COS (Controlled Operations System);
- infrastructurii de suport;
- regulilor de separare;

Capitolul 6 fixează produsul DROPi
într-o formă coerentă,
defensivă juridic
și scalabilă operațional.

Toate evoluțiile ulterioare ale platformei
trebuie să respecte structura
și principiile stabilite aici.

---

## 6.8 Capabilități transversale ale produsului (declarație de produs)

Această secțiune completează definiția produsului,
fără a introduce reguli operaționale,
care sunt definite în capitolele ulterioare.

Pe lângă separarea canonică a canalelor (Marketplace vs COS),
produsul DROPi include capabilități transversale
care susțin funcționarea controlată, zonală și auditabilă a platformei.

### 6.8.1 Pre-orchestrare zonală (Preparing Window)
DROPi include un mecanism de pre-orchestrare zonală,
prin care comenzile pot intra într-o stare de pregătire (PREPARING),
vizibile piloților eligibili din proximitate,
fără expunerea adreselor.
Comenzile devin eligibile pentru acceptare
doar la trecerea în READY.

Detaliile de implementare sunt definite în Cap. 8.

### 6.8.2 Marketplace zonal by design
Marketplace-ul este organizat pe zone geografice,
iar disponibilitatea produselor și logica livrării
sunt dependente de zone, capacitate locală și infrastructură (DronePort).
Tarifele pot reflecta distanța și traversarea de zone/DronePort.

Detaliile economice sunt definite în capitolele KPI/Unit Economics.

### 6.8.3 Semnale și badge-uri informative

Marketplace-ul utilizează semnale informative (badge-uri)
pentru a indica, în mod transparent:
- moduri posibile de livrare (drone / terestru / fallback);
- disponibilitate operațională;
- semnale de încredere și reputație.

Pe lângă rolul informativ pentru utilizatori,
semnalele și badge-urile sunt utilizate intern
de platforma DROPi
ca mecanism de selecție logistică,
inclusiv pentru stabilirea eligibilității
livrărilor cu drone.

Utilizarea internă a semnalelor și badge-urilor:
- sprijină deciziile automate ale sistemului;
- nu constituie garanții sau promisiuni contractuale;
- nu forțează execuția livrărilor;
- nu modifică responsabilitatea legală a livrării.

Detaliile de implementare,
inclusiv regulile de guvernanță și UI,
sunt definite în documentația dedicată marketplace-ului
și în Capitolul 8 — Aplicația DROPi.

Detaliile de UI și guvernanță sunt definite în documentația dedicată marketplace-ului și în Cap. 8.

### 6.8.4 Livrare multimodală și fallback
Produsul DROPi suportă livrare multimodală (drone + terestru),
cu fallback controlat în funcție de:
- limitări tehnice ale coletului,
- disponibilitatea infrastructurii și piloților,
- restricții zonale.
Detaliile operaționale sunt definite în Cap. 8 și în PB-urile relevante.

### 6.8.5 Protecția marketplace-ului public și calibrarea capacității
Produsul include mecanisme de protecție a marketplace-ului public,
pentru a preveni canibalizarea de către entități cu flotă proprie,
și poate include reguli de management al capacității
(ex: praguri min/max pentru piloți activi),
pentru a menține sustenabilitatea ecosistemului self-employed.

Detaliile sunt definite în Cap. 8 (implementare) și capitolele economice (praguri).
