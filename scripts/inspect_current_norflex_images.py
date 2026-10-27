import os
from PIL import Image

norflex_dir = 'public/catalog-images/norflex'
files = os.listdir(norflex_dir)
print(f"Total files in {norflex_dir}: {len(files)}")

sizes = {}
for f in files[:30]:
    path = os.path.join(norflex_dir, f)
    try:
        im = Image.open(path)
        sz = os.path.getsize(path)
        print(f"  {f}: dim={im.size}, mode={im.mode}, size={sz} bytes")
    except Exception as e:
        print(f"  {f}: ERROR {e}")
