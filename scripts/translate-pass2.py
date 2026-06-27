#!/usr/bin/env python3
"""Second pass: translate remaining Romanian in mock data and labels."""

import os

BASE = "/home/ubuntu/dropi-mobile"

FILE_REPLACEMENTS = {
    "app/(tabs)/authorities.tsx": [
        # Permit conditions
        ("Vehicule înregistrate", "Registered vehicles"),
        ("Șoferi licențiați", "Licensed drivers"),
        ("GPS tracking obligatoriu", "Mandatory GPS tracking"),
        ("Inspecție tehnică la zi", "Up-to-date technical inspection"),
        ("E-bike-uri înregistrate", "Registered e-bikes"),
        ("Viteză max 25km/h", "Max speed 25km/h"),
        ("Bandă dedicată", "Dedicated lane"),
        # Reports
        ("Raport Lunar Operațiuni Aeriene", "Monthly Aerial Operations Report"),
        ("Raport Q2 Siguranță Flotă Terestră", "Q2 Ground Fleet Safety Report"),
        # Restrictions
        ("Zonă de securitate", "Security zone"),
        ("Exerciții militare", "Military exercises"),
        ("Lucrări infrastructură", "Infrastructure works"),
        ("Limită greutate 3.5t", "Weight limit 3.5t"),
        # Status labels
        ('statusLabels = { approved: "APROBAT", pending: "ÎN AȘTEPTARE", expired: "EXPIRAT", rejected: "RESPINS" }', 
         'statusLabels = { approved: "APPROVED", pending: "PENDING", expired: "EXPIRED", rejected: "REJECTED" }'),
        ('statusLabels = { submitted: "TRIMIS", pending: "ÎN AȘTEPTARE", overdue: "ÎNTÂRZIAT", approved: "APROBAT" }',
         'statusLabels = { submitted: "SUBMITTED", pending: "PENDING", overdue: "OVERDUE", approved: "APPROVED" }'),
        # Type labels
        ('flight_zone: "Zonă de Zbor", altitude: "Altitudine", night_ops: "Operațiuni Nocturne"',
         'flight_zone: "Flight Zone", altitude: "Altitude", night_ops: "Night Operations"'),
        ('cargo: "Transport Marfă", emergency: "Urgențe", vehicle_ops: "Operațiuni Vehicule"',
         'cargo: "Cargo Transport", emergency: "Emergency", vehicle_ops: "Vehicle Operations"'),
        ('multimodal_route: "Rută Multimodală", hazmat_transport: "Transport Periculos"',
         'multimodal_route: "Multimodal Route", hazmat_transport: "Hazmat Transport"'),
        # Restriction type labels
        ('no_fly: "INTERZIS", restricted: "RESTRICȚIONAT", controlled: "CONTROLAT", temporary: "TEMPORAR", road_closure: "DRUM ÎNCHIS", weight_limit: "LIMITĂ GREUTATE"',
         'no_fly: "NO-FLY", restricted: "RESTRICTED", controlled: "CONTROLLED", temporary: "TEMPORARY", road_closure: "ROAD CLOSED", weight_limit: "WEIGHT LIMIT"'),
        # UI text
        ("Zonă:", "Zone:"),
        ("Până la:", "Until:"),
        ("Drumuri Închise", "Road Closures"),
        ("Afectează atât operațiunile aeriene cât și cele terestre", "Affects both aerial and ground operations"),
    ],
    "app/(tabs)/accounting.tsx": [
        # Transaction data
        ("Pilot Dronă #089", "Drone Pilot #089"),
        ("DROPi Penalități", "DROPi Penalties"),
        # Invoice data
        ("C2 Serviciu Lunar — 500 livrări (mix dronă/auto)", "C2 Monthly Service — 500 deliveries (drone/car mix)"),
        ("Suport prioritar", "Priority support"),
        ("C3 Răspuns urgență — 50 deployments dronă", "C3 Emergency response — 50 drone deployments"),
        ("Închiriere echipament", "Equipment rental"),
        ("C2 Contract — 200 livrări e-bike", "C2 Contract — 200 e-bike deliveries"),
        ("Suprataxă asigurare", "Insurance surcharge"),
        ("Primăria Orașului", "City Hall"),
        ("C3 Contract anual urgențe (dronă + van)", "C3 Annual emergency contract (drone + van)"),
        ("Training & certificare", "Training & certification"),
        # Tab/section labels that may remain
        ("Comision", "Commission"),
        ("Plată", "Payment"),
    ],
    "app/(tabs)/droneport.tsx": [
        # Any remaining
        ("Stație", "Station"),
        ("Capacitate", "Capacity"),
        ("Status", "Status"),
    ],
    "app/(tabs)/index.tsx": [
        ("Comenzi Active", "Active Orders"),
        ("Misiuni Active", "Active Missions"),
        ("Istoric", "History"),
        ("Bun venit", "Welcome"),
    ],
    "lib/mock-data.ts": [
        # Check for Romanian in mock data
        ("Livrare", "Delivery"),
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
