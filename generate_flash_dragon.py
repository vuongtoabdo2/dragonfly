from PIL import Image

def recolor_dragon():
    try:
        img = Image.open('mini_evil_dragon.png').convert('RGBA')
        data = img.getdata()

        new_data = []
        for item in data:
            # item is (R, G, B, A)
            # The original mini dragon has dark green and purple colors.
            # Let's change the green hue to yellow, which involves boosting red and keeping green, dropping blue.
            if item[3] > 0: # Not transparent
                # Simple recolor: boost red and green to make it yellow
                # You can also do a more naive approach based on luminance
                r, g, b, a = item
                # Average to grayscale
                lum = int(0.299*r + 0.587*g + 0.114*b)
                # Tint yellow
                new_data.append((min(255, lum + 100), min(255, lum + 80), int(lum * 0.2), a))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save('flash_dragon.png')
        print("Successfully generated flash_dragon.png")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    recolor_dragon()
