#!/usr/bin/env python3
"""Third pass: translate ALL remaining Romanian diacritics in source files."""

import os

BASE = "/home/ubuntu/dropi-mobile"

FILE_REPLACEMENTS = {
    "app/mission/[id].tsx": [
        ('{ id: "weather", label: "Condiții meteo OK (vânt < 35 km/h)", checked: false },', '{ id: "weather", label: "Weather OK (wind < 35 km/h)", checked: false },'),
        ('{ id: "cargo", label: "Colet securizat & cântărit", checked: false },', '{ id: "cargo", label: "Package secured & weighed", checked: false },'),
        ('{ id: "route", label: "Rută de zbor liberă (no-fly zone clear)", checked: false },', '{ id: "route", label: "Flight route clear (no-fly zone clear)", checked: false },'),
        ('{ id: "airspace", label: "Autorizare spațiu aerian confirmată", checked: false },', '{ id: "airspace", label: "Airspace authorization confirmed", checked: false },'),
        ('{ id: "vehicle", label: "Vehicul verificat & funcțional", checked: false },', '{ id: "vehicle", label: "Vehicle checked & functional", checked: false },'),
        ('{ id: "route", label: "Rută de navigare calculată", checked: false },', '{ id: "route", label: "Navigation route calculated", checked: false },'),
        ('{ id: "fuel", label: "Combustibil/Baterie suficientă", checked: false },', '{ id: "fuel", label: "Fuel/Battery sufficient", checked: false },'),
        ("Misiune negăsită", "Mission not found"),
        ('Alert.alert("Verificare Incompletă", "Toate punctele trebuie confirmate înainte de lansare.");', 'Alert.alert("Incomplete Check", "All items must be confirmed before launch.");'),
        ('"OPRIRE DE URGENȚĂ"', '"EMERGENCY STOP"'),
        ('<Text className="text-primary text-base">← Înapoi</Text>', '<Text className="text-primary text-base">← Back</Text>'),
        ('<Text className="text-sm text-muted">Distanță</Text>', '<Text className="text-sm text-muted">Distance</Text>'),
        ('<Text className="text-white font-bold text-base">Acceptă Misiunea</Text>', '<Text className="text-white font-bold text-base">Accept Mission</Text>'),
        ('{isDrone ? "Toate punctele trebuie confirmate înainte de lansare" : "Verifică toate punctele înainte de pornire"}', '{isDrone ? "All items must be confirmed before launch" : "Verify all items before departure"}'),
        ('{allChecked ? vehicleInfo.launchText : "Completează Toate Verificările"}', '{allChecked ? vehicleInfo.launchText : "Complete All Checks"}'),
        ('<Text className="text-muted text-xs">⚡ Viteză: 65 km/h</Text>', '<Text className="text-muted text-xs">⚡ Speed: 65 km/h</Text>'),
        ('<Text className="text-muted text-xs">⚡ Viteză: 28 km/h</Text>', '<Text className="text-muted text-xs">⚡ Speed: 28 km/h</Text>'),
        ('<Text className="text-white/80 text-xs mt-0.5">Oprire Imediată — Raport Incident</Text>', '<Text className="text-white/80 text-xs mt-0.5">Immediate Stop — Incident Report</Text>'),
        ('<Text className="text-white font-semibold text-base">✓ Livrare Completă</Text>', '<Text className="text-white font-semibold text-base">✓ Delivery Complete</Text>'),
        ('<Text className="text-xl font-bold text-foreground mb-2">Misiune Completă</Text>', '<Text className="text-xl font-bold text-foreground mb-2">Mission Complete</Text>'),
        ('Raportul post-misiune a fost înregistrat în sistemul de audit.', 'Post-mission report has been recorded in the audit system.'),
        ('<Text className="text-white font-semibold">Înapoi la Misiuni</Text>', '<Text className="text-white font-semibold">Back to Missions</Text>'),
    ],
    "app/(tabs)/accounting.tsx": [
        ("Plăți în Așteptare", "Pending Payments"),
        ("Concluzii Costuri", "Cost Conclusions"),
        ("Comision platformă", "Platform commission"),
        ("Taxă procesare", "Processing fee"),
        ("Plată merchant", "Merchant payment"),
        ("Plată pilot", "Pilot payment"),
        ("Factură emisă", "Invoice issued"),
        ("Factură primită", "Invoice received"),
        ("Livrări", "Deliveries"),
        ("Venituri Totale", "Total Revenue"),
        ("Cheltuieli Operaționale", "Operational Expenses"),
        ("Profit Net", "Net Profit"),
        ("Creștere", "Growth"),
        ("Scădere", "Decrease"),
        ("Plătit", "Paid"),
        ("În Așteptare", "Pending"),
        ("Întârziat", "Overdue"),
        ("Ciornă", "Draft"),
    ],
    "app/cart.tsx": [
        ("Coș de Cumpărături", "Shopping Cart"),
        ("Coșul tău este gol", "Your cart is empty"),
        ("Adaugă produse din marketplace", "Add products from marketplace"),
        ("Plasează Comanda", "Place Order"),
        ("Subtotal", "Subtotal"),
        ("Livrare", "Delivery"),
        ("Total", "Total"),
        ("Punct recepție", "Reception point"),
        ("Adresă", "Address"),
        ("Recepție personală", "Personal reception"),
        ("Recepție la DronePort", "DronePort reception"),
        ("Recepție la cutie poștală", "Mailbox reception"),
        ("Recepție la vecin", "Neighbor reception"),
        ("Recepție la portar", "Doorman reception"),
        ("← Înapoi", "← Back"),
    ],
    "app/order/[id].tsx": [
        ("← Înapoi", "← Back"),
        ("Comandă negăsită", "Order not found"),
        ("Livrare la:", "Delivery to:"),
        ("Mod Livrare:", "Delivery Mode:"),
        ("Progres Comandă", "Order Progress"),
        ("Produse", "Products"),
        ("Greutate totală", "Total weight"),
        ("📍 Urmărire Live", "📍 Live Tracking"),
        ("Detalii Comandă", "Order Details"),
        ("Vehicul:", "Vehicle:"),
    ],
    "app/merchant-order/[id].tsx": [
        ("← Înapoi", "← Back"),
        ("Status Comandă", "Order Status"),
        ("Livrare la:", "Delivery to:"),
        ("Mod Livrare:", "Delivery Mode:"),
        ("Progres Comandă", "Order Progress"),
        ("Începe Pregătirea", "Start Preparation"),
        ("Marchează ca Gata", "Mark as Ready"),
        ("Se așteaptă Pilot", "Waiting for Pilot"),
        ("Raportează Problemă", "Report Issue"),
        ("Comandă negăsită", "Order not found"),
        ("Pregătire", "Preparation"),
        ("Ambalare", "Packaging"),
        ("Instrucțiuni", "Instructions"),
    ],
    "app/product/[id].tsx": [
        ("← Înapoi", "← Back"),
        ("Produs negăsit", "Product not found"),
        ("Selectează modul de livrare", "Select delivery mode"),
        ("Adaugă în coș", "Add to cart"),
        ("Cantitate", "Quantity"),
        ("Preț", "Price"),
        ("Categorie", "Category"),
        ("Greutate", "Weight"),
        ("Dimensiuni", "Dimensions"),
        ("Disponibil", "Available"),
        ("Indisponibil", "Unavailable"),
        ("Condiții", "Conditions"),
        ("Acceptă condițiile", "Accept conditions"),
    ],
    "app/store/[id].tsx": [
        ("← Înapoi", "← Back"),
        ("← Înapoi la Marketplace", "← Back to Marketplace"),
        ("Magazin negăsit", "Store not found"),
        ("Produse", "Products"),
        ("Evaluare", "Rating"),
        ("Livrări", "Deliveries"),
    ],
    "app/(tabs)/droneport.tsx": [
        ("Încărcare", "Charging"),
        ("Disponibil", "Available"),
        ("Ocupat", "Occupied"),
        ("Mentenanță", "Maintenance"),
    ],
    "app/(tabs)/authorities.tsx": [
        ("Condiții:", "Conditions:"),
        ("Moduri afectate:", "Affected modes:"),
    ],
    "app/(tabs)/_layout.tsx": [
        ("Acasă", "Home"),
        ("Piață", "Market"),
        ("Comenzi", "Orders"),
        ("Misiuni", "Missions"),
    ],
    "app/(tabs)/index.tsx": [
        ("Comenzi Active", "Active Orders"),
        ("Misiuni Active", "Active Missions"),
        ("Bun venit", "Welcome"),
    ],
    "app/(tabs)/marketplace.tsx": [
        ("Caută produse", "Search products"),
        ("Filtrează", "Filter"),
    ],
    "components/delivery-map.tsx": [
        ("Încărcare hartă", "Loading map"),
        ("Hartă indisponibilă", "Map unavailable"),
    ],
    "lib/marketplace-data.ts": [
        ("Dronă", "Drone"),
        ("Livrare aeriană rapidă", "Fast aerial delivery"),
        ("Livrare terestră", "Ground delivery"),
        ("bicicletă electrică", "electric bike"),
        ("zone urbane", "urban zones"),
        ("colete mari", "large parcels"),
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
