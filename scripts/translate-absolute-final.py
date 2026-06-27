#!/usr/bin/env python3
"""Absolute final pass: translate the last 44 remaining Romanian strings."""

import os

BASE = "/home/ubuntu/dropi-mobile"

FILE_REPLACEMENTS = {
    "app/(tabs)/authorities.tsx": [
        ("Național", "National"),
    ],
    "app/(tabs)/accounting.tsx": [
        ("• E-Bike oferă cea mai bună margin (28%) pentru distanțe scurte (<3km)", "• E-Bike offers the best margin (28%) for short distances (<3km)"),
        ("• Drona este optimă pentru deliveries rapide cu margin de 22%", "• Drone is optimal for fast deliveries with 22% margin"),
    ],
    "app/order/[id].tsx": [
        ('personal: "🤝 Predare personală",', 'personal: "🤝 Personal handoff",'),
        ('door: "🚪 La ușă",', 'door: "🚪 At the door",'),
        ('gate: "🏠 La poartă",', 'gate: "🏠 At the gate",'),
        ('yard: "🌳 În curte",', 'yard: "🌳 In the yard",'),
        ('"Dronă în zbor spre locația ta"', '"Drone flying to your location"'),
        ('"Vehicul auto în drum spre tine"', '"Car on its way to you"'),
        ('"Van în drum spre tine"', '"Van on its way to you"'),
        ('"Curier pe bicicletă electrică în drum"', '"E-bike courier on the way"'),
        ("FALLBACK (dacă metoda primară eșuează):", "FALLBACK (if primary method fails):"),
        ("PUNCT DE RECEPȚIE:", "RECEPTION POINT:"),
        ("ℹ️ Metoda de livrare afișată este cea selectată de platformă. Badge-urile din marketplace sunt informative.", "ℹ️ The delivery method shown is selected by the platform. Marketplace badges are informational."),
        ("Platforma poate schimba metoda în orice moment (meteo, capacitate, urgență). Fallback-ul se activează automat.", "The platform may change the method at any time (weather, capacity, emergency). Fallback activates automatically."),
    ],
    "app/merchant-order/[id].tsx": [
        ("Comanda nu a fost găsită", "Order not found"),
        ('Alert.alert("Status Actualizat", "Comanda este acum în pregătire.");', 'Alert.alert("Status Updated", "Order is now in preparation.");'),
        ('Alert.alert("Colet Gata", "Comanda marcată ca gata de ridicare. Un pilot/șofer va fi asignat.");', 'Alert.alert("Package Ready", "Order marked as ready for pickup. A pilot/driver will be assigned.");'),
        ('Alert.alert("Raportare Problemă", "Problema a fost raportată echipei de operațiuni.");', 'Alert.alert("Report Issue", "Issue has been reported to the operations team.");'),
        ("Articole de Pregătit", "Items to Prepare"),
        ("• Coletul trebuie securizat pentru zbor (vibrații)", "• Package must be secured for flight (vibrations)"),
        ("• Etichetă QR obligatorie pe colet", "• QR label mandatory on package"),
        ("• Packaging rezistentă la manipulare multiplă", "• Packaging resistant to multiple handling"),
        ("• Etichetă QR + cod de transfer obligatoriu", "• QR label + transfer code mandatory"),
        ("• Etichetă cu adresa de livrare vizibilă", "• Label with visible delivery address"),
        ("• Protecție adecvată pentru tipul produsului", "• Adequate protection for product type"),
        ('"Se așteaptă Șofer/Curier"', '"Waiting for Driver/Courier"'),
    ],
    "app/product/[id].tsx": [
        ('"Adăugat în coș ✓"', '"Added to cart ✓"'),
        ('"Vezi coșul"', '"View cart"'),
        ("Zonă", "Zone"),
        ("Badge-urile indică modurile posibile. Metoda finală este decisă de platformă.", "Badges indicate possible modes. Final method is decided by the platform."),
        ("Prin selectarea livrării cu dronă, accept următoarele condiții:", "By selecting drone delivery, I accept the following conditions:"),
    ],
    "app/cart.tsx": [
        ('{ id: "personal", label: "Predare personală", icon: "🤝", description: "Clientul preia personal coletul" },', '{ id: "personal", label: "Personal handoff", icon: "🤝", description: "Client picks up the package personally" },'),
        ('{ id: "door", label: "La ușă", icon: "🚪", description: "Lăsat la ușa de intrare" },', '{ id: "door", label: "At the door", icon: "🚪", description: "Left at the front door" },'),
        ('{ id: "gate", label: "La poartă", icon: "🏠", description: "Lăsat la poartă" },', '{ id: "gate", label: "At the gate", icon: "🏠", description: "Left at the gate" },'),
        ('{ id: "yard", label: "În curte", icon: "🌳", description: "Lăsat în curte (risc acceptat)" },', '{ id: "yard", label: "In the yard", icon: "🌳", description: "Left in the yard (risk accepted)" },'),
        ("Comanda va fi validată de platformă. Metoda finală de livrare este decisă de DROPi.", "Order will be validated by the platform. Final delivery method is decided by DROPi."),
        ("Coș (", "Cart ("),
        ("Punct de recepție", "Reception point"),
        ("⚠️ Informare Canonică", "⚠️ Canonical Notice"),
        ("• Badge-urile de livrare sunt informative, nu garanții", "• Delivery badges are informational, not guarantees"),
        ("• Metoda finală de livrare este decisă exclusiv de platformă", "• Final delivery method is decided exclusively by the platform"),
        ("• Marketplace-ul inițiază cererea, aplicația validează și orchestrează", "• Marketplace initiates the request, app validates and orchestrates"),
        ("• Opțiunile pasive de recepție (ușă/poartă/curte) = risc acceptat de client", "• Passive reception options (door/gate/yard) = risk accepted by client"),
    ],
}

total_replacements = 0

for rel_path, replacements in FILE_REPLACEMENTS.items():
    filepath = os.path.join(BASE, rel_path)
    if not os.path.exists(filepath):
        print(f"SKIP (not found): {rel_path}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    file_count = 0
    for old, new in replacements:
        if old in content:
            count = content.count(old)
            content = content.replace(old, new)
            file_count += count
    
    if file_count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ {rel_path}: {file_count} replacements")
        total_replacements += file_count
    else:
        print(f"  {rel_path}: no matches found")

print(f"\nTotal: {total_replacements} replacements across all files")
