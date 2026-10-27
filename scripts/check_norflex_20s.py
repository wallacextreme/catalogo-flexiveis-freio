import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
print("Norflex SKUs starting with '20':")
for p in norflex_prods:
    s = p['sku']
    if s.startswith('20'):
        print(f"  {s}: {p['name']}")
