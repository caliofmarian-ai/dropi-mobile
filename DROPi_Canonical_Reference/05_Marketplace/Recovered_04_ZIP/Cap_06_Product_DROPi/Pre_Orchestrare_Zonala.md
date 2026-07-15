# Pre-Orchestrare Zonală DROPi  
**Document canonic – mecanism de anticipare și control al livrărilor**

> Status: CANONIC — FROZEN  
> Ultima revizie: 28.01.2026  
> Rol: Sursă de adevăr pentru mecanismul de pre-orchestrare zonală DROPi  

Acest document descrie mecanismul prin care DROPi
anticipează cererea de livrare, poziționează resursele,
informează actorii implicați și gestionează capacitatea,
fără a crea promisiuni comerciale, rezervări implicite
sau obligații de execuție.

---

## 1. Definiție

Pre-orchestrarea zonală este mecanismul prin care DROPi:

- face vizibilă **intenția de livrare** înainte de execuție,
- anticipează cererea într-o zonă operațională,
- informează piloții eligibili,
- pregătește infrastructura logistică,
- fără a distribui comenzi și fără a angaja livrarea.

Anticiparea descrisă în acest document
nu implică rezervare de resurse,
pre-alocare sau obligații de execuție.

Pre-orchestrarea NU este:
- distribuire de comenzi,
- alocare de piloți,
- promisiune de livrare,
- contract de execuție.

---

## 2. Rolul pre-orchestrării în ecosistem

Pre-orchestrarea zonală există pentru a:

- reduce timpii de așteptare,
- evita reacțiile haotice,
- crește eficiența livrării cu drone,
- permite fallback controlat către livrare terestră,
- oferi vizibilitate operațională fără obligații.

Este un mecanism **informațional și pregătitor**, nu executiv.

Pre-orchestrarea zonală
poate funcționa independent
de disponibilitatea livrării cu drone.

În anumite zone sau condiții,
livrările cu drone pot fi excluse
din pre-orchestrare,
fără a afecta mecanismul general
de anticipare și livrare terestră.


---

## 3. Stările pre-orchestrării

DROPi utilizează următoarele stări relevante
pentru pre-orchestrare:

- **CREATED** – comandă plasată, neacceptată
- **SCHEDULED** – comandă programată pentru o dată viitoare
- **PREPARING** – pregătire efectivă în curs
- **READY** – comandă gata de livrare

Doar stările PREPARING și READY
activează mecanismele operaționale descrise mai jos.

---

## 3A. Estimarea timpului până la READY

La intrarea unei comenzi în starea **PREPARING**,
entitatea care pregătește coletul
(comerciant, artizan, expeditor P2P)
este obligată să selecteze un **interval estimativ**
pentru durata pregătirii până la starea READY.

Această estimare:
- este furnizată exclusiv de partea care pregătește coletul,
- este exprimată ca interval (nu timp fix),
- are rol informativ și operațional,
- nu constituie o promisiune de livrare.

Pilotul:
- nu furnizează,
- nu validează,
- nu influențează
estimarea timpului de pregătire.

Sistemul DROPi utilizează această estimare
doar ca referință pentru pre-orchestrare,
corelare zonală și anticipare logistică,
fără a crea obligații de execuție.

---

## 3B. Preferința de livrare și recepționare (alegerea clientului)

La momentul plasării comenzii,
clientul este obligat să selecteze
o **preferință de livrare** și un **mod de recepționare**,
în funcție de eligibilitatea produsului.

Preferința de livrare poate include:
- livrare terestră,
- livrare cu dronă (dacă produsul este eligibil).

Pentru livrarea terestră,
clientul poate selecta opțiuni pasive de recepționare,
precum:
- predare personală,
- lăsarea coletului la ușă,
- lăsarea coletului la poartă,
- lăsarea coletului în curte sau alt punct permis.

Pentru livrarea cu dronă,
clientul trebuie să accepte condiții suplimentare,
incluzând:
- prezența fizică la punctul de întâlnire
  sau acceptarea unui punct de drop predefinit,
- faptul că drona nu așteaptă recepționarea,
- faptul că eșecul recepționării declanșează
  proceduri de fallback (DronePort, livrare terestră, return).

