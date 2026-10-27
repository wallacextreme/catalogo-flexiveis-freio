import json
import re
import os

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
trw_prods = {p['sku'].upper(): p for p in products if p['brand'] == 'TRW'}

clean_scraped = {re.sub(r'[^A-Z0-9]', '', k.upper()): v for k, v in scraped.items()}

from_mercadocar_norflex = 0
from_equivalent_trw = 0
only_pdf = 0

for p in norflex_prods:
    sku = p['sku']
    sku_clean = re.sub(r'[^A-Z0-9]', '', sku.upper())
    
    if sku_clean in clean_scraped or f"NF{sku_clean}" in clean_scraped or f"DH{sku_clean}" in clean_scraped:
        from_mercadocar_norflex += 1
    else:
        # Check direct equivalents in TRW
        has_trw = False
        for d in p.get('links', {}).get('directEquivalents', []):
            if d.upper() in trw_prods:
                trw_sku = d.lower()
                trw_img_path = f"public/catalog-images/trw/{trw_sku}.webp"
                if os.path.exists(trw_img_path) and os.path.getsize(trw_img_path) > 4000:
                    has_trw = True
                    break
        if has_trw:
            from_equivalent_trw += 1
        else:
            only_pdf += 1

print(f"Total Norflex products: {len(norflex_prods)}")
print(f"Direct Norflex MercadoCar high-res: {from_mercadocar_norflex}")
print(f"From High-res TRW equivalent: {from_equivalent_trw}")
print(f"Remaining only PDF: {only_pdf}")
print(f"Total with high-res: {from_mercadocar_norflex + from_equivalent_trw} ({((from_mercadocar_norflex + from_equivalent_trw)/len(norflex_prods))*100:.1f}%)")
