import sys
import os
import io
import argparse
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

def generate_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path, heading=None, subtext=None, theme='ksmp'):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, 'assets')
    images_dir = os.path.join(assets_dir, 'images')
    fonts_dir = os.path.join(assets_dir, 'fonts')

    # Dimensions
    W, H = 1024, 576

    # --- Font loading with fallbacks ---
    def load_font(name, size):
        candidates = [
            os.path.join(fonts_dir, name),
            os.path.join(r'C:\Windows\Fonts', name),
            os.path.join('/usr/share/fonts/truetype', name),
        ]
        for c in candidates:
            if os.path.exists(c):
                try:
                    return ImageFont.truetype(c, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    font_welcome = load_font('bahnschrift.ttf', 40)
    font_user    = load_font('bahnschrift.ttf', 30)
    font_msg     = load_font('segoeuib.ttf', 17)
    font_sub     = load_font('segoeui.ttf', 14)
    font_badge   = load_font('bahnschrift.ttf', 13)
    font_pill    = load_font('bahnschrift.ttf', 13)

    # --- Banner loading ---
    banner_candidates = [
        os.path.join(assets_dir, 'official_banner.jpg'),
        os.path.join(assets_dir, 'official_banner_clean.jpg'),
        os.path.join(assets_dir, 'krylosmp_banner.jpg'),
        os.path.join(images_dir, 'official_banner.jpg'),
        os.path.join(base_dir, '..', 'krylosmp-store-website', 'official_banner.jpg'),
    ]
    banner_img = None
    for bp in banner_candidates:
        if os.path.exists(bp):
            try:
                banner_img = Image.open(bp).convert('RGBA')
                break
            except Exception:
                pass

    is_ksmp = 'krylo' in server_name.lower() or theme == 'ksmp'

    # 1. Base canvas: sky-blue like the KSMP banner
    sky_bg = (120, 207, 226, 255)
    img = Image.new('RGBA', (W, H), sky_bg)

    # Top banner area: height 260
    # In official_banner.jpg (1376x768), the 3D logo is centrally located with padding around.
    # We want to scale and place the banner so the whole 3D logo fits comfortably at the top without clipping.
    if is_ksmp and banner_img:
        bw, bh = banner_img.size
        # The logo is from y=100 to y=660, x=60 to 1316
        # Let's crop tight to the logo with nice margins
        crop_box = (40, 60, bw - 40, bh - 60)
        cropped_banner = banner_img.crop(crop_box)
        cb_w, cb_h = cropped_banner.size
        
        target_logo_h = 240
        scale = target_logo_h / cb_h
        target_logo_w = int(cb_w * scale)
        if target_logo_w > W:
            scale = W / cb_w
            target_logo_w = W
            target_logo_h = int(cb_h * scale)
            
        scaled_banner = cropped_banner.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)
        logo_x = (W - target_logo_w) // 2
        logo_y = 10
        img.paste(scaled_banner, (logo_x, logo_y), scaled_banner)

    # Card Panel at bottom
    # Card bounds:
    card_margin_x = 45
    card_top = 265
    card_bottom = H - 25
    card_left = card_margin_x
    card_right = W - card_margin_x
    card_h = card_bottom - card_top

    # Outer glow / shadow behind the card
    shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle(
        [card_left - 4, card_top - 2, card_right + 4, card_bottom + 6],
        radius=16,
        fill=(0, 40, 70, 160)
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(8))
    img = Image.alpha_composite(img, shadow_layer)

    # Card body
    card_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card_layer)
    # Dark navy background
    cd.rounded_rectangle(
        [card_left, card_top, card_right, card_bottom],
        radius=14,
        fill=(14, 25, 42, 250),
        outline=(0, 220, 240, 220),
        width=2
    )
    img = Image.alpha_composite(img, card_layer)

    draw = ImageDraw.Draw(img)

    # Corner brackets (sci-fi / KSMP tech accents)
    cL, cC = 20, (0, 242, 255, 255)
    corners = [
        (card_left, card_top),
        (card_right, card_top),
        (card_left, card_bottom),
        (card_right, card_bottom),
    ]
    for i, (cx, cy) in enumerate(corners):
        dx = 1 if i % 2 == 0 else -1
        dy = 1 if i < 2 else -1
        draw.line([(cx, cy), (cx + dx * cL, cy)], fill=cC, width=3)
        draw.line([(cx, cy), (cx, cy + dy * cL)], fill=cC, width=3)

    # --- Avatar / Head loading ---
    av_size = 130
    av_x = card_left + 30
    av_cy = card_top + card_h // 2
    av_y = av_cy - av_size // 2

    # In Phase 2, if mc_head is provided, use mc_head as the main avatar or fallback to avatar_input
    primary_image_input = mc_head_input if (phase == '2' or phase == 2) and mc_head_input else avatar_input
    av_img = None

    if primary_image_input and (primary_image_input.startswith('http://') or primary_image_input.startswith('https://')):
        try:
            req = urllib.request.Request(primary_image_input, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                av_img = Image.open(io.BytesIO(resp.read())).convert('RGBA').resize((av_size, av_size), Image.Resampling.LANCZOS)
        except Exception:
            av_img = None
    elif primary_image_input and os.path.exists(primary_image_input):
        try:
            av_img = Image.open(primary_image_input).convert('RGBA').resize((av_size, av_size), Image.Resampling.LANCZOS)
        except Exception:
            pass

    # Fallback to avatar if mc_head failed
    if not av_img and avatar_input and avatar_input != primary_image_input:
        if avatar_input.startswith('http://') or avatar_input.startswith('https://'):
            try:
                req = urllib.request.Request(avatar_input, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    av_img = Image.open(io.BytesIO(resp.read())).convert('RGBA').resize((av_size, av_size), Image.Resampling.LANCZOS)
            except Exception:
                pass
        elif os.path.exists(avatar_input):
            try:
                av_img = Image.open(avatar_input).convert('RGBA').resize((av_size, av_size), Image.Resampling.LANCZOS)
            except Exception:
                pass

    if not av_img:
        # Default avatar circle
        av_img = Image.new('RGBA', (av_size, av_size), (24, 38, 58, 255))
        avd = ImageDraw.Draw(av_img)
        cx, cy = av_size // 2, av_size // 2
        hr = av_size // 5
        avd.ellipse([cx - hr, cy - hr - 14, cx + hr, cy + hr - 14], fill=(0, 210, 245, 255))
        br = hr + 20
        avd.ellipse([cx - br, cy + hr - 6, cx + br, cy + hr + br * 2 - 6], fill=(0, 180, 220, 255))

    # Mask to circle
    mask = Image.new('L', (av_size, av_size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, av_size, av_size], fill=255)

    is_phase_1 = str(phase) == '1'

    # Glowing ring around avatar
    ring_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring_layer)
    ring_pad = 6
    if is_phase_1:
        # Amber/cyan glow for unverified
        rd.ellipse(
            [av_x - ring_pad, av_y - ring_pad, av_x + av_size + ring_pad, av_y + av_size + ring_pad],
            outline=(245, 185, 35, 220),
            width=3
        )
    else:
        # Full electric cyan and gold glow for verified
        rd.ellipse(
            [av_x - ring_pad, av_y - ring_pad, av_x + av_size + ring_pad, av_y + av_size + ring_pad],
            outline=(0, 242, 255, 240),
            width=3
        )
        rd.ellipse(
            [av_x - ring_pad - 2, av_y - ring_pad - 2, av_x + av_size + ring_pad + 2, av_y + av_size + ring_pad + 2],
            outline=(245, 195, 45, 180),
            width=1
        )
    ring_layer = ring_layer.filter(ImageFilter.GaussianBlur(1))
    img = Image.alpha_composite(img, ring_layer)

    img.paste(av_img, (av_x, av_y), mask)
    draw = ImageDraw.Draw(img)

    # --- Information layout on card ---
    text_x = av_x + av_size + 28

    # 1. Badge: VERIFIED SURVIVOR vs UNVERIFIED SURVIVOR
    if is_phase_1:
        badge_txt = "UNVERIFIED SURVIVOR" if is_ksmp else "NEW MEMBER"
        bb = draw.textbbox((0, 0), badge_txt, font=font_badge)
        bw_px = bb[2] - bb[0]
        badge_y = card_top + 22
        draw.rounded_rectangle(
            [text_x, badge_y, text_x + bw_px + 28, badge_y + 24],
            radius=6,
            fill=(245, 185, 35, 30),
            outline=(245, 185, 35, 180),
            width=1
        )
        draw.text((text_x + 14, badge_y + 4), badge_txt, font=font_badge, fill=(245, 205, 75, 255))
    else:
        badge_txt = "VERIFIED SURVIVOR" if is_ksmp else "VERIFIED MEMBER"
        bb = draw.textbbox((0, 0), badge_txt, font=font_badge)
        bw_px = bb[2] - bb[0]
        badge_y = card_top + 22
        draw.rounded_rectangle(
            [text_x, badge_y, text_x + bw_px + 28, badge_y + 24],
            radius=6,
            fill=(0, 180, 220, 35),
            outline=(0, 220, 240, 180),
            width=1
        )
        draw.text((text_x + 14, badge_y + 4), badge_txt, font=font_badge, fill=(0, 242, 255, 255))

    # 2. WELCOME!
    w_title = heading or "WELCOME!"
    welcome_y = badge_y + 32
    draw.text((text_x, welcome_y), w_title, font=font_welcome, fill=(255, 255, 255, 255))

    # 3. @Username (in golden KSMP yellow)
    display_user = f"@{username}" if not username.startswith('@') else username
    user_y = welcome_y + 46
    draw.text((text_x, user_y), display_user, font=font_user, fill=(250, 198, 48, 255))

    # 4. Message
    msg_y = user_y + 40
    msg_line1 = f"Welcome to {server_name}! We are glad to have you here!"
    draw.text((text_x, msg_y), msg_line1, font=font_msg, fill=(220, 238, 255, 255))

    sub_y = msg_y + 24
    if subtext:
        sub_line = subtext
    elif is_phase_1:
        sub_line = "Drop your Minecraft IGN in #verify to link your account & get verified!"
    else:
        sub_line = "Explore custom dungeons, forge elite armor & conquer the realm."
    draw.text((text_x, sub_y), sub_line, font=font_sub, fill=(140, 180, 215, 220))

    # 5. Bottom feature pill
    pill_y = sub_y + 32
    if is_ksmp:
        # Pill: SEASON 1: SURVIVAL SMP
        p1 = "SEASON 1: SURVIVAL SMP"
        pb1 = draw.textbbox((0, 0), p1, font=font_pill)
        pw1 = pb1[2] - pb1[0]
        p1_r = text_x + pw1 + 28
        draw.rounded_rectangle(
            [text_x, pill_y, p1_r, pill_y + 26],
            radius=6,
            fill=(18, 30, 48, 230),
            outline=(245, 185, 35, 160),
            width=1
        )
        draw.text((text_x + 14, pill_y + 5), p1, font=font_pill, fill=(245, 205, 75, 255))

    # Save output
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    img.convert('RGB').save(out_path, quality=95)
    print(f"Successfully generated welcome card at {out_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--avatar', default='')
    parser.add_argument('--mc_head', default='')
    parser.add_argument('--username', default='Player')
    parser.add_argument('--member_count', default='1')
    parser.add_argument('--server_name', default='KryloSMP')
    parser.add_argument('--phase', default='1')
    parser.add_argument('--theme', default='ksmp')
    parser.add_argument('--heading', default=None)
    parser.add_argument('--subtext', default=None)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()

    generate_card(
        avatar_input=args.avatar,
        mc_head_input=args.mc_head,
        username=args.username,
        member_count=args.member_count,
        server_name=args.server_name,
        phase=args.phase,
        out_path=args.out,
        heading=args.heading,
        subtext=args.subtext,
        theme=args.theme
    )
