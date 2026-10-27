import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
print(f"Total Norflex in catalog: {len(norflex_prods)}")
print(f"Total scraped items: {len(scraped)}")

# Normalize SKUs for matching
# e.g., '3011', '3024A', 'DH7565', '133U' -> compare uppercase without spaces/hyphens
scraped_norm = {}
for k, v in scraped.items():
    clean_k = re.sub(r'[^A-Z0-9]', '', k.upper())
    scraped_norm[clean_k] = v

matched = []
missing = []

for p in norflex_prods:
    sku = p['sku']
    clean_sku = re.sub(r'[^A-Z0-9]', '', sku.upper())
    if clean_sku in scraped_norm:
        matched.append((sku, scraped_norm[clean_sku]['high_res']))
    else:
        # Also try prefixing/stripping 'NF'
        if f"NF{clean_sku}" in scraped_norm:
            matched.append((sku, scraped_norm[f"NF{clean_sku}"]['high_res']))
        else:
            missing.append(sku)

print(f"Matched directly from 14 pages: {len(matched)}")
print(f"Missing from 14 pages: {len(missing)}")
print(f"Sample missing SKUs (first 30): {missing[:30]}")
