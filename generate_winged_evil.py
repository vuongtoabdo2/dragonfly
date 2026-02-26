from PIL import Image, ImageDraw

def generate_winged_demon():
    try:
        # Create a 192x192 base canvas (same size as Winged Evil)
        img = Image.new('RGBA', (192, 192), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw large bat wings (purple/black)
        # Left wing
        draw.polygon([(96, 96), (20, 40), (10, 80), (40, 110), (10, 140), (96, 120)], fill=(80, 0, 80, 255), outline=(20, 0, 20, 255))
        # Right wing
        draw.polygon([(96, 96), (172, 40), (182, 80), (152, 110), (182, 140), (96, 120)], fill=(80, 0, 80, 255), outline=(20, 0, 20, 255))

        # Big central eyeball (white with red iris)
        draw.ellipse([64, 64, 128, 128], fill=(255, 255, 255, 255), outline=(50, 50, 50, 255))
        # Red Iris
        draw.ellipse([80, 80, 112, 112], fill=(200, 0, 0, 255))
        # Black pupil
        draw.ellipse([90, 90, 102, 102], fill=(0, 0, 0, 255))

        # Horns
        draw.polygon([(70, 70), (50, 30), (85, 60)], fill=(50, 50, 50, 255))
        draw.polygon([(122, 70), (142, 30), (107, 60)], fill=(50, 50, 50, 255))

        # Floating mask/mouth below
        draw.polygon([(76, 130), (116, 130), (96, 160)], fill=(200, 200, 200, 255), outline=(100, 100, 100, 255))
        draw.line([(86, 140), (106, 140)], fill=(255, 0, 0, 255), width=3) # angry mouth slit

        # Save the new demon eyeball image, overwriting the old dragon one
        img.save('winged_evil.png')
        print("Successfully generated demonic winged_evil.png")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_winged_demon()
