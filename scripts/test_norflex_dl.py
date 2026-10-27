import urllib.request
import json
import io
import os
from PIL import Image

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

test_skus = ['3017', '2005', '4034', '4020', '3010']

for sku in test_skus:
    item = scraped[sku]
    url = item['high_res']
    print(f"Downloading {sku}: {url}")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = resp.read()
        im = Image.open(io.BytesIO(data))
        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
            bg = Image.new('RGB', im.size, (255, 255, 255))
            if im.mode != 'RGBA':
                im = im.convert('RGBA')
            bg.paste(im, mask=im.split()[3])
            im = bg
        elif im.mode != 'RGB':
            im = im.convert('RGB')
            
        out_path = f"public/catalog-images/norflex/{sku.lower()}.webp"
        im.save(out_path, 'WEBP', quality=92)
        print(f"Saved {out_path}: {im.size}, {os.path.getsize(out_path)} bytes")
