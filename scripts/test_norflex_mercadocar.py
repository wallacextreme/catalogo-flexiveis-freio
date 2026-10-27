import urllib.request
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9'
}

url = 'https://www.mercadocar.com.br/search?q=norflex&categorias=&fabricante=NORFLEX&orderby=0'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"HTML length: {len(html)}")
        
        # Look for imagesprod2
        images = set(re.findall(r'https://stgecomm\.blob\.core\.windows\.net/imagesprod2/[^\'\"\s>]+', html))
        print(f"Found {len(images)} unique imagesprod2 URLs")
        for img in list(images)[:10]:
            print("  IMG:", img)
            
        # Look for product cards / links
        # Usually /produto/flexivel-de-freio-... or similar
        links = set(re.findall(r'href=[\"\'](/[^\"\']+)[\"\']', html))
        prod_links = [l for l in links if 'norflex' in l.lower() or 'flexivel' in l.lower() or 'freio' in l.lower()]
        print(f"Product-like links ({len(prod_links)}):")
        for pl in prod_links[:10]:
            print("  LINK:", pl)

        # Pagination links
        page_links = [l for l in links if 'page' in l.lower() or 'p=' in l.lower() or 'pg=' in l.lower()]
        print(f"Pagination links ({len(page_links)}):")
        for pgl in page_links:
            print("  PAGE:", pgl)

        with open('scripts/norflex_sample_search.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Saved scripts/norflex_sample_search.html")

except Exception as e:
    print("Error:", e)
