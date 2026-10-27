import json
import urllib.request
from PIL import Image
import io
from pathlib import Path
import time

IMG_DIR = Path('public/catalog-images/trw')

with open('scripts/mercadocar_trw_images.json', 'r', encoding='utf-8') as f:
    trw_images_map = json.load(f)

# Find missing or failed ones
missing = []
for sku, url in trw_images_map.items():
    file_path = IMG_DIR / f"{sku.lower()}.webp"
    if not file_path.exists() or file_path.stat().st_size < 1000:
        missing.append((sku, url))

print(f"Missing or small images to retry: {len(missing)}")

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

recovered = 0
for sku, url in missing:
    out_file = IMG_DIR / f"{sku.lower()}.webp"
    success = False
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = resp.read()
            img = Image.open(io.BytesIO(data))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(out_file, 'WEBP', quality=92, method=6)
            print(f"[RECOVERED] {sku} ({out_file.stat().st_size} bytes)")
            recovered += 1
            success = True
            break
        except Exception as e:
            print(f"  Attempt {attempt+1} failed for {sku}: {e}")
            time.sleep(1)
    if not success:
        print(f"[PERMANENT FAIL] {sku}")

print(f"Retry completed: recovered {recovered} of {len(missing)}")
