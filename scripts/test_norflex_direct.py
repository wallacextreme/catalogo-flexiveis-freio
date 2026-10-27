import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

test_skus = ['3036', '1005', '2129', '4020', '3011', '9002', '9000', '2001', '3001', '5020']

for sku in test_skus:
    url = f"https://www.mercadocar.com.br/search?q=norflex+{sku}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Look for norflex-sku in image or link
            m = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*norflex-' + re.escape(sku.lower()) + r'[^\'\"\s>]*', html, re.I)
            if m:
                print(f"SKU {sku}: FOUND in image -> {m[0]}")
            else:
                m2 = re.findall(r'href=[\"\'](/[^\"\']*norflex-' + re.escape(sku.lower()) + r'[^\"\']*)[\"\']', html, re.I)
                if m2:
                    print(f"SKU {sku}: FOUND link -> {m2[0]}")
                else:
                    print(f"SKU {sku}: NOT FOUND")
    except Exception as e:
        print(f"SKU {sku} Error: {e}")
