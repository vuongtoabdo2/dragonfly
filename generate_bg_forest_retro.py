from PIL import Image, ImageDraw
import random

def create_retro_forest():
    w, h = 54, 96
    img = Image.new('RGBA', (w, h), (34, 139, 34, 255)) 
    draw = ImageDraw.Draw(img)
    
    # Dirt patches
    for _ in range(8):
        dw = random.randint(4, 10)
        dh = random.randint(4, 10)
        x = random.randint(0, w)
        y = random.randint(0, h)
        color = (139, 69, 19, 255)
        
        draw.rectangle([x, y, x+dw, y+dh], fill=color)
        
        # wrap
        if y < 10:
            draw.rectangle([x, y + h, x+dw, y + h + dh], fill=color)
        elif y > h - 10:
            draw.rectangle([x, y - h, x+dw, y - h + dh], fill=color)

    # Trees
    for _ in range(25):
        x = random.randint(-2, w)
        y = random.randint(0, h - 1)
        r = random.randint(3, 5) # blocky radius
        
        def draw_tree(tx, ty, tr):
            draw.rectangle([tx-tr, ty-tr, tx+tr, ty+tr], fill=(0, 100, 0, 255))
            draw.rectangle([tx-int(tr*0.6), ty-int(tr*0.6), tx+int(tr*0.6), ty+int(tr*0.6)], fill=(50, 205, 50, 255))
            draw.rectangle([tx-int(tr*0.2), ty-int(tr*0.4), tx+int(tr*0.4), ty+int(tr*0.2)], fill=(144, 238, 144, 255))
            
        draw_tree(x, y, r)
        
        if y < r + 2:
            draw_tree(x, y + h, r)
        elif y > h - r - 2:
            draw_tree(x, y - h, r)

    # Scale up exactly 10x with NEAREST to get that chunky 16-bit/8-bit pixel art look
    final_img = img.resize((540, 960), resample=Image.NEAREST)
    
    final_img.save('background.png')
    print("Successfully generated true retro pixel art forest background.png")

if __name__ == "__main__":
    create_retro_forest()
