import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9'
}

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

trw_products = [p for p in products if p['brand'] == 'TRW']
print(f"Total TRW products to check: {len(trw_products)}")

results = {}

def check_sku(p):
    sku = p['sku']
    sku_clean = sku.lower()
    # Try direct SKU search
    url = f"https://www.mercadocar.com.br/search?q={sku}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # Find image containing the SKU
            # e.g. https://stgecomm.blob.core.windows.net/imagesprod2/0344600_...rpfx00050...jpeg
            pattern = re.compile(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*' + re.escape(sku_clean) + r'[^\'\"\s>]*', re.IGNORECASE)
            matches = pattern.findall(html)
            
            if matches:
                # get original high-res by stripping thumbnail size suffix
                img = matches[0]
                high_res = re.sub(r'_\d+\.(jpeg|jpg|png|webp)$', r'.\1', img, flags=re.IGNORECASE)
                return sku, high_res, 'exact_sku'
                
            # If not found directly, check product links that match sku
            link_pattern = re.compile(r'href=["\'](/[^"\']*' + re.escape(sku_clean) + r'[^"\']*)["\']', re.IGNORECASE)
            links = link_pattern.findall(html)
            if links:
                prod_url = f"https://www.mercadocar.com.br{links[0]}"
                req2 = urllib.request.Request(prod_url, headers=headers)
                with urllib.request.urlopen(req2, timeout=12) as resp2:
                    phtml = resp2.read().decode('utf-8', errors='ignore')
                    pmatches = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/\d+_[^\'\"\s>]+\.(?:jpeg|jpg|png|webp)', phtml, re.IGNORECASE)
                    for pm in pmatches:
                        if 'logo' not in pm.lower() and 'trw' not in pm.lower() and 'brand' not in pm.lower():
                            high_res = re.sub(r'_\d+\.(jpeg|jpg|png|webp)$', r'.\1', pm, flags=re.IGNORECASE)
                            return sku, high_res, 'product_page'
                            
    except Exception as e:
        return sku, None, str(e)
        
    return sku, None, 'not_found'

print("Starting scan with 6 threads...")
t0 = time.time()
found_count = 0
not_found_count = 0

with ThreadPoolExecutor(max_workers=6) as executor:
    futures = {executor.submit(check_sku, p): p for p in trw_products}
    for fut in as_completed(futures):
        sku, img_url, method = fut.result()
        if img_url:
            found_count += 1
            results[sku] = img_url
            print(f"[{found_count}] FOUND {sku} ({method}): {img_url}")
        else:
            not_found_count += 1

elapsed = time.time() - t0
print(f"\nDone in {elapsed:.1f}s. Found: {found_count}, Not found: {not_found_count}")

with open('scripts/mercadocar_trw_images.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
