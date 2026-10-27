import re

with open('scripts/norflex_sample_search.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Search for pagination elements
print("Pagination search:")
for m in re.finditer(r'(pager|pagination|page-item|page-link|pageNumber|pageIndex|data-page)', html, re.I):
    start = max(0, m.start() - 100)
    end = min(len(html), m.end() + 200)
    print("MATCH:", html[start:end])
    print("-" * 50)
    break

# Search for total items / count
for m in re.finditer(r'(encontrado|resultado|total|itens|produtos)', html, re.I):
    start = max(0, m.start() - 50)
    end = min(len(html), m.end() + 50)
    text = html[start:end].replace('\n', ' ')
    if any(c.isdigit() for c in text):
        print("COUNT CONTEXT:", text)
