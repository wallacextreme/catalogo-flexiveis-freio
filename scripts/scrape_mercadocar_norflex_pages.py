import urllib.request
import re
import json
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9'
}

norflex_items = {} # sku -> { title, link, img_url, high_res_url }

page = 1
max_pages = 25 # will stop when empty or pager ends

while page <= max_pages:
    url = f"https://www.mercadocar.com.br/search?q=norflex&fabricante=NORFLEX&orderby=0&pagenumber={page}&categorias="
    print(f"Fetching page {page}: {url}")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # Find all product items on this page
            # Each item typically has an image and a title/link
            # Let's find images containing norflex
            # e.g. https://stgecomm.blob.core.windows.net/imagesprod2/0416381_flexivel-de-freio-dianteiro-ford-aeroitamarati-1960-1972-408mm-norflex-3017_360.jpeg
            matches = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/(\d+_[^\'\"\s>]+_360\.(?:jpeg|jpg|png|webp))', html, re.I)
            
            # Also find all href links with norflex
            links = re.findall(r'href=[\"\'](/[^\"\']*(?:norflex|flexivel)[^\"\']*)[\"\']', html, re.I)
            
            page_found = 0
            for m in set(matches):
                # Extract SKU from filename:
                # e.g. 0416381_flexivel-de-freio-dianteiro-ford-aeroitamarati-1960-1972-408mm-norflex-3017_360.jpeg
                # SKU is often after norflex- or at the end
                full_thumb = f"https://stgecomm.blob.core.windows.net/imagesprod2/{m}"
                high_res = re.sub(r'_\d+\.(jpeg|jpg|png|webp)$', r'.\1', full_thumb, flags=re.I)
                
                # Extract sku
                sku_m = re.search(r'norflex[_-]([a-zA-Z0-9]+)', m, re.I)
                if sku_m:
                    sku = sku_m.group(1).upper()
                    if sku not in norflex_items:
                        norflex_items[sku] = {
                            'sku': sku,
                            'thumb': full_thumb,
                            'high_res': high_res,
                            'filename': m
                        }
                        page_found += 1
                        print(f"  [P{page}] Found SKU {sku}: {high_res}")
                        
            print(f"Page {page} added {page_found} new SKUs (Total unique so far: {len(norflex_items)})")
            
            # Check if there is a next page
            if f'data-page="{page + 1}"' not in html and f'pagenumber={page + 1}' not in html:
                print(f"No next page found after page {page}. Stopping pagination.")
                break
                
            page += 1
            time.sleep(0.5)
            
    except Exception as e:
        print(f"Error on page {page}: {e}")
        break

print(f"\nTotal unique Norflex items scraped from search pages: {len(norflex_items)}")

with open('scripts/mercadocar_norflex_pages_scraped.json', 'w', encoding='utf-8') as f:
    json.dump(norflex_items, f, indent=2)
print("Saved to scripts/mercadocar_norflex_pages_scraped.json")