Selectarea preferinței de livrare
nu constituie o garanție de execuție.
Confirmarea finală a metodei de livrare
are loc exclusiv în starea READY,
în funcție de capacitatea operațională reală.

---

## 3C. Informarea clientului și consimțământul operațional

Pe durata stărilor PREPARING și READY,
clientul poate primi notificări informative
privind statusul comenzii și opțiunile disponibile.

Aceste notificări:
- au caracter informativ,
- nu constituie promisiuni de livrare,
- nu obligă clientul la acțiune imediată.

Lipsa unei acțiuni din partea clientului
în intervalele de informare
este interpretată ca acceptare
a continuării procesului standard de livrare,
conform regulilor aplicației DROPi.

Toate notificările și alegerile clientului
sunt înregistrate în logurile aplicației,
în scop de audit și trasabilitate.

Informațiile furnizate clientului
în stările PREPARING și READY
nu includ poziții exacte ale piloților,
identitatea acestora
sau garanții privind disponibilitatea reală,
ci exclusiv informații agregate și estimative.

---

## 3D. Timeout operațional în starea PREPARING

Starea PREPARING este supusă unui timeout operațional,
definit de sistem, pentru a preveni blocaje
și acumulări artificiale de cerere.

Dacă durata PREPARING depășește semnificativ
intervalul estimativ selectat de expeditor,
sistemul poate:
- solicita reconfirmarea stării de către expeditor,
- actualiza informarea clientului,
- suspenda temporar comanda din pre-orchestrare,
- sau anula procesul, conform regulilor aplicației.

Aplicarea timeout-ului:
- nu constituie penalizare automată,
- nu creează obligații de livrare,
- este documentată integral în logurile de sistem.

Starea PREPARING
nu implică rezervarea unui pilot,
pre-alocare de resurse
sau angajament de execuție
din partea DROPi sau a piloților.


---

## 3E. Comenzi programate (SCHEDULED)

DROPi permite comenzi programate,
în care pregătirea coletului
nu are loc în aceeași zi cu plasarea comenzii.

În acest caz, comanda intră în starea **SCHEDULED**,
unde expeditorul selectează
o dată sau un interval planificat pentru READY.

Starea SCHEDULED:
- nu activează pre-orchestrarea,
- nu este vizibilă în panoul piloților ca livrare imediată,
- are rol de planificare și informare.

Comanda trece din SCHEDULED în PREPARING
doar când expeditorul începe pregătirea efectivă,
în apropierea datei planificate.

---

## 3F. Programarea livrării și utilizarea DronePort

DROPi permite clientului să programeze livrarea
pentru o dată și un interval orar dorit,
în special în cazul comenzilor SCHEDULED.

Programarea livrării:
- reprezintă o preferință operațională,
- este exprimată ca interval orar,
- nu constituie o garanție de execuție la oră fixă.

Clientul poate alege strategia de predare a coletului:
- livrare direct de la comerciant,
- livrare etapizată prin cel mai apropiat DronePort.

În cazul livrării prin DronePort:
- coletul este livrat inițial de la comerciant la DronePort,
- DronePort-ul funcționează ca punct de buffer și transfer,
- livrarea finală către client are loc ulterior,
  în fereastra programată sau când clientul este disponibil.

Confirmarea finală a modului de livrare
are loc exclusiv în starea READY,
în funcție de capacitatea operațională reală.

---

## 3G. Anularea comenzii și consecințele declarate

Anularea comenzilor este permisă
doar în stările non-executive
(CREATED, SCHEDULED, PREPARING),
în condiții strict controlate.

Regulile de anulare aplicabile comenzilor
sunt declarate și acceptate
încă din momentul listării produsului
în marketplace și al plasării comenzii.

Atât comerciantul, cât și clientul
sunt informați explicit că:
- anularea este permisă doar în anumite stări,
- anularea poate avea consecințe,
- regulile diferă în funcție de stadiul comenzii.

Evenimentele de anulare
generează semnale operaționale
către sistemul financiar DROPi,
care aplică regulile de plată,
compensare sau refund
conform politicilor financiare în vigoare.

Pre-orchestrarea nu gestionează
fluxuri financiare
și nu execută tranzacții monetare.

