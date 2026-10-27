import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products: {len(products)}")

bad_makes = set()
bad_models = []

for p in products:
    for m in p.get('makes', []):
        if any(c in m for c in ['ECE', 'EFE', 'EGE', 'EME', 'EHE', 'EKE', 'EPE', 'ERE', 'ETE', 'EVE', 'E.E', 'E-E']):
            bad_makes.add(m)
    for app in p.get('applications', []):
        am = app.get('make', '')
        if any(c in am for c in ['ECE', 'EFE', 'EGE', 'EME', 'EHE', 'EKE', 'EPE', 'ERE', 'ETE', 'EVE', 'E.E', 'E-E']):
            bad_makes.add(am)
        mod = app.get('models', '')
        if any(c in mod for c in ['ECE', 'EFE', 'EGE', 'EME', 'EHE', 'EKE', 'EPE', 'ERE', 'ETE', 'EVE', 'E.E', 'E-E', '//']) or re.search(r'\d{5,}', mod):
            bad_models.append((p['sku'], p['brand'], am, mod))

print(f"Bad makes found ({len(bad_makes)}): {bad_makes}")
print(f"Bad models found ({len(bad_models)}):")
for sku, brand, mk, mod in bad_models:
    print(f"  [{sku}] ({brand}) {mk}: '{mod}'")
