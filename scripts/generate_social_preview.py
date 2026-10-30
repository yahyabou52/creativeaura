"""Generate the static share image; run with `python scripts/generate_social_preview.py`."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "social-preview.png"
WIDTH, HEIGHT = 1200, 630
NAVY = (16, 33, 61)
SKY = (131, 217, 243)
WHITE = (244, 252, 255)


def font(size, bold=True):
    filename = "arialbd.ttf" if bold else "arial.ttf"
    path = Path("C:/Windows/Fonts") / filename
    return ImageFont.truetype(str(path), size)


image = Image.new("RGB", (WIDTH, HEIGHT), NAVY)
draw = ImageDraw.Draw(image)
draw.ellipse((892, -155, 1375, 330), fill=SKY)
draw.ellipse((980, -62, 1300, 260), fill=NAVY)
draw.ellipse((-110, 395, 205, 710), outline=SKY, width=42)
draw.text((75, 65), "CREATIVEAURA", font=font(32), fill=WHITE)
draw.line((75, 122, 1125, 122), fill=(85, 115, 147), width=2)
draw.text((75, 175), "UNCOMMON", font=font(112), fill=WHITE)
draw.text((75, 290), "BY DESIGN", font=font(112), fill=SKY)
draw.text((79, 515), "WEBSITES  /  BRANDING  /  DIGITAL EXPERIENCES", font=font(23, False), fill=WHITE)
image.save(OUTPUT, optimize=True)
print(OUTPUT)
