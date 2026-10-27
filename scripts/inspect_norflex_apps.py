import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

norflex_prods = [p for p in data if p['brand'] == 'Norflex']
print('Total Norflex prods:', len(norflex_prods))

for p in norflex_prods[:35]:
    app = p['applications'][0] if p['applications'] else {}
    m = app.get('models', '')
    print(f"[{p['sku']:<7}] make={app.get('make'):<12} | models={m:<50} | oems={p.get('oemEquivalents')}")
