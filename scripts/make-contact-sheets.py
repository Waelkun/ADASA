import os
import glob
import math
from PIL import Image, ImageDraw, ImageFont

SCREENSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'qa-screenshots'))
SHEETS_DIR = os.path.join(SCREENSHOT_DIR, 'sheets')
os.makedirs(SHEETS_DIR, exist_ok=True)

def create_contact_sheets():
    # Find all png files directly in SCREENSHOT_DIR
    files = sorted([f for f in glob.glob(os.path.join(SCREENSHOT_DIR, '*.png')) if os.path.isfile(f)])
    if not files:
        print("No screenshots found in", SCREENSHOT_DIR)
        return

    print(f"Found {len(files)} screenshots to assemble into contact sheets.")

    # Target grid: 3 columns x 2 rows (6 per sheet)
    cols = 3
    rows = 2
    per_sheet = cols * rows

    cell_w = 400
    cell_h = 750
    header_h = 40
    padding = 20

    sheet_w = cols * cell_w + (cols + 1) * padding
    sheet_h = rows * (cell_h + header_h) + (rows + 1) * padding

    # Try to load a clean default font
    try:
        font = ImageFont.truetype("arial.ttf", 15)
        title_font = ImageFont.truetype("arialbd.ttf", 16)
    except Exception:
        font = ImageFont.load_default()
        title_font = font

    total_sheets = math.ceil(len(files) / per_sheet)

    for sheet_idx in range(total_sheets):
        sheet_img = Image.new('RGB', (sheet_w, sheet_h), color=(26, 29, 36))
        draw = ImageDraw.Draw(sheet_img)

        batch = files[sheet_idx * per_sheet : (sheet_idx + 1) * per_sheet]

        for i, filepath in enumerate(batch):
            col = i % cols
            row = i // cols

            x = padding + col * (cell_w + padding)
            y = padding + row * (cell_h + header_h + padding)

            filename = os.path.basename(filepath)

            # Draw card background
            draw.rectangle([x, y, x + cell_w, y + cell_h + header_h], fill=(36, 40, 50), outline=(60, 66, 82), width=1)
            # Draw header bar
            draw.rectangle([x, y, x + cell_w, y + header_h], fill=(45, 52, 68))
            draw.text((x + 10, y + 10), filename, fill=(240, 240, 240), font=title_font)

            # Open screenshot
            try:
                with Image.open(filepath) as img:
                    img_w, img_h = img.size
                    # Fit within cell_w - 16, cell_h - 16
                    max_w = cell_w - 16
                    max_h = cell_h - 16
                    ratio = min(max_w / img_w, max_h / img_h)
                    new_size = (int(img_w * ratio), int(img_h * ratio))
                    resized = img.resize(new_size, Image.Resampling.LANCZOS)

                    img_x = x + (cell_w - new_size[0]) // 2
                    img_y = y + header_h + (cell_h - new_size[1]) // 2
                    sheet_img.paste(resized, (img_x, img_y))
            except Exception as e:
                draw.text((x + 10, y + header_h + 20), f"Error loading image: {e}", fill=(255, 100, 100), font=font)

        out_name = f"sheet_{sheet_idx + 1:02d}.png"
        out_path = os.path.join(SHEETS_DIR, out_name)
        sheet_img.save(out_path, format="PNG")
        print(f"Created contact sheet: {out_path} ({len(batch)} images)")

    print(f"All {total_sheets} contact sheets generated successfully.")

if __name__ == '__main__':
    create_contact_sheets()
