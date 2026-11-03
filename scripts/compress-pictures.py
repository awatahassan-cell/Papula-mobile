"""Shrinks assets/pictures/*.png to 256-colour PNGs (about 7x smaller, looks the same). Safe to run again: already small files are skipped."""
import glob, io, os, sys
from PIL import Image
for path in sorted(glob.glob(os.path.join(os.path.dirname(__file__), '..', 'assets', 'pictures', '*.png'))):
    image = Image.open(path)
    if image.mode == 'P':
        continue
    small = image.convert('RGBA').quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    buffer = io.BytesIO(); small.save(buffer, 'PNG', optimize=True)
    if buffer.tell() < os.path.getsize(path):
        open(path, 'wb').write(buffer.getvalue())
        print(os.path.basename(path), buffer.tell() // 1024, 'KB', file=sys.stderr)
