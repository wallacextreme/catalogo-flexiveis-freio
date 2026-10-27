import json
import re
import os

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
scraped_keys = {re.sub(r'[^A-Z0-9]', '', k.upper()): k for k in scraped.keys()}

matched_mc = []
matched_trw = []
unmatched = []

for p in norflex_prods:
    sku = p['sku']
    sku_clean = re.sub(r'[^A-Z0-9]', '', sku.upper())
    
    if sku_clean in scraped_keys or f"NF{sku_clean}" in scraped_keys or f"DH{sku_clean}" in scraped_keys:
        matched_mc.append(sku)
        continue
        
    # Check TRW equivalent
    found_trw = None
    for d in p.get('links', {}).get('directEquivalents', []):
        trw_path = f"public/catalog-images/trw/{d.lower()}.webp"
        if os.path.exists(trw_path) and os.path.getsize(trw_path) > 3000:
            found_trw = (d, trw_path)
            break
            
    if found_trw:
        matched_trw.append((sku, found_trw[0]))
    else:
        unmatched.append(p)

print(f"Total Norflex: {len(norflex_prods)}")
print(f"Direct MercadoCar Norflex: {len(matched_mc)}")
print(f"Direct TRW High-Res equivalent: {len(matched_trw)}")
print(f"Remaining unmatched: {len(unmatched)}")
print("\nFirst 20 unmatched products:")
for p in unmatched[:20]:
    print(f"  SKU: {p['sku']:<10} | OEM: {str(p.get('oemEquivalents')):<20} | Name: {p['name']}")
