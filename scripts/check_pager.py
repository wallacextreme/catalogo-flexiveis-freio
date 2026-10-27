import re

with open('scripts/norflex_sample_search.html', 'r', encoding='utf-8') as f:
    html = f.read()

pager_match = re.search(r'<div class="pager">(.*?)</div>', html, re.DOTALL)
if pager_match:
    print("Pager HTML:")
    print(pager_match.group(0))
else:
    print("No pager match")
