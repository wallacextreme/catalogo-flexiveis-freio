import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = {p['sku']: p for p in json.load(f)}

check_skus = [
    'RPFX00010', 'RPFX00040', 'RPFX00050', 'RPFX00060',
    '2116', '2117', '2118',
    'RPFX01690', 'RPFX03260', 'RPFX02700'
]

for sku in check_skus:
    p = products.get(sku)
    print(f"\n=== {sku} ({p['brand']}) ===")
    print(f"  Name: {p['name']}")
    print(f"  Makes: {p['makes']}")
    print(f"  Specs: length={p['specs'].get('lengthMm')}mm, pos={p['specs'].get('position')}")
    print(f"  Applications: {[(a['make'], a['models'], a['years'], a.get('position')) for a in p['applications']]}")
    print(f"  OEMs: {p['oemEquivalents']}")

print("\n--- Auditing invalid position strings across all products ---")
invalid_pos_count = 0
for p in products.values():
    pos = str(p['specs'].get('position', ''))
    if any(c.isdigit() for c in pos) and len(pos) >= 4:
        print(f"[{p['sku']}] invalid specs pos: '{pos}'")
        invalid_pos_count += 1
    for app in p['applications']:
        apos = str(app.get('position', ''))
        if any(c.isdigit() for c in apos) and len(apos) >= 4:
            print(f"[{p['sku']}] invalid app pos: '{apos}'")
            invalid_pos_count += 1
print(f"Total invalid position occurrences: {invalid_pos_count}")
