import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9'
}

url = 'https://www.mercadocar.com.br/search?q=RPFX00050'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        print('Status:', resp.status)
        html = resp.read().decode('utf-8', errors='ignore')
        print('HTML length:', len(html))
        # Look for product titles, product links, or images
        images = re.findall(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>', html, re.IGNORECASE)
        print('Found images count:', len(images))
        product_images = [img for img in images if 'product' in img.lower() or 'upload' in img.lower() or 'catalog' in img.lower() or 'thumbs' in img.lower() or 'images' in img.lower()]
        print('Sample product images:', product_images[:10])

        # Also search for RPFX in the html
        matches = re.findall(r'.{0,50}RPFX00050.{0,50}', html, re.IGNORECASE)
        print('Matches for RPFX00050:', len(matches))
        for m in matches[:5]:
            print('  ->', m.strip())
except Exception as e:
    print('Error:', e)
