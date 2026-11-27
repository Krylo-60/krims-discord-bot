import argparse
import io
import math
import os
import random
import urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageFont


def load_font(size, bold=False):
    candidates = (
        [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        ]
        if bold
        else [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
    )
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def fetch_avatar(url, size):
    if url and url.startswith("http"):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "KrimsCodeBot/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                img = Image.open(io.BytesIO(resp.read())).convert("RGBA")
                return img.resize((size, size), Image.Resampling.LANCZOS)
        except Exception:
            pass
    img = Image.new("RGBA", (size, size), (18, 26, 52, 255))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, size - 1, size - 1), fill=(37, 99, 235, 255))
    f = load_font(int(size * 0.44), bold=True)
    d.text((size // 2, size // 2), "K", font=f, fill=(255, 255, 255, 255), anchor="mm")
    return img


def make_circle(img, size):
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size * 2, size * 2), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, size * 2 - 1, size * 2 - 1), fill=255)
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def add_glow_ellipse(canvas, bbox, color, blur_radius):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(bbox, fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur_radius))
    return Image.alpha_composite(canvas, layer)


def chamfer_points(x0, y0, x1, y1, cut):
    return [
        (x0 + cut, y0),
        (x1 - cut, y0),
        (x1, y0 + cut),
        (x1, y1 - cut),
        (x1 - cut, y1),
        (x0 + cut, y1),
        (x0, y1 - cut),
        (x0, y0 + cut),
    ]


