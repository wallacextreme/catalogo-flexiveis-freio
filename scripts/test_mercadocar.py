import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
}

req = urllib.request.Request('https://www.mercadocar.com.br/', headers=headers)
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

forms = re.findall(r'<form[^>]*action=["\']([^"\']*)["\']', html, re.IGNORECASE)
print('Forms actions:', forms)

# Find search inputs or URLs
search_links = re.findall(r'href=["\']([^"\']*(?:busca|search)[^"\']*)["\']', html, re.IGNORECASE)
print('Search links:', search_links[:10])

# Search input field
for match in re.finditer(r'<input[^>]*>', html, re.IGNORECASE):
    tag = match.group(0)
    if 'search' in tag.lower() or 'busca' in tag.lower() or 'pesquis' in tag.lower() or 'placeholder' in tag.lower():
        print('Search input:', tag)
