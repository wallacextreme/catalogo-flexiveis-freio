import json
import urllib.request
import io
import os
from PIL import Image

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*'
}

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

failed_skus = ['4027', '7004', '7038', '6010', '3036', '3035C', '2119', '4074', '3040', 'DH55131', '8513', '4813', '8505', 'DH11041', '4083', '8701', '4022', '6012']

print(f"Retrying {len(failed_skus)} failed SKUs:")

for sku in failed_skus:
    if sku in scraped:
        item = scraped[sku]
        print(f"SKU {sku}: thumb={item['thumb']}")
        print(f"         high={item['high_res']}")
        # Try fetching thumb directly
        try:
            req = urllib.request.Request(item['thumb'], headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                im = Image.open(io.BytesIO(data))
                out_path = f"public/catalog-images/norflex/{sku.lower()}.webp"
                im.convert('RGB').save(out_path, 'WEBP', quality=92)
                print(f"  -> SUCCESS with thumb! Saved {out_path} ({im.size})")
        except Exception as e:
            print(f"  -> Thumb error: {e}")
            # Try searching MercadoCar directly
            try:
                surl = f"https://www.mercadocar.com.br/search?q={sku}&fabricante=NORFLEX"
                sreq = urllib.request.Request(surl, headers=headers)
                with urllib.request.urlopen(sreq, timeout=10) as sresp:
                    html = sresp.read().decode('utf-8', errors='ignore')
                    import re
                    m = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*' + re.escape(sku.lower()) + r'[^\'\"\s>]*', html, re.I)
                    if m:
                        img_url = m[0]
                        ireq = urllib.request.Request(img_url, headers=headers)
                        with urllib.request.urlopen(ireq, timeout=10) as iresp:
                            data = iresp.read()
                            im = Image.open(io.BytesIO(data))
                            out_path = f"public/catalog-images/norflex/{sku.lower()}.webp"
                            im.convert('RGB').save(out_path, 'WEBP', quality=92)
                            print(f"  -> DIRECT SEARCH SUCCESS! Saved {out_path}")
            except Exception as e2:
                print(f"  -> Direct search error: {e2}")
