import re

with open('scripts/norflex_sample_search.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's extract each product item box
# Look for product cards
cards = re.findall(r'<div class="item-box">.*?</div>\s*</div>\s*</div>', html, re.DOTALL)
print(f"Item boxes found: {len(cards)}")

# Or search for product details
# Let's find all product titles and their corresponding image URLs
items = re.findall(r'<div class="product-item"[^>]*data-productid="(\d+)"(.*?)</div>\s*</div>\s*</div>', html, re.DOTALL)
print(f"Product items found: {len(items)}")

# Let's find images and links directly
matches = re.findall(r'<a\s+href="(/[^"]+)"[^>]*title="([^"]*)"[^>]*>.*?<img[^>]*src="([^"]+)"', html, re.DOTALL)
print(f"Matches with link, title, img: {len(matches)}")
for link, title, img in matches[:10]:
    print(f"TITLE: {title}")
    print(f"LINK: {link}")
    print(f"IMG: {img}")
    print("-" * 40)
