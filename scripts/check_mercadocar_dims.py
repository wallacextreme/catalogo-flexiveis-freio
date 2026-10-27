import json
import os
from PIL import Image

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

norflex_dir = 'public/catalog-images/norflex'

dimensions = {}
for sku in scraped.keys():
    path = os.path.join(norflex_dir, f"{sku.lower()}.webp")
    if os.path.exists(path):
        try:
            im = Image.open(path)
            dimensions[im.size] = dimensions.get(im.size, 0) + 1
        except Exception:
            pass

print("Dimensions of downloaded MercadoCar Norflex images:")
for dim, count in sorted(dimensions.items(), key=lambda x: -x[1]):
    print(f"  {dim}: {count} images")
