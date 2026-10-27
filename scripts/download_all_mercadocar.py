import json
import urllib.request
from PIL import Image
import io
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

IMG_DIR = Path('public/catalog-images/trw')
IMG_DIR.mkdir(parents=True, exist_ok=True)

with open('scripts/mercadocar_trw_images.json', 'r', encoding='utf-8') as f:
    trw_images_map = json.load(f)

print(f"Total TRW images to download and convert: {len(trw_images_map)}")

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def download_and_convert(sku, url):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        
        img = Image.open(io.BytesIO(data))
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        out_file = IMG_DIR / f"{sku.lower()}.webp"
        img.save(out_file, 'WEBP', quality=92, method=6)
        return sku, True, out_file.stat().st_size
    except Exception as e:
        return sku, False, str(e)

t0 = time.time()
success_count = 0
failed = []

with ThreadPoolExecutor(max_workers=8) as executor:
    futures = {executor.submit(download_and_convert, sku, url): sku for sku, url in trw_images_map.items()}
    for fut in as_completed(futures):
        sku, ok, info = fut.result()
        if ok:
            success_count += 1
            if success_count % 20 == 0 or success_count == len(trw_images_map):
                print(f"[{success_count}/{len(trw_images_map)}] Downloaded and saved {sku}.webp ({info} bytes)")
        else:
            failed.append((sku, info))
            print(f"[FAIL] {sku}: {info}")

elapsed = time.time() - t0
print(f"\nFinished in {elapsed:.1f}s. Successfully saved: {success_count}, Failed: {len(failed)}")

# Now update catalog-master-seed.json to ensure all these TRW products reference their image
with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

updated_prods = 0
for p in products:
    sku = p['sku']
    if p['brand'] == 'TRW' and sku in trw_images_map:
        rel_path = f"/catalog-images/trw/{sku.lower()}.webp"
        p['images'] = [rel_path]
        updated_prods += 1

with open('src/data/catalog-master-seed.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Updated {updated_prods} TRW products in catalog-master-seed.json!")
