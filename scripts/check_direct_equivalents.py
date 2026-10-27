import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
trw_prods = {p['sku'].upper(): p for p in products if p['brand'] == 'TRW'}

count = 0
for p in norflex_prods:
    directs = p.get('links', {}).get('directEquivalents', [])
    for d in directs:
        if d.upper() in trw_prods:
            count += 1
            print(f"Norflex {p['sku']} <-> TRW {d}")
            break

print(f"Total Norflex with direct TRW equivalents: {count}")
