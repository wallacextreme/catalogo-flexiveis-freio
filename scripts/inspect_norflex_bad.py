import json

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = {p['sku']: p for p in json.load(f)}

bad_skus = [
    '9000', '1005', '3089', '3111', '3119', '30155', '4001', '4009', '4013', '4020',
    '4021', '4036', '4084', '4078', '4093', '4094', '4104A', '405', '4109', '4212',
    '4210', '4804', '8301', '8418', '5196', '5198', '8511', '8510', '8227', '8226',
    '8240', '7031', '7049', '7061', '4200W', '3820W', 'DH2264', 'DH3051', 'DH55133',
    'DH35527', 'DH35651'
]

for sku in bad_skus:
    if sku in products:
        p = products[sku]
        print(f"\n[{sku}] ({p['brand']}) makes={p.get('makes')}")
        print(f"  name: {p.get('name')}")
        for app in p.get('applications', []):
            print(f"  app: make={app.get('make')}, model='{app.get('models')}', pos={app.get('position')}, len={app.get('lengthMm')}")
        print(f"  oems: {p.get('oemEquivalents')}")
