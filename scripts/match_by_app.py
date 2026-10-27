import json
import os
import shutil

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
trw_prods = [p for p in products if p['brand'] == 'TRW']

norflex_dir = 'public/catalog-images/norflex'
trw_dir = 'public/catalog-images/trw'

# Group TRW by (make, position, lengthMm approx +- 15mm)
trw_map = {}
for p in trw_prods:
    pos = (p.get('specs', {}).get('position') or '').upper()
    length = p.get('specs', {}).get('lengthMm') or 0
    for m in p.get('makes', []):
        for mod in p.get('models', []):
            key = (m.upper(), mod.upper(), pos)
            trw_map.setdefault(key, []).append((p, length))

print(f"TRW index has {len(trw_map)} unique make-model-position keys")

matches_by_app = 0
for p in norflex_prods:
    sku = p['sku'].lower()
    path = os.path.join(norflex_dir, f"{sku}.webp")
    
    # Check if currently small (< 5000 bytes)
    if os.path.exists(path) and os.path.getsize(path) < 5000:
        pos = (p.get('specs', {}).get('position') or '').upper()
        p_len = p.get('specs', {}).get('lengthMm') or 0
        
        found = None
        for m in p.get('makes', []):
            for mod in p.get('models', []):
                key = (m.upper(), mod.upper(), pos)
                if key in trw_map:
                    # Find closest length
                    candidates = trw_map[key]
                    for tp, tlen in candidates:
                        if abs(tlen - p_len) <= 25 and tlen > 0: # within 25mm
                            t_path = os.path.join(trw_dir, f"{tp['sku'].lower()}.webp")
                            if os.path.exists(t_path) and os.path.getsize(t_path) > 10000:
                                found = (tp, t_path)
                                break
                if found:
                    break
            if found:
                break
                
        if found:
            tp, t_path = found
            shutil.copy2(t_path, path)
            matches_by_app += 1
            print(f"Matched by application: Norflex {p['sku']} ({p['name']}) -> TRW {tp['sku']} ({tp['name']})")

print(f"Total matched by exact vehicle application: {matches_by_app}")
