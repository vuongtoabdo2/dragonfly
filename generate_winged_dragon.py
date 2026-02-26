from PIL import Image

def generate_winged_dragon():
    try:
        # We want to create a white retro pixel dragon with bat wings and red eyes.
        # We will use the 'big_evil_dragon.png' as a base template to maintain the retro aesthetic,
        # but modify its colors to white/gray body, red eyes, and dark purple/black wings.
        
        img = Image.open('big_evil_dragon.png').convert('RGBA')
        data = img.getdata()

        new_data = []
        for item in data:
            if item[3] > 0: # Not transparent
                r, g, b, a = item
                
                # Dark green parts -> Purple/Black wings
                if g > r and g > b and g < 150:
                    new_data.append((40, 20, 60, a))
                # Light green parts -> White/Light gray body
                elif g > r and g > b and g >= 150:
                    new_data.append((220, 220, 220, a))
                # Red/Purple parts -> Bright Red Eyes/Mask
                elif r > g and r > 100:
                    new_data.append((255, 0, 0, a))
                else:
                    lum = int(0.299*r + 0.587*g + 0.114*b)
                    new_data.append((lum, lum, lum, a))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save('winged_evil.png')
        print("Successfully generated winged_evil.png (Retro Dragon)")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_winged_dragon()
