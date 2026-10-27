import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products: {len(products)}")

# Check TRW products
trw_prods = [p for p in products if p['brand'] == 'TRW']
print(f"Total TRW products: {len(trw_prods)}")

# Check Norflex products
norflex_prods = [p for p in products if p['brand'] == 'Norflex']
print(f"Total Norflex products: {len(norflex_prods)}")

# Audit makes
all_makes = set()
for p in products:
    for m in p.get('makes', []):
        all_makes.add(m)
    for app in p.get('applications', []):
        all_makes.add(app.get('make', ''))

print("\nDistinct makes across all products:")
for m in sorted(all_makes):
    print(f"  '{m}'")

# Check for any '//' or trailing OEM in models
issues = []
for p in products:
    for app in p.get('applications', []):
        m = app.get('models', '')
        # Check for '//'
        if '//' in m:
            issues.append((p['sku'], p['brand'], 'Contains //', m))
        # Check for OCR junk or trailing numbers >= 5 digits
        elif re.search(r'\d{5,}', m):
            issues.append((p['sku'], p['brand'], 'Contains 5+ digits', m))
        elif any(bad in m for bad in ['ECE', 'EFE', 'EGE', 'EME', 'E.E', 'E-E', '..g', '%', '']):
            issues.append((p['sku'], p['brand'], 'Contains corrupt chars', m))

print(f"\nTotal issues found in models: {len(issues)}")
for sku, brand, reason, m in issues[:40]:
    print(f"  [{sku}] ({brand}) {reason}: '{m}'")
