import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

# Let's inspect a product page, e.g. /flexivel-de-freio-ford-f1000-norflex-3024a
url = "https://www.mercadocar.com.br/flexivel-de-freio-ford-f1000-norflex-3024a"
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        imgs = set(re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]+\.(?:jpeg|jpg|png|webp)', html, re.I))
        print(f"Product page {url} has {len(imgs)} images:")
        for im in imgs:
            print(" ", im)
except Exception as e:
    print("Error:", e)
