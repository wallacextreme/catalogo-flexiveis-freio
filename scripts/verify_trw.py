import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for sku in ['RPFX00010', 'RPFX00040', 'RPFX00050', 'RPFX00060', 'RPFX00110']:
    p = next((x for x in data if x['sku'] == sku), None)
    if p:
        print(f"[{p['sku']}] Name: {p['name']}")
        print(f"      Makes: {p['makes']}")
        for app in p['applications']:
            print(f"      App: {app['make']} | {app['models']} ({app['years']})")
