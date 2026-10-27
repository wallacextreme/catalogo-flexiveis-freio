import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

test_missing = ['1001', '1003', '1004', '1005', '2003', '2014', '3001', '3002', '3013', '3014', '3023']

for sku in test_missing:
    # Try search: norflex {sku}
    url = f"https://www.mercadocar.com.br/search?q=norflex+{sku}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Look for norflex-{sku} in images
            m = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*' + re.escape(sku.lower()) + r'[^\'\"\s>]*', html, re.I)
            if m:
                print(f"SKU {sku} FOUND with 'norflex {sku}': {m[0]}")
            else:
                # Try search: flexivel {sku}
                url2 = f"https://www.mercadocar.com.br/search?q=flexivel+{sku}"
                req2 = urllib.request.Request(url2, headers=headers)
                with urllib.request.urlopen(req2, timeout=10) as resp2:
                    html2 = resp2.read().decode('utf-8', errors='ignore')
                    m2 = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*' + re.escape(sku.lower()) + r'[^\'\"\s>]*', html2, re.I)
                    if m2:
                        print(f"SKU {sku} FOUND with 'flexivel {sku}': {m2[0]}")
                    else:
                        print(f"SKU {sku} NOT FOUND on MercadoCar")
    except Exception as e:
        print(f"SKU {sku} error: {e}")
