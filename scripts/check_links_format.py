import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
print("Sample links for first 10 Norflex:")
for p in norflex_prods[:10]:
    print(f"SKU {p['sku']}: links={p.get('links')} | oems={p.get('oemEquivalents')}")
