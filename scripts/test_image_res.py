import urllib.request
import re
from PIL import Image
import io

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

thumb_url = "https://stgecomm.blob.core.windows.net/imagesprod2/0416381_flexivel-de-freio-dianteiro-ford-aeroitamarati-1960-1972-408mm-norflex-3017_360.jpeg"
high_url = "https://stgecomm.blob.core.windows.net/imagesprod2/0416381_flexivel-de-freio-dianteiro-ford-aeroitamarati-1960-1972-408mm-norflex-3017.jpeg"

print("Fetching thumb...")
req1 = urllib.request.Request(thumb_url, headers=headers)
with urllib.request.urlopen(req1) as resp:
    b1 = resp.read()
    im1 = Image.open(io.BytesIO(b1))
    print(f"Thumb size: {len(b1)} bytes, dim: {im1.size}")

print("Fetching high-res...")
req2 = urllib.request.Request(high_url, headers=headers)
try:
    with urllib.request.urlopen(req2) as resp:
        b2 = resp.read()
        im2 = Image.open(io.BytesIO(b2))
        print(f"High-res size: {len(b2)} bytes, dim: {im2.size}")
except Exception as e:
    print("Error fetching high-res:", e)
