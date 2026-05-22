"""
Run this script after saving the icon image as input.png in the same folder.
It generates all required Expo icon sizes.

Usage:
  python assets/make_icons.py
"""
from PIL import Image
import os

HERE = os.path.dirname(os.path.abspath(__file__))

def load_source():
    for name in ("input.png", "input.jpg", "input.jpeg", "input.webp"):
        p = os.path.join(HERE, name)
        if os.path.exists(p):
            return Image.open(p).convert("RGBA")
    raise FileNotFoundError(
        "Please save the icon image as assets/input.png and run again."
    )

def make_square(img: Image.Image, size: int) -> Image.Image:
    img = img.copy()
    img.thumbnail((size, size), Image.LANCZOS)
    # Centre on a transparent canvas
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    canvas.paste(img, offset, img)
    return canvas

def make_splash(img: Image.Image, w=1242, h=2436) -> Image.Image:
    """Expo splash: place icon centred on dark background."""
    bg = Image.new("RGBA", (w, h), (13, 17, 23, 255))   # #0d1117
    icon = make_square(img, 512)
    x = (w - icon.width) // 2
    y = (h - icon.height) // 2
    bg.paste(icon, (x, y), icon)
    return bg

src = load_source()

outputs = {
    "icon.png":          (make_square(src, 1024), "PNG"),
    "adaptive-icon.png": (make_square(src, 1024), "PNG"),
    "splash.png":        (make_splash(src),        "PNG"),
    "favicon.png":       (make_square(src, 64).convert("RGB"), "PNG"),
}

for filename, (img, fmt) in outputs.items():
    out_path = os.path.join(HERE, filename)
    img.save(out_path, fmt)
    print(f"  ✓  {filename}  ({img.width}×{img.height})")

print("\nDone! All icons saved to mobile/assets/")