---

## 4. Vizibilitatea pentru piloți (awareness)

În starea PREPARING,
piloții self-employed eligibili din zonă
pot vedea informații agregate
privind activitatea operațională,
fără a primi comenzi
și fără a se crea obligații de execuție.

### 4.1 Vizibilitatea comenzilor din Marketplace-ul public

Pentru comenzile provenite din Marketplace-ul public,
piloții pot vedea informații agregate precum:
- zonă aproximativă;
- tipuri de livrare anticipate;
- interval estimativ până la READY;
- volum agregat;
- număr de piloți eligibili în zonă.

Aceste informații au rol exclusiv informativ
și nu reprezintă promisiuni,
rezervări sau drepturi de alocare.

### 4.2 Vizibilitatea comenzilor din canale private (COS / EOC)

Pentru comenzile provenite din canale private
(COS și EOC),
piloților li se afișează
un indicator numeric agregat,
distinct de comenzile marketplace-ului public,
care reprezintă exclusiv
numărul de comenzi aflate în starea PREPARING
în zona respectivă.

Pentru aceste comenzi:
- nu sunt afișate adrese;
- nu sunt afișați parteneri sau clienți;
- nu sunt afișate tipuri de marfă;
- nu sunt afișate valori comerciale.

Indicatorul numeric:
- se actualizează dinamic
  pe măsură ce comenzile intră în READY
  și sunt distribuite și acceptate;
- reflectă exclusiv comenzile private
  care pot fi executate de piloți self-employed;
- nu include comenzile partenerilor
  care operează exclusiv cu flotă proprie.

### 4.3 Indicatorul de probabilitate și raportul cerere–ofertă

Platforma poate afișa,
în mod informativ,
un indicator de probabilitate
calculat dinamic
pe baza raportului dintre:
- numărul de comenzi în PREPARING
  (publice și private, afișate distinct),
- numărul de piloți self-employed activi în zonă.

Acest indicator:
- nu reprezintă un drept;
- nu poate fi influențat manual;
- nu constituie promisiune,
  rezervare sau garanție de alocare;
- include mecanisme de rotație echitabilă.

Indicatorul de probabilitate
nu are caracter contractual
și nu poate fi utilizat
ca bază pentru reclamații
sau pretenții de alocare.

### 4.4 Limitarea informațiilor și protecția împotriva așteptărilor false

Informațiile afișate piloților
în starea PREPARING:
- sunt agregate și estimative;
- nu includ poziții exacte ale piloților;
- nu includ identități;
- nu reflectă capacitatea reală garantată.

La intrarea comenzilor în starea READY,
informațiile de pre-orchestrare dispar,
iar procesul de distribuție efectivă
este gestionat exclusiv de aplicația DROPi,
conform regulilor interne.

Vizibilitatea oferită prin pre-orchestrare
are rolul de a sprijini decizia pilotului
privind disponibilitatea,
fără a crea așteptări individuale,
presiune operațională
sau obligații de execuție.

Notă de implementare:
Indicatorii afișați în pre-orchestrare
sunt concepuți pentru informare operațională,
nu pentru a crea așteptări individuale.
Afișarea, frecvența de actualizare
și mesajele asociate trebuie calibrate
pentru a preveni supra-așteptarea piloților
și pentru a reflecta onest raportul cerere–ofertă.

---

## 5. Harta zonală

Harta cerere–ofertă:
- este internă,
- nepublică,
- neexportabilă,
- utilizată exclusiv operațional.

---

## 6. READY și distribuția

READY este singura stare
în care începe distribuția efectivă.

Clientul poate alege
strategii de timp
(doar atunci),
iar aplicația alocă
pilotul conform regulilor interne.

---

## 7. Rol canonic

Acest document este referință canonică pentru:

- Cap. 6 — Produsul DROPi  
- Cap. 8 — Aplicația  
- Cap. 11 — Livrare  

Orice abatere se corectează
conform acestui document.

---

## 8. Concluzie

Pre-orchestrarea zonală DROPi
transformă cererea haotică
în flux predictibil,
fără a compromite
controlul, auditul sau responsabilitatea.

Acesta este mecanismul
care face livrarea scalabilă și sigură.