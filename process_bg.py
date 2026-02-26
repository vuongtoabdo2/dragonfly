import sys
import os
from PIL import Image
import numpy as np

def remove_white_background(input_path, output_path, tolerance=200):
    try:
        # Open image and convert to RGBA
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)
        
        # Extract R, G, B, A channels
        r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
        
        # Find pixels where R, G, B are all > tolerance (i.e. close to white)
        # We can increase tolerance if there's off-white artifacting
        white_areas = (r >= tolerance) & (g >= tolerance) & (b >= tolerance) & (a == 255)
        
        # Create an alpha mask: 0 where it was white, 255 elsewhere
        data[:,:,3][white_areas] = 0
        
        # Save output
        out_img = Image.fromarray(data)
        out_img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_bg.py <image1.png> <image2.png> ...")
        sys.exit(1)
        
    for arg in sys.argv[1:]:
        if os.path.exists(arg):
            remove_white_background(arg, arg, tolerance=230)
        else:
            print(f"File {arg} not found.")
