import json
import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

with open('scripts/mercadocar_trw_images.json') as f:
    found = json.load(f)

with open('src/data/catalog-master-seed.json', encoding='utf-8') as f:
    products = json.load(f)

trw_products = [p for p in products if p['brand'] == 'TRW']
not_found = [p for p in trw_products if p['sku'] not in found]

print(f"Testing OEM queries for 20 not_found SKUs...")

for p in not_found[:20]:
    sku = p['sku']
    oems = [o for o in p.get('oemEquivalents', []) if not o.startswith('RPFX') and not o.startswith('L')]
    norflex = p.get('norflexEquivalents', [])
    candidates = oems + norflex
    if not candidates:
        continue
    
    for c in candidates:
        clean_c = re.sub(r'[\.\-\s]', '', c)
        url = f"https://www.mercadocar.com.br/search?q={clean_c}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                matches = [m for m in re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/\d+_[^\'\"\s>]+\.jpeg', html) if 'flexivel' in m.lower()]
                if matches:
                    high_res = re.sub(r'_\d+\.jpeg$', '.jpeg', matches[0])
                    print(f"[{sku}] MATCH by {c}: {high_res}")
                    found[sku] = high_res
                    break
        except Exception as e:
            pass
