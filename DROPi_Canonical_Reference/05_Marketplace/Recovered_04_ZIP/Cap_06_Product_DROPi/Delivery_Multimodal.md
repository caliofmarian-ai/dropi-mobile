# Delivery Multimodal DROPi  
**Document canonic – execuția livrării prin drone, terestru și fluxuri combinate**

> Status: CANONIC — FROZEN  
> Ultima revizie: 28.01.2026  
> Rol: Sursă de adevăr pentru execuția livrărilor în ecosistemul DROPi  

Acest document definește modul în care DROPi
execută livrările prin mai multe moduri (multimodal),
fără a compromite controlul, siguranța,
auditul sau responsabilitatea juridică.

---

## 1. Principiul fundamental

DROPi nu este curier clasic
și nu execută livrări „la întâmplare”.

Livrarea DROPi este:
- **multimodală**,
- **supervizată**,
- **controlată algoritmic**,
- **executată de piloți independenți**.

Nicio livrare nu pornește
în afara regulilor definite în acest document.

---

## 2. Moduri de livrare acceptate

DROPi acceptă următoarele moduri de livrare:

- 🚁 **Dronă**
- 🚗 **Auto**
- 🚐 **Van**
- 🚲 **Bicicletă electrică**
- 🔄 **Multimodal** (ex: comerciant → DronePort → client)

Fiecare livrare poate utiliza:
- un singur mod,
- sau mai multe moduri succesive,
în funcție de eligibilitate și capacitate.

---

## 3. Eligibilitatea modului de livrare

Eligibilitatea se evaluează de sistem
în funcție de:

- dimensiunea și greutatea coletului,
- categoria produsului,
- zona de livrare,
- infrastructura disponibilă,
- condițiile meteo,
- disponibilitatea piloților.

Afișarea eligibilității:
- este informativă,
- nu reprezintă promisiune,
- poate fi modificată operațional.

Decizia finală aparține
exclusiv aplicației DROPi,
în starea READY.

---

## 4. Rolul pilotului (self-employed)

Livrările sunt executate de:
- piloți independenți (self-employed),
- înregistrați în platformă,
- cu vehicule proprii sau închiriate.

Pilotul:
- NU este angajat DROPi,
- NU reprezintă DROPi comercial,
- răspunde pentru execuția livrării.

DROPi:
- selectează,
- supervizează,
- auditează,
dar NU execută fizic livrarea.

---

## 5. Selecția pilotului

Pilotul NU este ales „primul care apasă”.

Selecția este făcută de sistem
pe baza:

- eligibilității tehnice,
- poziționării,
- ratingului,
- istoricului de livrări,
- mecanismelor de rotație.

Clientul:
- NU vede pilotul ales,
- NU poate alege pilotul.

---

## 6. Pornirea livrării (READY)

Livrarea poate porni
DOAR în starea **READY**.

În READY:
- comanda este validată,
- modul de livrare este confirmat,
- pilotul este selectat,
- livrarea este inițiată.

Orice execuție
în afara READY
este neconformă.

---

## 7. Livrarea cu dronă

Livrarea cu dronă
este un mod strict controlat.

Reguli obligatorii:
- clientul a ales preferința „dronă”,
- clientul a parcurs tutorialul,
- clientul a acceptat condițiile,
- punctul de recepție este valid.

Drona:
- NU așteaptă clientul,
- NU negociază recepția,
- NU repetă livrarea.

Eșecul recepției
declanșează fallback.

---

## 8. Livrarea terestră

Livrarea terestră
permite opțiuni pasive de recepționare:

- predare personală,
- lăsare la ușă,
- lăsare la poartă,
- lăsare în curte.

Riscul opțiunilor pasive
este acceptat explicit de client.

---

## 9. Livrarea prin DronePort (buffer)

DronePort funcționează ca:

- punct de consolidare,
- buffer logistic,
- hub de transfer.

Flux tipic:
- comerciant → DronePort
- DronePort → client

DronePort permite:
- livrare programată,
- reducerea presiunii pe client,
- livrare etapizată.

---

## 10. Fallback operațional

Fallback este declanșat în situații precum:

- indisponibilitate pilot,
- eșec recepție,
- condiții meteo nefavorabile,
- incident tehnic.

Fallback poate include:
- redirecționare către DronePort,
- schimbare mod de livrare,
- return către comerciant.

Fallback NU este eșec;
este mecanism de siguranță.

---

## 11. STOP de siguranță

DROPi poate opri o livrare
prin mecanismul **STOP**
în caz de:

- risc de siguranță,
- incident tehnic,
- condiții neconforme,
- instrucțiuni autorități.

STOP:
- este imediat,
- este logat,
- este auditat.

---

## 12. Gestionarea incidentelor

Incidentele sunt:

- clasificate,
- documentate,
- auditate.

Pilotul este obligat să:
- raporteze incidentul,
- urmeze instrucțiunile aplicației.

DROPi:
- documentează,
- analizează,
- aplică măsuri corective.

---

## 13. Audit și loguri

Pentru fiecare livrare se loghează:

- Order_ID,
- mod de livrare,
- pilot,
- traseu,
- evenimente,
- fallback,
- timp,
- rezultat final.

Logurile sunt:
- imuabile,
- corelate,
- utilizabile în audit.

---

## 14. Ce NU face DROPi în livrare

DROPi:

- NU promite livrare instant,
- NU garantează timpi,
- NU permite execuție necontrolată,
- NU permite pilotului să decidă singur,
- NU ignoră regulile de siguranță.

---

## 15. Rol canonic

Acest document este referință canonică pentru:

- Cap. 6 — Produsul DROPi  
- Pre_Orchestrare_Zonala.md  
- Marketplace_Controlat_DROPi.md  
- Marketplace_Financial_Flow.md  
- B2B_Logistics_Partners.md  

Orice abatere
se corectează conform acestui document.

---

## 16. Concluzie

Delivery Multimodal DROPi
permite livrare flexibilă,
sigură și scalabilă,
fără a compromite controlul,
auditul sau responsabilitatea.

Aceasta este execuția DROPi.