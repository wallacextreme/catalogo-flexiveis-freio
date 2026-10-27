import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']

# Create lookup dicts
exact_scraped = {k.upper(): v for k, v in scraped.items()}
clean_scraped = {re.sub(r'[^A-Z0-9]', '', k.upper()): v for k, v in scraped.items()}

matched = {}
missing = []

for p in norflex_prods:
    sku = p['sku']
    sku_upper = sku.upper()
    sku_clean = re.sub(r'[^A-Z0-9]', '', sku_upper)
    
    # Check exact
    if sku_upper in exact_scraped:
        matched[sku] = exact_scraped[sku_upper]['high_res']
    elif sku_clean in clean_scraped:
        matched[sku] = clean_scraped[sku_clean]['high_res']
    elif f"NF{sku_clean}" in clean_scraped:
        matched[sku] = clean_scraped[f"NF{sku_clean}"]['high_res']
    elif f"DH{sku_clean}" in clean_scraped:
        matched[sku] = clean_scraped[f"DH{sku_clean}"]['high_res']
    else:
        missing.append(sku)

print(f"Total Norflex products: {len(norflex_prods)}")
print(f"Directly matched: {len(matched)}")
print(f"Missing: {len(missing)}")

# Also check: can any missing Norflex product be matched through direct TRW equivalence?
# In Quality Gate 3: p['links']['direct'] or equivalents
trw_prods = {p['sku']: p for p in products if p['brand'] == 'TRW'}

matched_via_trw = 0
for sku in missing:
    p = next(prod for prod in norflex_prods if prod['sku'] == sku)
    direct_links = p.get('links', {}).get('direct', [])
    for link_sku in direct_links:
        if link_sku in trw_prods:
            matched_via_trw += 1
            break

print(f"Of the missing {len(missing)}, {matched_via_trw} have direct TRW equivalents in catalog!")
