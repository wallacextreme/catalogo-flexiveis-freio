import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
print("Searching for similar SKUs in Norflex products:")
for p in norflex_prods:
    s = p['sku']
    if any(target in s for target in ['2010', '3024', '7005', '7014', '3004', '4046', '4080', '2012', '3135']):
        print(f"  Found SKU in seed: '{s}' (name: {p['name']})")
