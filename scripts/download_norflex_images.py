import json
import urllib.request
import io
import os
import re
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9'
}

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

print(f"Total Norflex items to download from MercadoCar: {len(scraped)}")

out_dir = 'public/catalog-images/norflex'
os.makedirs(out_dir, exist_ok=True)

success_count = 0
failed_count = 0

def download_and_save(sku, item):
    high_url = item['high_res']
    thumb_url = item['thumb']
    
    # Try high-res first, fallback to thumb
    data = None
    for u in [high_url, thumb_url]:
        try:
            req = urllib.request.Request(u, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                if len(data) > 1000:
                    break
        except Exception:
            continue
            
    if not data:
        return sku, False, "Failed both high-res and thumb"
        
    try:
        im = Image.open(io.BytesIO(data))
        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
            bg = Image.new('RGB', im.size, (255, 255, 255))
            if im.mode != 'RGBA':
                im = im.convert('RGBA')
            bg.paste(im, mask=im.split()[3])
            im = bg
        elif im.mode != 'RGB':
            im = im.convert('RGB')
            
        sku_clean = sku.lower()
        target_path = os.path.join(out_dir, f"{sku_clean}.webp")
        im.save(target_path, 'WEBP', quality=92)
        
        # Also handle letter aliases, e.g. 3024b -> 30248, 7005b -> 70058
        if sku_clean.endswith('b'):
            alias_path = os.path.join(out_dir, f"{sku_clean[:-1]}8.webp")
            im.save(alias_path, 'WEBP', quality=92)
        elif sku_clean.endswith('8'):
            alias_path = os.path.join(out_dir, f"{sku_clean[:-1]}b.webp")
            im.save(alias_path, 'WEBP', quality=92)
            
        return sku, True, f"{im.size}, {len(data)}B -> {os.path.getsize(target_path)}B"
    except Exception as e:
        return sku, False, str(e)

t0 = time.time()
print("Starting download with 8 threads...")

with ThreadPoolExecutor(max_workers=8) as executor:
    futures = {executor.submit(download_and_save, sku, item): sku for sku, item in scraped.items()}
    for fut in as_completed(futures):
        sku, ok, msg = fut.result()
        if ok:
            success_count += 1
            if success_count % 25 == 0 or success_count == len(scraped):
                print(f"[{success_count}/{len(scraped)}] Downloaded {sku}: {msg}")
        else:
            failed_count += 1
            print(f"[FAIL] {sku}: {msg}")

elapsed = time.time() - t0
print(f"\nDownload completed in {elapsed:.1f}s!")
print(f"Success: {success_count}, Failed: {failed_count}")
