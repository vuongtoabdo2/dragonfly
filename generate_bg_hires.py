import math
import random
from PIL import Image, ImageDraw

def generate_hires_proposals():
    print("Generating High-Res bg_proposal_3.png (Detailed Forest River)...")
    w, h = 540, 960
    img = Image.new('RGBA', (w, h), (40, 150, 40, 255))
    draw = ImageDraw.Draw(img)

    # 1. Base grass with noise
    for _ in range(30000):
        x = random.randint(0, w-1)
        y = random.randint(0, h-1)
        # Random greens
        c = random.choice([(34, 139, 34, 255), (50, 205, 50, 255), (0, 128, 0, 255)])
        s = random.randint(2, 6)
        draw.ellipse([x, y, x+s, y+s], fill=c)

    # 2. Draw a winding river (seamless vertical)
    def river_x(y):
        return int(w/2 + math.sin(y/h * math.pi * 2) * 80)

    for y in range(h):
        cx = river_x(y)
        # Draw river slice at y
        draw.line([cx-60, y, cx+60, y], fill=(65, 105, 225, 255), width=2)
        # Sand banks
        draw.line([cx-70, y, cx-60, y], fill=(210, 180, 140, 255), width=2)
        draw.line([cx+60, y, cx+70, y], fill=(210, 180, 140, 255), width=2)

    # Add water ripples
    for _ in range(1000):
        y = random.randint(0, h-1)
        cx = river_x(y)
        rx = random.randint(cx-50, cx+50)
        draw.line([rx, y, rx+random.randint(5, 15), y], fill=(135, 206, 235, 255), width=2)

    # 3. Add trees
    trees = []
    for _ in range(400):
        tx = random.randint(-20, w+20)
        ty = random.randint(0, h-1)
        rx = river_x(ty)
        if abs(tx - rx) > 90: # Avoid river
            trees.append((tx, ty))

    trees.sort(key=lambda t: t[1])

    for tx, ty in trees:
        def draw_tree(tx, ty):
            # shadow
            draw.ellipse([tx-30, ty-10, tx+30, ty+10], fill=(0, 50, 0, 150))
            # trunk
            draw.rectangle([tx-6, ty-40, tx+6, ty], fill=(139, 69, 19, 255))
            # Canopy (layered circles)
            draw.ellipse([tx-40, ty-90, tx+40, ty-20], fill=(0, 100, 0, 255))
            draw.ellipse([tx-30, ty-90, tx+30, ty-40], fill=(34, 139, 34, 255))
            draw.ellipse([tx-15, ty-80, tx+15, ty-50], fill=(50, 205, 50, 255))

        draw_tree(tx, ty)
        
        # Wrap trees at edges for seamlessness
        if ty < 100:
            draw_tree(tx, ty + h)
        elif ty > h - 100:
            draw_tree(tx, ty - h)

    img.save('/Users/noname/.gemini/antigravity/brain/9dbf6765-005d-4efe-9ffe-81500763229f/bg_proposal_3.png')

    print("Generating High-Res bg_proposal_4.png (Lava Canyon)...")
    img2 = Image.new('RGBA', (w, h), (90, 90, 90, 255))
    draw2 = ImageDraw.Draw(img2)

    # Big stone tiles/texture
    for _ in range(50000):
        x = random.randint(0, w-1)
        y = random.randint(0, h-1)
        c = random.randint(60, 120)
        draw2.rectangle([x, y, x+random.randint(4,10), y+random.randint(4,10)], fill=(c, c, c, 255))

    # Crack lines (wrap)
    for _ in range(100):
        x1 = random.randint(0, w)
        y1 = random.randint(0, h)
        x2 = x1 + random.randint(-40, 40)
        y2 = y1 + random.randint(-40, 40)
        draw2.line([x1, y1, x2, y2], fill=(40, 40, 40, 255), width=2)
        if y1 < 40 or y2 < 40:
            draw2.line([x1, y1+h, x2, y2+h], fill=(40, 40, 40, 255), width=2)
        elif y1 > h-40 or y2 > h-40:
            draw2.line([x1, y1-h, x2, y2-h], fill=(40, 40, 40, 255), width=2)

    # Lava river
    def lava_x(y):
        return int(w/2 + math.sin(y/h * math.pi * 3) * 100)

    for y in range(h):
        cx = lava_x(y)
        # Glow
        draw2.line([cx-70, y, cx+70, y], fill=(139, 0, 0, 255), width=2)
        draw2.line([cx-50, y, cx+50, y], fill=(255, 69, 0, 255), width=2)
        draw2.line([cx-20, y, cx+20, y], fill=(255, 215, 0, 255), width=2)

    # Lava bubbles
    for _ in range(500):
        y = random.randint(0, h-1)
        cx = lava_x(y)
        bx = random.randint(cx-40, cx+40)
        r = random.randint(3, 8)
        draw2.ellipse([bx-r, y-r, bx+r, y+r], fill=(255, 140, 0, 255))
        draw2.ellipse([bx-r+2, y-r+2, bx+r-2, y+r-2], fill=(255, 255, 0, 255))

    img2.save('/Users/noname/.gemini/antigravity/brain/9dbf6765-005d-4efe-9ffe-81500763229f/bg_proposal_4.png')
    print("Done generated high res proposals.")

if __name__ == "__main__":
    generate_hires_proposals()
