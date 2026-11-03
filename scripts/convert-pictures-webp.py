"""Turns assets/pictures/NNN-name.png into NNN-name.webp (quality 92, full-quality transparency; about 7x smaller, no visible loss)
and removes the PNG. Drop new PNGs in the folder, run this, then node scripts/build-raster-pictures.cjs."""
import glob, os, sys
from PIL import Image
folder = os.path.join(os.path.dirname(__file__), '..', 'assets', 'pictures')
for path in sorted(glob.glob(os.path.join(folder, '*.png'))):
    target = path[:-4] + '.webp'
    Image.open(path).convert('RGBA').save(target, 'WEBP', quality=92, method=6, alpha_quality=100)
    os.remove(path)
    print(os.path.basename(target), os.path.getsize(target) // 1024, 'KB', file=sys.stderr, flush=True)
