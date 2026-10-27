import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
print(f"Total Norflex products in seed: {len(norflex_prods)}")

skus = [p['sku'] for p in norflex_prods]
print(f"Sample Norflex SKUs: {skus[:20]}")
