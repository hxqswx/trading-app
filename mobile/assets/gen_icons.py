"""
Generate all Expo icon assets for TradeAI.
Run: python assets/gen_icons.py
"""
import os
import math
from PIL import Image, ImageDraw

HERE   = os.path.dirname(os.path.abspath(__file__))
DARK   = (8, 12, 20)        # #080c14
PURPLE = (91, 33, 182)      # #5b21b6
PURPLE2= (30, 27, 75)       # #1e1b4b
GREEN  = (34, 197, 94)      # #22c55e
RED    = (239, 68, 68)      # #ef4444
GOLD   = (244, 185, 66)     # #f4b942
GOLD2  = (245, 158, 11)     # #f59e0b

# ── helpers ──────────────────────────────────────────────────────────────────

def lerp_color(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def radial_gradient(size, center_color, edge_color, radius_pct=0.6):
    """Draw radial gradient onto a new RGBA image."""
    img  = Image.new("RGBA", (size, size), (*edge_color, 255))
    cx   = cy = size / 2
    r    = size * radius_pct
    px   = img.load()
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy)
            t = min(d / r, 1.0)
            c = lerp_color(center_color, edge_color, t)
            px[x, y] = (*c, 255)
    return img

def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    for cx, cy in [(x0+radius, y0+radius),(x1-radius, y0+radius),
                   (x0+radius, y1-radius),(x1-radius, y1-radius)]:
        draw.ellipse([cx-radius, cy-radius, cx+radius, cy+radius], fill=fill)

def draw_icon(size):
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rect (corner radius ≈ 22%)
    r = int(size * 0.22)
    rounded_rect(draw, [0, 0, size, size], r, PURPLE2)

    # Radial overlay for depth
    glow = radial_gradient(size, PURPLE, PURPLE2, 0.55)
    img.paste(glow, mask=glow)
    draw = ImageDraw.Draw(img)

    # --- Candlestick bars ---
    pad  = size * 0.18
    iw   = size - pad * 2
    ih   = size - pad * 2

    candles = [
        dict(x=0.04, bb=0.28, bt=0.65, wb=0.16, wt=0.78, up=False),
        dict(x=0.27, bb=0.18, bt=0.58, wb=0.08, wt=0.70, up=True ),
        dict(x=0.50, bb=0.32, bt=0.76, wb=0.22, wt=0.88, up=True ),
        dict(x=0.73, bb=0.10, bt=0.54, wb=0.02, wt=0.64, up=True ),
    ]
    cw = iw * 0.18

    for c in candles:
        cx   = pad + c["x"] * iw
        bbot = pad + ih * (1 - c["bb"])
        btop = pad + ih * (1 - c["bt"])
        wbot = pad + ih * (1 - c["wb"])
        wtop = pad + ih * (1 - c["wt"])
        midx = cx + cw / 2
        col  = GREEN if c["up"] else RED

        # Wick
        lw = max(1, int(size * 0.012))
        draw.line([(midx, wtop), (midx, wbot)], fill=col, width=lw)
        # Body
        draw.rectangle([cx, btop, cx + cw, bbot], fill=col)

    # --- Gold arrow (bottom-left → upper-right diagonal) ---
    ax0, ay0 = size * 0.22, size * 0.76
    ax1, ay1 = size * 0.82, size * 0.20
    aw  = max(3, int(size * 0.055))  # arrow shaft width
    ahead = max(4, int(size * 0.11)) # arrowhead size

    # Shaft (thick line)
    draw.line([(ax0, ay0), (ax1, ay1)], fill=GOLD, width=aw)

    # Arrowhead (triangle)
    # Direction vector
    dx = ax1 - ax0; dy = ay1 - ay0
    length = math.hypot(dx, dy)
    ux = dx / length; uy = dy / length
    # Perpendicular
    px2 = -uy; py2 = ux
    tip   = (ax1, ay1)
    base1 = (ax1 - ux*ahead + px2*ahead*0.6, ay1 - uy*ahead + py2*ahead*0.6)
    base2 = (ax1 - ux*ahead - px2*ahead*0.6, ay1 - uy*ahead - py2*ahead*0.6)
    draw.polygon([tip, base1, base2], fill=GOLD2)

    return img

def make_splash(icon_size=512, w=1242, h=2436):
    bg   = Image.new("RGBA", (w, h), (*DARK, 255))
    icon = draw_icon(icon_size)
    x    = (w - icon_size) // 2
    y    = (h - icon_size) // 2 - int(h * 0.04)
    bg.paste(icon, (x, y), icon)
    return bg.convert("RGB")

# ── generate ──────────────────────────────────────────────────────────────────

print("Generating TradeAI icons...")

# Main icon 1024×1024
icon1024 = draw_icon(1024)
icon1024.convert("RGB").save(os.path.join(HERE, "icon.png"))
print("  [ok] icon.png (1024x1024)")

# Android adaptive icon
icon1024.convert("RGB").save(os.path.join(HERE, "adaptive-icon.png"))
print("  [ok] adaptive-icon.png (1024x1024)")

# Splash screen 1242x2436
splash = make_splash(512)
splash.save(os.path.join(HERE, "splash.png"))
print("  [ok] splash.png (1242x2436)")

# Favicon 64x64
favicon = draw_icon(64).convert("RGB")
favicon.save(os.path.join(HERE, "favicon.png"))
print("  [ok] favicon.png (64x64)")

print("\nDone! Check mobile/assets/")
