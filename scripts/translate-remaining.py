"""Translate all remaining Romanian text to English across the project."""
import re

REPLACEMENTS = {
    # marketplace-data.ts
    '"Alimente"': '"Groceries"',
    '"Produse alimentare, fructe, legume"': '"Food products, fruits, vegetables"',
    '"Colete Grele"': '"Heavy Parcels"',
    '"Pachete >5kg, echipamente"': '"Packages >5kg, equipment"',
    
    # accounting.tsx
    'Revenue per Mod de Livrare': 'Revenue per Delivery Mode',
    
    # order/[id].tsx
    'Mod de Livrare': 'Delivery Mode',
    
    # mission/[id].tsx
    'Detalii Misiune': 'Mission Details',
    'Livrare: ': 'Delivery: ',
    'Info Misiune': 'Mission Info',
    'Greutate Colet': 'Package Weight',
    'Timp Estimat Zbor': 'Estimated Flight Time',
    'Timp Estimat Tranzit': 'Estimated Transit Time',
    'Tip Vehicul': 'Vehicle Type',
    'Baterie: 74%': 'Battery: 74%',
    'Baterie > 80%': 'Battery > 80%',
    
    # merchant-order/[id].tsx
    'Vehicul asignat: ': 'Assigned Vehicle: ',
    'Greutate Colet': 'Package Weight',
    'Greutate max: ': 'Max weight: ',
    
    # index.tsx
    'Vehicule Terestre': 'Ground Vehicles',
    
    # authorities.tsx
    'Raport Accident Vehicul VAN-008': 'Vehicle Accident Report VAN-008',
    'Altitudine max: ': 'Max altitude: ',
    
    # mission/[id].tsx vehicle
    'Vehicul: ': 'Vehicle: ',
    
    # product/[id].tsx
    '\\nLivrare: ': '\\nDelivery: ',
}

FILES = [
    'lib/marketplace-data.ts',
    'app/(tabs)/accounting.tsx',
    'app/(tabs)/index.tsx',
    'app/(tabs)/authorities.tsx',
    'app/order/[id].tsx',
    'app/merchant-order/[id].tsx',
    'app/mission/[id].tsx',
    'app/product/[id].tsx',
]

import os
base = '/home/ubuntu/dropi-mobile'

for f in FILES:
    fp = os.path.join(base, f)
    if not os.path.exists(fp):
        print(f"SKIP (not found): {f}")
        continue
    with open(fp, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    original = content
    for ro, en in REPLACEMENTS.items():
        content = content.replace(ro, en)
    
    if content != original:
        with open(fp, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"FIXED: {f}")
    else:
        print(f"NO CHANGE: {f}")

print("\nDone!")
