import json

with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total keys: {len(data)}")
sample_keys = list(data.keys())[:50]
print(f"Sample keys: {sample_keys}")
