import urllib.request
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

norflex_prods = [p for p in products if p['brand'] == 'Norflex']
clean_scraped = {re.sub(r'[^A-Z0-9]', '', k.upper()): v for k, v in scraped.items()}

missing_prods = [p for p in norflex_prods if re.sub(r'[^A-Z0-9]', '', p['sku'].upper()) not in clean_scraped]
print(f"Missing prods count: {len(missing_prods)}")

# Check first 10 missing prods that have OEMs
found_by_oem = 0
for p in missing_prods:
    oems = p.get('oemEquivalents', [])
    if not oems:
        continue
    oem = oems[0]
    clean_oem = re.sub(r'[^A-Z0-9]', '', oem.upper())
    if len(clean_oem) < 5:
        continue
    url = f"https://www.mercadocar.com.br/search?q={clean_oem}&fabricante=NORFLEX"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            m = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*norflex[^\'\"\s>]*', html, re.I)
            if m:
                print(f"Found SKU {p['sku']} via OEM {clean_oem}: {m[0]}")
                found_by_oem += 1
            else:
                print(f"SKU {p['sku']} OEM {clean_oem}: not found")
    except Exception as e:
        print(f"Error {p['sku']}: {e}")
    if found_by_oem >= 5:
        break
