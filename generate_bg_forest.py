from PIL import Image, ImageDraw
import random

def create_forest_background(width, height):
    # Base grass color (retro vibrant green)
    img = Image.new('RGBA', (width, height), (34, 139, 34, 255)) 
    draw = ImageDraw.Draw(img)
    
    # 1. Draw some dirt patches
    for _ in range(15):
        w = random.randint(40, 100)
        h = random.randint(40, 100)
        x = random.randint(0, width)
        y = random.randint(0, height)
        # Dirt color
        color = (139, 69, 19, 255)
        
        draw.ellipse([x, y, x+w, y+h], fill=color)
        
        # Wrapping dirt logic for vertical seamlessness
        if y < 100:
            draw.ellipse([x, y + height, x+w, y + height+h], fill=color)
        elif y > height - 100:
            draw.ellipse([x, y - height, x+w, y - height+h], fill=color)

    # 2. Draw trees (top-down view of canopies - stacked green circles)
    for _ in range(30):
        # We want clustering but random is fine for retro feel
        x = random.randint(-20, width)
        y = random.randint(0, height - 1)
        r = random.randint(20, 40)
        
        def draw_tree(tx, ty, tr):
            # Outer dark leaves
            draw.ellipse([tx-tr, ty-tr, tx+tr, ty+tr], fill=(0, 100, 0, 255), outline=(0, 50, 0, 255))
            # Inner light leaves
            draw.ellipse([tx-tr*0.6, ty-tr*0.6, tx+tr*0.6, ty+tr*0.6], fill=(50, 205, 50, 255))
            # Highlight
            draw.ellipse([tx-tr*0.2, ty-tr*0.4, tx+tr*0.4, ty+tr*0.2], fill=(144, 238, 144, 255))
        
        draw_tree(x, y, r)
        
        # Vertical Wrapping for trees
        if y < r + 10:
            draw_tree(x, y + height, r)
        elif y > height - r - 10:
            draw_tree(x, y - height, r)

    # 3. Add some rocky mountain-like outcroppings
    for _ in range(8):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(30, 70)
        
        points = [
            (x, y-size), (x+size*1.2, y+size*0.5), (x-size*1.2, y+size*0.5)
        ]
        
        def draw_rock(py):
            draw.polygon([(x, py-size), (x+size*1.2, py+size*0.5), (x-size*1.2, py+size*0.5)], fill=(105, 105, 105, 255), outline=(50, 50, 50, 255))
            # Rock highlight
            draw.polygon([(x, py-size), (x+size*0.3, py-size*0.2), (x, py+size*0.5), (x-size*0.8, py+size*0.3)], fill=(169, 169, 169, 255))
            
        draw_rock(y)
        
        # Wrapping
        if y - size < 0:
            draw_rock(y + height)
        elif y + size > height:
            draw_rock(y - height)

    try:
        img.save('background.png')
        print("Successfully generated seamless forest/mountain background.png")
    except Exception as e:
        print(f"Error saving: {e}")

if __name__ == "__main__":
    create_forest_background(540, 960)
