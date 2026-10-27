import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

norflex_skus = {p['sku'].upper() for p in products if p['brand'] == 'Norflex'}
clean_norflex = {re.sub(r'[^A-Z0-9]', '', s): s for s in norflex_skus}

unmatched_scraped = {}
for k, v in scraped.items():
    clean_k = re.sub(r'[^A-Z0-9]', '', k.upper())
    if k.upper() not in norflex_skus and clean_k not in clean_norflex:
        unmatched_scraped[k] = v

print(f"Scraped items not matching seed: {len(unmatched_scraped)}")
for k, v in list(unmatched_scraped.items())[:30]:
    print(f"  {k}: {v['filename']}")
