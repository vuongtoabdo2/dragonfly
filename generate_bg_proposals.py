import math
import random
from PIL import Image, ImageDraw
import sys

def generate_proposals():
    print("Generating bg_proposal_1.png (River Forest)...")
    w, h = 54, 96
    img = Image.new('RGBA', (w, h), (34, 139, 34, 255))
    draw = ImageDraw.Draw(img)

    # 1. Base grass with noise
    for y in range(h):
        for x in range(w):
            val = random.randint(-10, 10)
            draw.point((x, y), fill=(34 + val, 139 + val, 34 + val, 255))

    # 2. Draw a winding river
    def river_x(y):
        return int(w/2 + math.sin(y/h * math.pi * 2) * 15)

    for y in range(h):
        cx = river_x(y)
        for rw in range(-6, 7):
            # Water colors
            color = (30, 144, 255, 255)
            if abs(rw) > 4:
                color = (0, 191, 255, 255) # lighter edge
            if abs(rw) > 5:
                color = (210, 180, 140, 255) # sand edge
            
            # Add some water waves
            if random.random() < 0.2 and abs(rw) < 4:
                color = (135, 206, 235, 255)
            
            nx = cx + rw
            if 0 <= nx < w:
                draw.point((nx, y), fill=color)

    # 3. Add trees
    trees = []
    for _ in range(70):
        tx = random.randint(0, w-1)
        ty = random.randint(0, h-1)
        # Check distance to river
        rx = river_x(ty)
        if abs(tx - rx) > 8:
            trees.append((tx, ty))

    trees.sort(key=lambda t: t[1])

    for tx, ty in trees:
        def draw_tree(tx, ty):
            # Shadow
            draw.ellipse([tx-4, ty-1, tx+4, ty+3], fill=(0, 50, 0, 150))
            # Trunk
            draw.rectangle([tx-1, ty-4, tx+1, ty], fill=(139, 69, 19, 255))
            # Canopy (layered)
            draw.ellipse([tx-5, ty-9, tx+5, ty-2], fill=(0, 100, 0, 255))
            draw.ellipse([tx-4, ty-9, tx+4, ty-4], fill=(34, 139, 34, 255))
            draw.ellipse([tx-2, ty-8, tx+2, ty-5], fill=(50, 205, 50, 255))

        draw_tree(tx, ty)
        
        # Wrap trees at edges
        if ty < 12:
            draw_tree(tx, ty + h)
        elif ty > h - 12:
            draw_tree(tx, ty - h)

    final_img = img.resize((540, 960), resample=Image.NEAREST)
    # Save to artifacts directory so user can review it
    final_img.save('/Users/noname/.gemini/antigravity/brain/9dbf6765-005d-4efe-9ffe-81500763229f/bg_proposal_1.png')


    print("Generating bg_proposal_2.png (Lava Dungeon)...")
    img2 = Image.new('RGBA', (w, h), (100, 100, 100, 255))
    draw2 = ImageDraw.Draw(img2)

    # Stone tiles
    for y in range(0, h, 6):
        for x in range(0, w, 6):
            c = random.randint(70, 110)
            draw2.rectangle([x, y, x+5, y+5], fill=(c, c, c, 255))
            # Highlights
            draw2.line([x, y, x+4, y], fill=(c+30, c+30, c+30, 255))
            # Shadows
            draw2.line([x, y+5, x+5, y+5], fill=(c-30, c-30, c-30, 255))
            draw2.line([x+5, y, x+5, y+5], fill=(c-30, c-30, c-30, 255))
            
            # Moss
            if random.random() < 0.2:
                draw2.point((x+random.randint(1,4), y+random.randint(1,4)), fill=(34, 139, 34, 255))

    # Lava vents
    def lava_x(y):
        return int(w/2 + math.sin(y/h * math.pi * 4) * 12)

    for y in range(h):
        cx = lava_x(y)
        for rw in range(-4, 5):
            if abs(rw) > 3:
                color = (50, 50, 50, 255) # scorch mark
            elif abs(rw) == 3:
                color = (139, 0, 0, 255) # dark red
            elif abs(rw) == 2:
                color = (255, 69, 0, 255) # orange red
            else:
                color = (255, 215, 0, 255) # gold/yellow
            
            nx = cx + rw
            if 0 <= nx < w:
                draw2.point((nx, y), fill=color)

    final_img2 = img2.resize((540, 960), resample=Image.NEAREST)
    final_img2.save('/Users/noname/.gemini/antigravity/brain/9dbf6765-005d-4efe-9ffe-81500763229f/bg_proposal_2.png')
    
    print("Done generating proposals.")

if __name__ == "__main__":
    generate_proposals()
