import json
import os

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
norflex_dir = 'public/catalog-images/norflex'

high_res = []
low_res = []

for p in norflex_prods:
    sku = p['sku'].lower()
    path = os.path.join(norflex_dir, f"{sku}.webp")
    if os.path.exists(path):
        sz = os.path.getsize(path)
        if sz >= 8000:
            high_res.append((p['sku'], sz))
        else:
            low_res.append((p['sku'], sz))
    else:
        low_res.append((p['sku'], 0))

print(f"High-res Norflex images (>=8KB): {len(high_res)}")
print(f"Low-res Norflex images (<8KB): {len(low_res)}")
