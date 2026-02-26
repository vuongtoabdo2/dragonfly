from PIL import Image
import numpy as np

img = Image.open('background.png').convert('RGBA')
arr = np.array(img)
h, w, c = arr.shape

half_h = h // 2
top = arr[:half_h, :, :]
bot = arr[half_h:, :, :]

# Swap halves so the external edges become internal, internal become external
new_arr = np.vstack((bot, top))

# Now there is a sharp seam at 'half_h'. Let's blend it over a 150px window.
blend_zone = 150
start_blend = half_h - blend_zone // 2
end_blend = half_h + blend_zone // 2

# We need to blur or merge the seam. A simple way is to take the original image's 
# top/bottom edges and blend them over the seam.
# The seam has the original 'bottom' edge above it, and 'top' edge below it.
# Let's blend using a linear gradient.

for i in range(blend_zone):
    alpha = i / blend_zone
    # Cross dissolve
    row1 = new_arr[start_blend + i - blend_zone].copy()
    row2 = new_arr[start_blend + i + blend_zone].copy()
    
    # Simple linear interpolation for the seam area
    new_arr[start_blend + i] = (row1 * (1 - alpha) + row2 * alpha).astype(np.uint8)

Image.fromarray(new_arr).save('background.png')
print("Seamless background created!")
