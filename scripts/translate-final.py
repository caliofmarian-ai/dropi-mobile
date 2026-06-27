#!/usr/bin/env python3
"""Final pass: translate ALL remaining Romanian text in the codebase."""

import os

BASE = "/home/ubuntu/dropi-mobile"

FILE_REPLACEMENTS = {
    "app/(tabs)/accounting.tsx": [
        ('drone: "Dronă", auto: "Auto", van: "Van", ebike: "E-Bike", multimodal: "Multimodal",',
         'drone: "Drone", auto: "Car", van: "Van", ebike: "E-Bike", multimodal: "Multimodal",'),
        ('order_payment: "Payment Comandă", commission: "Commission", pilot_payout: "Payment Pilot/Curier",',
         'order_payment: "Order Payment", commission: "Commission", pilot_payout: "Pilot/Courier Payment",'),
        ('droneport_fee: "Taxă DronePort", vehicle_rental: "Închiriere Vehicul",',
         'droneport_fee: "DronePort Fee", vehicle_rental: "Vehicle Rental",'),
        ('{ paid: "PLĂTIT", pending: "ÎN AȘTEPTARE", overdue: "ÎNTÂRZIAT", draft: "CIORNĂ" }',
         '{ paid: "PAID", pending: "PENDING", overdue: "OVERDUE", draft: "DRAFT" }'),
        ("livrări", "deliveries"),
        ("marjă", "margin"),
        ("Distanță medie", "Average distance"),
        ("Marjă profit", "Profit margin"),
        ("Operațiuni Financiare — Livrare Multimodală", "Financial Operations — Multimodal Delivery"),
        ("livrări completate", "completed deliveries"),
        ("12 piloți + 5 curieri terestri", "12 pilots + 5 ground couriers"),
        ("Comparație costuri per mod de livrare — ultimele 30 zile", "Cost comparison per delivery mode — last 30 days"),
        ("• E-Bike oferă cea mai bună marjă (28%) pentru distanțe scurte (<3km)", "• E-Bike offers the best margin (28%) for short distances (<3km)"),
        ("• Drona este optimă pentru livrări rapide cu marjă de 22%", "• Drone is optimal for fast deliveries with 22% margin"),
        ("• Multimodal are costul cel mai ridicat dar acoperă distanțe mari", "• Multimodal has the highest cost but covers long distances"),
        ("Așteptare", "Pending"),
    ],
    "app/cart.tsx": [
        ("Coș de Cumpărături", "Shopping Cart"),
        ("Coșul tău este gol", "Your cart is empty"),
        ("Adaugă produse din marketplace", "Add products from marketplace"),
        ("Plasează Comanda", "Place Order"),
        ("Punct recepție", "Reception point"),
        ("Adresă", "Address"),
        ("Recepție personală", "Personal reception"),
        ("Recepție la DronePort", "DronePort reception"),
        ("Recepție la cutie poștală", "Mailbox reception"),
        ("Recepție la vecin", "Neighbor reception"),
        ("Recepție la portar", "Doorman reception"),
        ("Costurile afișate sunt estimative", "Displayed costs are estimates"),
    ],
    "app/order/[id].tsx": [
        ("Comandă negăsită", "Order not found"),
        ("Livrare la:", "Delivery to:"),
        ("Mod Livrare:", "Delivery Mode:"),
        ("Mod de Livrare:", "Delivery Mode:"),
        ("Progres Comandă", "Order Progress"),
        ("Greutate totală", "Total weight"),
        ("📍 Urmărire Live", "📍 Live Tracking"),
        ("Detalii Comandă", "Order Details"),
        ("Vehicul:", "Vehicle:"),
        ("← Înapoi", "← Back"),
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
        ("Greutate", "Weight"),
        ("Dimensiuni", "Dimensions"),
        ("Disponibil", "Available"),
        ("Indisponibil", "Unavailable"),
        ("Acceptă condițiile", "Accept conditions"),
        ("Prin comandarea cu dronă, accept următoarele condiții:", "By ordering with drone, I accept the following conditions:"),
        ("Drona NU așteaptă clientul la punctul de recepție", "The drone does NOT wait for the client at the reception point"),
        ("Drona NU negociază locul de livrare", "The drone does NOT negotiate the delivery location"),
        ("Drona NU repetă livrarea dacă recepția eșuează", "The drone does NOT repeat delivery if reception fails"),
        ("Punctul de recepție trebuie să fie valid și accesibil", "The reception point must be valid and accessible"),
        ("Metoda finală poate fi schimbată de platformă (meteo, capacitate)", "Final method may be changed by platform (weather, capacity)"),
    ],
    "app/store/[id].tsx": [
        ('trusted: "★ De Încredere",', 'trusted: "★ Trusted",'),
        ('"DESCHIS"', '"OPEN"'),
        ('"ÎNCHIS"', '"CLOSED"'),
        ("Zonă:", "Zone:"),
    ],
    "app/(tabs)/_layout.tsx": [
        ('case "C2": return "Operațiuni";', 'case "C2": return "Operations";'),
        ('case "C3": return "Urgențe";', 'case "C3": return "Emergency";'),
        ('title: "Flotă",', 'title: "Fleet",'),
        ('title: "Finanțe",', 'title: "Finance",'),
    ],
    "app/(tabs)/index.tsx": [
        ("misiuni disponibile în zona ta", "missions available in your area"),
        ("Nicio misiune disponibilă", "No missions available"),
        ("Flotă Multimodală", "Multimodal Fleet"),
    ],
    "app/(tabs)/marketplace.tsx": [
        ("Marketplace controlat DROPi — Delivery multimodală", "DROPi controlled Marketplace — Multimodal Delivery"),
        ("Niciun produs găsit în această categorie", "No products found in this category"),
    ],
    "app/(tabs)/droneport.tsx": [
        ("Flotă Vehicles", "Fleet Vehicles"),
        ("Programează Maint.", "Schedule Maint."),
        ("stații active", "active stations"),
        ("vehicule", "vehicles"),
        ("Stații", "Stations"),
    ],
    "app/(tabs)/authorities.tsx": [
        ("Altitudine max 120m", "Max altitude 120m"),
        ("Doar ziua", "Daytime only"),
        ("Linie vizuală directă", "Direct line of sight"),
        ("Lumini anti-coliziune obligatorii", "Anti-collision lights mandatory"),
        ("Viteză redusă 30km/h", "Reduced speed 30km/h"),
        ("Payload max 5kg dronă", "Max payload 5kg drone"),
        ("Payload max 50kg van", "Max payload 50kg van"),
        ("Hazmat exclus", "Hazmat excluded"),
        ("Asigurare obligatorie", "Insurance mandatory"),
        ("Acces prioritar spațiu aerian", "Priority airspace access"),
        ("Fără limită altitudine în urgență", "No altitude limit in emergency"),
        ("Raportare real-time", "Real-time reporting"),
        ("RESTRICȚII ACTIVE:", "ACTIVE RESTRICTIONS:"),
    ],
    "components/delivery-map.tsx": [
        ('drone: { icon: "🚁", color: "#0066FF", label: "Dronă" },', 'drone: { icon: "🚁", color: "#0066FF", label: "Drone" },'),
        ('picking_up: "Se ridică comanda",', 'picking_up: "Picking up order",'),
        ('in_transit: "În tranzit",', 'in_transit: "In transit",'),
        ('dropoff: { ...r.dropoff, label: "Client — Destinație" },', 'dropoff: { ...r.dropoff, label: "Client — Destination" },'),
    ],
    "lib/marketplace-data.ts": [
        ('{ id: "food", name: "Mâncare & Băuturi", icon: "🍜", droneEligible: true, maxWeightDrone: 2.0, description: "Preparate gata, băuturi, snacks" },',
         '{ id: "food", name: "Food & Drinks", icon: "🍜", droneEligible: true, maxWeightDrone: 2.0, description: "Ready meals, drinks, snacks" },'),
        ('{ id: "pharmacy", name: "Farmacie", icon: "💊", droneEligible: true, maxWeightDrone: 1.5, description: "Medicamente, vitamine, produse de sănătate" },',
         '{ id: "pharmacy", name: "Pharmacy", icon: "💊", droneEligible: true, maxWeightDrone: 1.5, description: "Medicines, vitamins, health products" },'),
        ('{ id: "documents", name: "Documente", icon: "📄", droneEligible: true, maxWeightDrone: 0.5, description: "Plicuri, documente, corespondență" },',
         '{ id: "documents", name: "Documents", icon: "📄", droneEligible: true, maxWeightDrone: 0.5, description: "Envelopes, documents, correspondence" },'),
        ('{ id: "furniture", name: "Mobilier", icon: "🪑", droneEligible: false, maxWeightDrone: 0, description: "Mobilă, decorațiuni mari" },',
         '{ id: "furniture", name: "Furniture", icon: "🪑", droneEligible: false, maxWeightDrone: 0, description: "Furniture, large decorations" },'),
        ('{ id: "fragile", name: "Fragile", icon: "⚠️", droneEligible: false, maxWeightDrone: 0, description: "Obiecte fragile care necesită transport special" },',
         '{ id: "fragile", name: "Fragile", icon: "⚠️", droneEligible: false, maxWeightDrone: 0, description: "Fragile items requiring special transport" },'),
        ('{ id: "community", name: "Comunitar", icon: "🤝", droneEligible: true, maxWeightDrone: 2.0, description: "Donații, transferuri gratuite, vânzări ocazionale" },',
         '{ id: "community", name: "Community", icon: "🤝", droneEligible: true, maxWeightDrone: 2.0, description: "Donations, free transfers, occasional sales" },'),
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
