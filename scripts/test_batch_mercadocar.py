import urllib.request
import re
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9'
}

test_skus = ['RPFX00010', 'RPFX00040', 'RPFX00050', 'RPFX00060', 'RPFX00070', 'RPFX00110', 'RPFX00170', 'RPFX01690', 'RPFX02700', 'RPFX03260']

for sku in test_skus:
    url = f'https://www.mercadocar.com.br/search?q={sku}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract product image matching this SKU
            # In HTML: src="https://stgecomm.blob.core.windows.net/imagesprod2/XXXX_..._360.jpeg"
            matches = re.findall(r'(https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]*(?:' + sku.lower() + r'|flexivel)[^\'\"\s>]*)', html, re.IGNORECASE)
            # Also extract any product image in item-box
            all_prod_imgs = re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/\d+_[^\'\"\s>]+', html)
            print(f'[{sku}] Matches for SKU: {len(matches)}, All prod imgs: {len(all_prod_imgs)}')
            if matches:
                # remove _360 or _450 to get full 1000x1000
                full_url = re.sub(r'_\d+\.jpeg$', '.jpeg', matches[0])
                print(f'   -> Found: {full_url}')
            elif all_prod_imgs:
                # check if flexivel
                flex = [img for img in all_prod_imgs if 'flexivel' in img.lower()]
                if flex:
                    full_url = re.sub(r'_\d+\.jpeg$', '.jpeg', flex[0])
                    print(f'   -> Found fallback flexivel: {full_url}')
                else:
                    print(f'   -> None flexivel in all_prod_imgs: {all_prod_imgs[:2]}')
            else:
                print(f'   -> Not found on MercadoCar')
    except Exception as e:
        print(f'[{sku}] Error: {e}')
    time.sleep(0.5)
