#!/usr/bin/env python3
"""Translate all remaining Romanian UI text to English across the DROPi mobile app."""

import os

BASE = "/home/ubuntu/dropi-mobile"

# File-specific replacements
FILE_REPLACEMENTS = {
    "app/product/[id].tsx": [
        ("← Înapoi", "← Back"),
        ("Selectează modul de livrare", "Select delivery mode"),
        ("Te rugăm să alegi un mod de livrare înainte de a continua.", "Please choose a delivery mode before continuing."),
        ("Continuă cumpărăturile", "Continue shopping"),
        ("Adaugă în coș", "Add to cart"),
        ("🚁 Condiții Livrare cu Dronă", "🚁 Drone Delivery Conditions"),
        ("Recepția eșuată declanșează fallback (livrare terestră)", "Failed reception triggers fallback (ground delivery)"),
        ("Anulează", "Cancel"),
        ("Produs negăsit", "Product not found"),
    ],
    "app/cart.tsx": [
        ("← Înapoi", "← Back"),
        ("Confirmare Comandă", "Confirm Order"),
        ("Anulează", "Cancel"),
        ("Comandă Plasată ✓", "Order Placed ✓"),
        ("Comanda ta a fost trimisă pentru validare.", "Your order has been sent for validation."),
        ("Flux: Marketplace → Cerere → Aplicație → Decizie → Livrare", "Flow: Marketplace → Request → Application → Decision → Delivery"),
        ("Vei primi notificări despre statusul comenzii.", "You will receive notifications about order status."),
        ("Sumar Comandă", "Order Summary"),
        ("Costurile afișate sunt estimative și supuse validării finale", "Displayed costs are estimates subject to final validation"),
        ("Flux canonic: Client → Marketplace → Cerere → Aplicație → Decizie → Livrare", "Canonical flow: Client → Marketplace → Request → Application → Decision → Delivery"),
    ],
    "app/order/[id].tsx": [
        ("← Înapoi", "← Back"),
        ("Livrare la:", "Delivery to:"),
        ("Mod de Livrare:", "Delivery Mode:"),
        ("Mod Livrare:", "Delivery Mode:"),
        ("Progres Comandă", "Order Progress"),
        ("Produse", "Products"),
        ("Greutate totală", "Total weight"),
        ("📍 Urmărire Live", "📍 Live Tracking"),
        ("Comandă negăsită", "Order not found"),
    ],
    "app/merchant-order/[id].tsx": [
        ("← Înapoi", "← Back"),
        ("Status Comandă", "Order Status"),
        ("Livrare la:", "Delivery to:"),
        ("Mod Livrare:", "Delivery Mode:"),
        ("Progres Comandă", "Order Progress"),
        ("Începe Pregătirea", "Start Preparation"),
        ("Marchează ca Gata", "Mark as Ready"),
        ("Se așteaptă Pilot Dronă", "Waiting for Drone Pilot"),
        ("Se așteaptă Pilot", "Waiting for Pilot"),
        ("Raportează Problemă", "Report Issue"),
        ("Comandă negăsită", "Order not found"),
    ],
    "app/(tabs)/droneport.tsx": [
        ("Rețea Logistică", "Logistics Network"),
        ("Solicită Dronă", "Request Drone"),
        ("Solicită Vehicul", "Request Vehicle"),
        ("Inițiază Transfer", "Initiate Transfer"),
        ("Disponibile", "Available"),
        ("În Zbor", "In Flight"),
        ("În Tranzit", "In Transit"),
        ("Vehicule", "Vehicles"),
        ("Flotă Vehicule", "Vehicle Fleet"),
        ("Baterii Drone", "Drone Batteries"),
        ("Ultima Inspecție", "Last Inspection"),
        ("Următoarea Mentenanță", "Next Maintenance"),
        ("ACTIV", "ACTIVE"),
        ("MENTENANȚĂ", "MAINTENANCE"),
        ("Toate", "All"),
        ("Drone Porturi", "Drone Ports"),
        ("Hub-uri Transfer", "Transfer Hubs"),
        ("Depozite", "Depots"),
    ],
    "app/(tabs)/authorities.tsx": [
        ("Autorități & Reglementare", "Authorities & Regulation"),
        ("Conformitate Aeriană + Terestră", "Aerial + Ground Compliance"),
        ("Permise", "Permits"),
        ("Rapoarte", "Reports"),
        ("Restricții", "Restrictions"),
        ("Permise Active", "Active Permits"),
        ("Rapoarte Scadente", "Due Reports"),
        ("Zone Interzise", "Restricted Zones"),
        ("Permis zbor comercial", "Commercial flight permit"),
        ("Autorizare spațiu aerian", "Airspace authorization"),
        ("Licență operator dronă", "Drone operator license"),
        ("Permis transport terestru", "Ground transport permit"),
        ("Raport siguranță lunară", "Monthly safety report"),
        ("Audit conformitate", "Compliance audit"),
        ("Raport incidente", "Incident report"),
        ("Zona aeroportuară", "Airport zone"),
        ("Zona militară", "Military zone"),
        ("Activ", "Active"),
        ("Expirat", "Expired"),
        ("În Așteptare", "Pending"),
        ("Trimis", "Submitted"),
        ("Scadent", "Due"),
        ("Permanent", "Permanent"),
        ("Temporar", "Temporary"),
    ],
    "app/(tabs)/accounting.tsx": [
        ("Contabilitate", "Accounting"),
        ("Sumar", "Summary"),
        ("Costuri", "Costs"),
        ("Tranzacții", "Transactions"),
        ("Facturi", "Invoices"),
        ("Venituri", "Revenue"),
        ("Structură Comisioane", "Commission Structure"),
        ("Plăți în Așteptare", "Pending Payments"),
        ("Concluzii Costuri", "Cost Conclusions"),
        ("Livrare dronă", "Drone delivery"),
        ("Livrare auto", "Car delivery"),
        ("Livrare van", "Van delivery"),
        ("Livrare e-bike", "E-bike delivery"),
        ("Livrare multimodal", "Multimodal delivery"),
        ("Comision platformă", "Platform commission"),
        ("Taxă procesare", "Processing fee"),
        ("Plată merchant", "Merchant payment"),
        ("Plată pilot", "Pilot payment"),
        ("Factură emisă", "Invoice issued"),
        ("Factură primită", "Invoice received"),
    ],
    "app/(tabs)/marketplace.tsx": [
        ("Livrare", "Delivery"),
        ("Toate", "All"),
    ],
    "app/(tabs)/profile.tsx": [
        ("Setări", "Settings"),
        ("Profil", "Profile"),
        ("Editează Profil", "Edit Profile"),
        ("Notificări", "Notifications"),
        ("Istoric Comenzi", "Order History"),
        ("Deconectare", "Logout"),
    ],
    "app/(tabs)/index.tsx": [
        ("Comenzi Active", "Active Orders"),
        ("Misiuni Active", "Active Missions"),
        ("Istoric", "History"),
    ],
    "app/(tabs)/_layout.tsx": [
        ("Acasă", "Home"),
    ],
    "lib/marketplace-data.ts": [
        ("Dronă", "Drone"),
    ],
    "components/delivery-map.tsx": [
        ("Hartă Livrare", "Delivery Map"),
        ("Traseu Livrare", "Delivery Route"),
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
            # print(f"  {rel_path}: '{old}' → '{new}' ({count}x)")
    
    if file_count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ {rel_path}: {file_count} replacements")
        total_replacements += file_count
    else:
        print(f"  {rel_path}: no matches found")

print(f"\nTotal: {total_replacements} replacements across all files")
