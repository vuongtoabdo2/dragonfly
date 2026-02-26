from PIL import Image, ImageDraw
import random

def create_starfield(width, height, num_stars):
    img = Image.new('RGBA', (width, height), (10, 5, 20, 255)) # Deep purple space
    draw = ImageDraw.Draw(img)
    
    # Draw distant nebulas (faint colorful blobs)
    for _ in range(10):
        nx = random.randint(0, width)
        ny = random.randint(0, height)
        nr = random.randint(20, 80)
        color = (random.randint(20, 50), random.randint(10, 30), random.randint(50, 100), 100)
        draw.ellipse([nx-nr, ny-nr, nx+nr, ny+nr], fill=color)

    # Draw stars, making sure they wrap around vertically for seamless scrolling
    for _ in range(num_stars):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        
        # Star properties
        size = random.choice([1, 1, 1, 2, 2, 3])
        brightness = random.randint(150, 255)
        color = (brightness, brightness, brightness, 255)
        
        # Draw base star
        draw.rectangle([x, y, x+size-1, y+size-1], fill=color)
        
        # Draw wrapping duplicate if near top/bottom edges
        if y < 50:
            draw.rectangle([x, height + y, x+size-1, height + y+size-1], fill=color)
        elif y > height - 50:
            draw.rectangle([x, y - height, x+size-1, y - height+size-1], fill=color)

    # Draw some larger twinkling stars
    for _ in range(num_stars // 20):
        x = random.randint(5, width - 5)
        y = random.randint(5, height - 5)
        color = (255, random.randint(200, 255), random.randint(200, 255), 255)
        draw.rectangle([x, y, x+1, y+1], fill=color)
        draw.point((x-1, y), fill=color)
        draw.point((x+2, y), fill=color)
        draw.point((x, y-1), fill=color)
        draw.point((x, y+2), fill=color)
        
        # Wraparound
        if y < 50:
            y2 = height + y
            draw.rectangle([x, y2, x+1, y2+1], fill=color)
            draw.point((x-1, y2), fill=color)
            draw.point((x+2, y2), fill=color)
            draw.point((x, y2-1), fill=color)
            draw.point((x, y2+2), fill=color)

    try:
        img.save('background.png')
        print("Successfully generated background.png")
    except Exception as e:
        print(f"Error saving: {e}")

if __name__ == "__main__":
    create_starfield(540, 960, 150)
