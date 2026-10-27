import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

corrupt_makes = set()
corrupt_models = set()

for p in data:
    for m in p.get('makes', []):
        if 'ECE' in m or 'EFE' in m or 'EME' in m:
            corrupt_makes.add(m)
    for app in p.get('applications', []):
        m = app.get('models', '')
        if '//' in m or 'E.E' in m or re.search(r'\d{5,}', m):
            corrupt_models.add((p['sku'], m))

print(f"Corrupt makes found: {len(corrupt_makes)}")
for m in sorted(corrupt_makes):
    print("  Make:", m)

print(f"\nCorrupt models (total {len(corrupt_models)}):")
for sku, m in sorted(corrupt_models):
    print(f"  [{sku}] {m}")
