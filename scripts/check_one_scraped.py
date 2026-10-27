import json

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

for k in list(scraped.keys())[:5]:
    print(k, scraped[k])
