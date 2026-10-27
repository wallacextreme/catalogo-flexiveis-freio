import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.extract_catalogs_xref import parse_trw_catalog

trw_pdf = Path('trw-flexiveis-para-freios.pdf')
prods, n_to_t = parse_trw_catalog(trw_pdf)

all_makes = set()
for sku, p in prods.items():
    all_makes.update(p['makes'])
    for app in p['applications']:
        all_makes.add(app['make'])

print(f"Total TRW products: {len(prods)}")
print(f"Distinct TRW makes: {sorted(list(all_makes))}")

# Check any with 'E' corruption or //
issues = []
for sku, p in prods.items():
    for app in p['applications']:
        m = app['models']
        if any(c in m for c in ['ECE', 'EFE', 'EGE', 'EME', 'EHE', 'EKE', 'EPE', 'ERE', 'ETE', 'EVE', 'E.E', 'E-E', '//']):
            issues.append((sku, app['make'], m))

print(f"Issues found in fresh parse_trw_catalog: {len(issues)}")
for sku, mk, m in issues:
    print(f"  [{sku}] {mk}: '{m}'")
