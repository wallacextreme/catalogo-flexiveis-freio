import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

url1 = "https://www.mercadocar.com.br/search?q=norflex&categorias=&fabricante=NORFLEX&orderby=0"
url2 = "https://www.mercadocar.com.br/search?q=norflex"

for name, u in [("With fabricante=NORFLEX", url1), ("Just q=norflex", url2)]:
    req = urllib.request.Request(u, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            pager = re.search(r'<div class="pager">(.*?)</div>', html, re.DOTALL)
            last_page = 1
            if pager:
                lp = re.findall(r'data-page="(\d+)"', pager.group(1))
                if lp:
                    last_page = max(int(x) for x in lp)
            print(f"{name}: last_page={last_page}")
    except Exception as e:
        print(f"{name} error: {e}")
