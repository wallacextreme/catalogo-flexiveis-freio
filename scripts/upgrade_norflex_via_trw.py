import json
import os
import shutil

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
norflex_dir = 'public/catalog-images/norflex'
trw_dir = 'public/catalog-images/trw'

copied = 0
for p in norflex_prods:
    sku = p['sku'].lower()
    norflex_path = os.path.join(norflex_dir, f"{sku}.webp")
    
    # If file doesn't exist or is small (< 10000 bytes, which indicates old low-res strip)
    is_low_res = not os.path.exists(norflex_path) or os.path.getsize(norflex_path) < 10000
    
    if is_low_res:
        directs = p.get('links', {}).get('directEquivalents', [])
        for d in directs:
            trw_sku = d.lower()
            trw_path = os.path.join(trw_dir, f"{trw_sku}.webp")
            if os.path.exists(trw_path) and os.path.getsize(trw_path) > 10000:
                shutil.copy2(trw_path, norflex_path)
                copied += 1
                print(f"Copied high-res TRW {d} ({os.path.getsize(trw_path)}B) -> Norflex {p['sku']}")
                break

print(f"Total Norflex images upgraded via TRW studio equivalents: {copied}")
