import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9'
}

url = 'https://www.mercadocar.com.br/flexivel-de-freio-dianteiro-304mm-trwvarga-rpfx00050'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print('Status: 200, length:', len(html))
        # Find all blob.core.windows.net images
        blob_imgs = set(re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]+', html))
        print('Blob images found:')
        for b in sorted(blob_imgs):
            print('  ', b)
except Exception as e:
    print('Error:', e)
