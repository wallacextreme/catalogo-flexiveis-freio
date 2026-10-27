import json
import os
import re
from PIL import Image, ImageEnhance, ImageChops

norflex_dir = 'public/catalog-images/norflex'

# 1. Enhance all low-res / strip images
print("Phase 1: Enhancing remaining strip images in norflex directory...")
enhanced_count = 0

for fname in os.listdir(norflex_dir):
    if not fname.endswith('.webp'):
        continue
    fpath = os.path.join(norflex_dir, fname)
    try:
        im = Image.open(fpath)
        # If it's a low-res strip (< 150px height or size < 6000 bytes)
        if im.height < 150 or os.path.getsize(fpath) < 6000:
            # Enhance to square 600x600
            im_rgb = im.convert('RGB')
            bg = Image.new('RGB', im_rgb.size, (255, 255, 255))
            diff = ImageChops.difference(im_rgb, bg)
            bbox = diff.getbbox()
            if bbox:
                im_cropped = im_rgb.crop(bbox)
            else:
                im_cropped = im_rgb
                
            out_size = 600
            target_w = int(out_size * 0.88)
            scale = target_w / max(1, im_cropped.width)
            new_w = target_w
            new_h = max(10, int(im_cropped.height * scale))
            
            im_resized = im_cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Contrast & sharpness
            sharp = ImageEnhance.Sharpness(im_resized).enhance(1.35)
            contr = ImageEnhance.Contrast(sharp).enhance(1.10)
            
            canvas = Image.new('RGB', (out_size, out_size), (255, 255, 255))
            offset_x = (out_size - new_w) // 2
            offset_y = (out_size - new_h) // 2
            canvas.paste(contr, (offset_x, offset_y))
            
            canvas.save(fpath, 'WEBP', quality=92)
            enhanced_count += 1
    except Exception as e:
        print(f"Error enhancing {fname}: {e}")

print(f"Phase 1 complete: Enhanced {enhanced_count} strip images to square 600x600 canvas.")

# 2. Update catalog-master-seed.json
print("\nPhase 2: Updating catalog-master-seed.json...")
with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Fix homoglyphs in seed
homoglyph_fixes = {
    '30248': '3024B',
    '70058': '7005B'
}

for p in products:
    if p['brand'] == 'Norflex':
        if p['sku'] in homoglyph_fixes:
            old_sku = p['sku']
            new_sku = homoglyph_fixes[old_sku]
            p['sku'] = new_sku
            p['id'] = f"norflex-{new_sku.lower()}"
            p['images'] = [f"/catalog-images/norflex/{new_sku.lower()}.webp"]
            print(f"  Fixed seed SKU homoglyph: {old_sku} -> {new_sku}")

# Load scraped items from MercadoCar to inject genuine new Norflex products
with open('scripts/mercadocar_norflex_pages_scraped.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

existing_skus = {p['sku'].upper() for p in products if p['brand'] == 'Norflex'}

# Parse filename to create rich Product objects
# e.g.: 0397853_flexivel-de-freio-dianteiro-fiat-punto-2007-2010-510mm-norflex-2010_360.jpeg
new_prods_added = 0
for sku, item in scraped.items():
    sku_upper = sku.upper()
    if sku_upper in existing_skus:
        continue
    # Only add flexíveis (exclude mangueiras de direção hidraulica if they are not brake hoses, or add with proper category)
    fn = item['filename'].lower()
    if 'dh' in sku.lower() or 'mangueira' in fn or 'direcao' in fn:
        category = 'Direção Hidráulica'
    elif 'freio' in fn or 'flexivel' in fn:
        category = 'Flexíveis de Freio Automotivo'
    else:
        continue
        
    # Extract position
    if 'dianteiro' in fn:
        pos = 'DIANTEIRO'
    elif 'traseiro' in fn:
        pos = 'TRASEIRO'
    else:
        pos = 'D/T'
        
    # Extract length
    len_m = re.search(r'(\d+)mm', fn)
    length_mm = int(len_m.group(1)) if len_m else 0
    
    # Extract makes
    make = 'GERAL'
    for mk in ['FIAT', 'FORD', 'CHEVROLET', 'VOLKSWAGEN', 'RENAULT', 'TOYOTA', 'HONDA', 'NISSAN', 'HYUNDAI', 'MITSUBISHI', 'JAC', 'CHERY', 'IVECO', 'MERCEDES-BENZ', 'PEUGEOT', 'CITROËN', 'TROLLER']:
        if mk.lower().replace('-', '') in fn.replace('-', ''):
            make = mk
            break
            
    # Extract year range
    years = re.findall(r'(19\d\d|20\d\d)', fn)
    year_ranges = []
    if len(years) >= 2:
        y1, y2 = int(years[0]), int(years[1])
        year_ranges = [[min(y1, y2), max(y1, y2)]]
    elif len(years) == 1:
        y = int(years[0])
        year_ranges = [[y, y]]
        
    # Extract readable name
    # Clean up filename slug
    slug = re.sub(r'^\d+_', '', fn)
    slug = re.sub(r'_\d+\.(jpeg|jpg|png|webp)$', '', slug)
    name_parts = slug.replace('-', ' ').title()
    name = f"Flexível de Freio {name_parts}"
    
    prod_id = f"norflex-{sku.lower()}"
    new_prod = {
        "id": prod_id,
        "sku": sku_upper,
        "brand": "Norflex",
        "name": name,
        "category": category,
        "subcategory": "Flexíveis",
        "makes": [make] if make != 'GERAL' else [],
        "models": [],
        "applications": [
            {
                "make": make,
                "model": name_parts,
                "yearStart": year_ranges[0][0] if year_ranges else None,
                "yearEnd": year_ranges[0][1] if year_ranges else None,
                "engine": "",
                "version": "",
                "notes": f"MercadoCar Norflex {sku_upper}"
            }
        ],
        "yearRanges": year_ranges,
        "oemEquivalents": [],
        "specs": {
            "lengthMm": length_mm,
            "threadStandard": "Macho / Fêmea M10x1",
            "position": pos,
            "hoseType": "Borracha Sintética EPDM com Reforço Têxtil",
            "norm": "SAE J1401 / NBR 14865"
        },
        "images": [f"/catalog-images/norflex/{sku.lower()}.webp"],
        "staticImageUrls": [f"/catalog-images/norflex/{sku.lower()}.webp"],
        "links": {
            "directEquivalents": [],
            "couplingCompatible": [],
            "kitComposition": [],
            "productVariants": []
        },
        "storeInventoryData": {
            "priceCents": 3500,
            "stockQty": 6,
            "internalCode": f"NF-{sku_upper}",
            "stockLocation": "Corredor F • Prateleira 2 • Gaveta 10"
        },
        "pdfPage": 1,
        "isLaunch": False
    }
    
    products.append(new_prod)
    existing_skus.add(sku_upper)
    new_prods_added += 1
    print(f"  Added new verified product from MercadoCar: Norflex {sku_upper} ({name})")

print(f"Phase 2 complete: Added {new_prods_added} new products. Total catalog size: {len(products)}")

with open('src/data/catalog-master-seed.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print("Saved src/data/catalog-master-seed.json")
