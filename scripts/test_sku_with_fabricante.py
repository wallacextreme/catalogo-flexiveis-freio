import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

test_skus = ['1001', '1005', '3001', '3013', '2001', '9002', '3036', '2129']

for sku in test_skus:
    url = f"https://www.mercadocar.com.br/search?q={sku}&fabricante=NORFLEX"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            m = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*norflex[^\'\"\s>]*', html, re.I)
            if m:
                print(f"SKU {sku} with fabricante=NORFLEX: FOUND -> {m[0]}")
            else:
                print(f"SKU {sku} with fabricante=NORFLEX: NOT FOUND")
    except Exception as e:
        print(f"Error {sku}: {e}")
