from PIL import Image

im = Image.open('public/catalog-images/norflex/1001.webp')
print(f"Size: {im.size}, mode: {im.mode}")
print(f"Corner top-left: {im.getpixel((0,0))}")
print(f"Corner bottom-right: {im.getpixel((im.width-1, im.height-1))}")
print(f"Center: {im.getpixel((im.width//2, im.height//2))}")