def draw_hex_mesh(canvas, w, h):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    r = 34
    dx = int(r * 1.5)
    dy = int(r * math.sqrt(3))
    for col in range(-1, w // dx + 2):
        for row in range(-1, h // dy + 2):
            cx = col * dx
            cy = row * dy + (dy // 2 if col % 2 else 0)
            pts = [
                (cx + r * math.cos(math.radians(60 * i)), cy + r * math.sin(math.radians(60 * i)))
                for i in range(6)
            ]
            d.polygon(pts, outline=(0, 242, 255, 16))
    return Image.alpha_composite(canvas, layer)


def draw_gradient_polygon_border(size, pts, c1, c2, width=3):
    w, h = size
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(w):
        t = x / max(1, w - 1)
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        a = int(c1[3] + (c2[3] - c1[3]) * t)
        gd.line([(x, 0), (x, h)], fill=(r, g, b, a))

    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(pts, outline=255, width=width)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def render_aura_card(avatar_url, username, member_count, server_name, out_path):
    W, H = 1200, 440
    canvas = Image.new("RGBA", (W, H), (5, 8, 17, 255))

    # 1. Deep Multi-Layer Plasma Aura
    canvas = add_glow_ellipse(canvas, (-120, -140, 560, 480), (0, 242, 255, 110), 95)
    canvas = add_glow_ellipse(canvas, (640, -60, 1320, 520), (124, 58, 237, 115), 105)
    canvas = add_glow_ellipse(canvas, (300, 120, 900, 520), (37, 99, 235, 70), 90)

    # 2. Hexagonal Tech Mesh + Floating Aura Particles
    canvas = draw_hex_mesh(canvas, W, H)

    rng = random.Random(42)
    particles = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(particles)
    for _ in range(38):
        px = rng.randint(20, W - 20)
        py = rng.randint(20, H - 20)
        pr = rng.choice([1, 2, 2, 3])
        col = rng.choice([(0, 242, 255, 160), (167, 139, 250, 150), (255, 255, 255, 120)])
        pd.ellipse((px - pr, py - pr, px + pr, py + pr), fill=col)
    canvas = Image.alpha_composite(canvas, particles)

    # 3. Chamfered Glassmorphic HUD Frame
    fx0, fy0, fx1, fy1 = 36, 30, W - 36, H - 30
    frame_pts = chamfer_points(fx0, fy0, fx1, fy1, 30)

    glass = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glass)
    gd.polygon(frame_pts, fill=(10, 14, 28, 212))
    # Diagonal glass sheen highlight
    sheen_pts = [(fx0 + 30, fy0), (fx0 + 420, fy0), (fx0 + 220, fy1), (fx0 + 30, fy1), (fx0, fy1 - 30), (fx0, fy0 + 30)]
    gd.polygon(sheen_pts, fill=(255, 255, 255, 9))
    canvas = Image.alpha_composite(canvas, glass)

    # Glowing gradient frame border
    border_img = draw_gradient_polygon_border((W, H), frame_pts, (0, 242, 255, 225), (139, 92, 246, 225), width=3)
    border_glow = border_img.filter(ImageFilter.GaussianBlur(6))
    canvas = Image.alpha_composite(canvas, border_glow)
    canvas = Image.alpha_composite(canvas, border_img)

    # 4. Left Side: Reactor Core + Avatar
    av_cx, av_cy = 230, H // 2
    av_size = 178

    # Dual plasma halo behind avatar
    canvas = add_glow_ellipse(canvas, (av_cx - 138, av_cy - 138, av_cx + 138, av_cy + 138), (0, 242, 255, 125), 34)
    canvas = add_glow_ellipse(canvas, (av_cx - 118, av_cy - 118, av_cx + 118, av_cy + 118), (139, 92, 246, 95), 24)

    draw = ImageDraw.Draw(canvas)
    # Outer rotating-style energy arcs
    r_outer = 118
    arc_box = (av_cx - r_outer, av_cy - r_outer, av_cx + r_outer, av_cy + r_outer)
    draw.arc(arc_box, start=-40, end=80, fill=(0, 242, 255, 255), width=5)
    draw.arc(arc_box, start=105, end=220, fill=(139, 92, 246, 245), width=5)
    draw.arc(arc_box, start=245, end=300, fill=(56, 189, 248, 200), width=3)

    # Calibration tick ring
    r_mid = 104
    for deg in range(0, 360, 12):
        rad = math.radians(deg)
        l_in = r_mid - (5 if deg % 36 == 0 else 2)
        l_out = r_mid + (5 if deg % 36 == 0 else 2)
        col = (0, 242, 255, 220) if deg % 36 == 0 else (148, 163, 184, 130)
        draw.line(
            [
                (av_cx + math.cos(rad) * l_in, av_cy + math.sin(rad) * l_in),
                (av_cx + math.cos(rad) * l_out, av_cy + math.sin(rad) * l_out),
            ],
            fill=col,
            width=2,
        )

    # White crisp ring + Avatar
    r_ring = av_size // 2 + 4
    draw.ellipse((av_cx - r_ring, av_cy - r_ring, av_cx + r_ring, av_cy + r_ring), fill=(255, 255, 255, 255))
    av_raw = fetch_avatar(avatar_url, av_size)
    av_circle = make_circle(av_raw, av_size)
    canvas.alpha_composite(av_circle, (av_cx - av_size // 2, av_cy - av_size // 2))

    # Online green status node on bottom-right of avatar
    draw = ImageDraw.Draw(canvas)
    sx, sy = av_cx + 62, av_cy + 62
    draw.ellipse((sx - 15, sy - 15, sx + 15, sy + 15), fill=(10, 14, 28, 255))
    draw.ellipse((sx - 10, sy - 10, sx + 10, sy + 10), fill=(16, 185, 129, 255))

    # 5. Vertical Energy Spine
    div_x = 394
    draw.line([(div_x, 76), (div_x, H - 76)], fill=(0, 242, 255, 55), width=2)
    draw.rectangle((div_x - 2, 135, div_x + 2, 305), fill=(0, 242, 255, 235))

    # 6. Right Side: Typography & Telemetry
    tx = 438
    f_sys = load_font(15, bold=True)
    f_title = load_font(54, bold=True)
    f_sub = load_font(26, bold=True)
    f_pill = load_font(17, bold=True)
    f_micro = load_font(13, bold=True)

    # Top status bar
    draw.ellipse((tx, 74, tx + 10, 84), fill=(16, 185, 129, 255))
    draw.text((tx + 20, 79), "KRIMS CODE AI  //  NEW MEMBER LINKED", font=f_sys, fill=(0, 242, 255, 230), anchor="lm")

    # Signal bars top-right
    for b in range(5):
        bx = W - 122 + b * 12
        bh = 7 + b * 4
        by = 86 - bh
        col = (0, 242, 255, 230) if b < 4 else (139, 92, 246, 230)
        draw.rectangle((bx, by, bx + 7, 86), fill=col)

    # Neon glow behind username text
    clean_user = (username or "Member")[:18]
    clean_server = (server_name or "Krims Code")[:34]

    txt_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tgd = ImageDraw.Draw(txt_glow)
    tgd.text((tx + 22, 162), f"WELCOME, {clean_user.upper()}", font=f_title, fill=(0, 242, 255, 120), anchor="lm")
    txt_glow = txt_glow.filter(ImageFilter.GaussianBlur(10))
    canvas = Image.alpha_composite(canvas, txt_glow)

    draw = ImageDraw.Draw(canvas)
    # Glowing vertical accent bar next to name
    draw.rectangle((tx, 128, tx + 6, 196), fill=(0, 242, 255, 255))
    draw.text((tx + 22, 162), f"WELCOME, {clean_user.upper()}", font=f_title, fill=(255, 255, 255, 255), anchor="lm")

    # Server name subtitle
    draw.text((tx + 22, 226), f"TO  {clean_server}", font=f_sub, fill=(186, 200, 224, 255), anchor="lm")

    # Bottom Telemetry Pills (alpha-composited)
    pill_y = 284
    p1_text = f"MEMBER #{member_count}"
    p1_w = draw.textbbox((0, 0), p1_text, font=f_pill)[2] + 44
    p1_pts = chamfer_points(tx, pill_y, tx + p1_w, pill_y + 42, 10)

    p2_x = tx + p1_w + 16
    p2_text = "STATUS: VERIFIED"
    p2_w = draw.textbbox((0, 0), p2_text, font=f_pill)[2] + 44
    p2_pts = chamfer_points(p2_x, pill_y, p2_x + p2_w, pill_y + 42, 10)

    pill_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pld = ImageDraw.Draw(pill_layer)
    pld.polygon(p1_pts, fill=(0, 242, 255, 32), outline=(0, 242, 255, 220), width=2)
    pld.polygon(p2_pts, fill=(139, 92, 246, 36), outline=(139, 92, 246, 220), width=2)
    canvas = Image.alpha_composite(canvas, pill_layer)

    draw = ImageDraw.Draw(canvas)
    draw.text((tx + p1_w // 2, pill_y + 21), p1_text, font=f_pill, fill=(0, 242, 255, 255), anchor="mm")
    draw.text((p2_x + p2_w // 2, pill_y + 21), p2_text, font=f_pill, fill=(221, 214, 254, 255), anchor="mm")

    # Bottom-right subtle brand watermark
    draw.text((fx1 - 36, fy1 - 24), "KRIMS-CODE.NET", font=f_micro, fill=(100, 116, 139, 190), anchor="rm")

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    canvas.convert("RGB").save(out_path, "PNG", optimize=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--avatar", default="")
    p.add_argument("--username", default="Krylo")
    p.add_argument("--member_count", default="15")
    p.add_argument("--server_name", default="Krims Code • Support & Updates")
    p.add_argument("--out", required=True)
    args = p.parse_args()
    render_aura_card(args.avatar, args.username, args.member_count, args.server_name, args.out)
