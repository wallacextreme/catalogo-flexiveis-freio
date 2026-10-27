from PIL import Image, ImageEnhance, ImageOps, ImageChops

def enhance_strip_to_square(img_path, out_size=600):
    im = Image.open(img_path).convert('RGB')
    
    # 1. Trim pure white borders if any
    bg = Image.new('RGB', im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    if bbox:
        im = im.crop(bbox)
        
    # 2. Scale image so its longest dimension fits out_size * 0.85
    target_w = int(out_size * 0.88)
    scale = target_w / im.width
    new_w = target_w
    new_h = int(im.height * scale)
    
    # Resize with high quality Lanczos
    im_resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 3. Enhance sharpness and subtle contrast
    enhancer_sharp = ImageEnhance.Sharpness(im_resized)
    im_sharp = enhancer_sharp.enhance(1.4)
    
    enhancer_contrast = ImageEnhance.Contrast(im_sharp)
    im_contrast = enhancer_contrast.enhance(1.1)
    
    # 4. Paste centered on pure white square canvas
    canvas = Image.new('RGB', (out_size, out_size), (255, 255, 255))
    offset_x = (out_size - new_w) // 2
    offset_y = (out_size - new_h) // 2
    canvas.paste(im_contrast, (offset_x, offset_y))
    
    return canvas

test_out = enhance_strip_to_square('public/catalog-images/norflex/1001.webp')
print(f"Enhanced size: {test_out.size}")
test_out.save('scripts/test_enhanced_1001.webp', 'WEBP', quality=92)
import os
print(f"Saved scripts/test_enhanced_1001.webp: {os.path.getsize('scripts/test_enhanced_1001.webp')} bytes")
