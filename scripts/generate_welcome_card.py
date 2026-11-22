import sys
import os
import io
import argparse
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets_dir = os.path.join(base_dir, 'assets')
images_dir = os.path.join(assets_dir, 'images')
fonts_dir = os.path.join(assets_dir, 'fonts')

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

def fetch_image(url_or_path, size=None):
    if not url_or_path:
        return None
    try:
        if url_or_path.startswith('http://') or url_or_path.startswith('https://'):
            req = urllib.request.Request(url_or_path, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                im = Image.open(io.BytesIO(resp.read())).convert('RGBA')
        elif os.path.exists(url_or_path):
            im = Image.open(url_or_path).convert('RGBA')
        else:
            return None
        if size:
            im = im.resize(size, Image.Resampling.LANCZOS)
        return im
    except Exception as e:
        return None


# ==============================================================================
#  1. KRYLOSMP WELCOME CARD GENERATOR
# ==============================================================================
def render_ksmp_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path, heading, subtext):
    W, H = 1024, 576

    font_welcome = load_font('bahnschrift.ttf', 40)
    font_user    = load_font('bahnschrift.ttf', 30)
    font_msg     = load_font('segoeuib.ttf', 17)
    font_sub     = load_font('segoeui.ttf', 14)
    font_badge   = load_font('bahnschrift.ttf', 13)
    font_pill    = load_font('bahnschrift.ttf', 13)

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

    sky_bg = (120, 207, 226, 255)
    img = Image.new('RGBA', (W, H), sky_bg)

    if banner_img:
        bw, bh = banner_img.size
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

    card_margin_x = 45
    card_top = 265
    card_bottom = H - 25
    card_left = card_margin_x
    card_right = W - card_margin_x
    card_h = card_bottom - card_top

    # Shadow
    shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle([card_left - 4, card_top - 2, card_right + 4, card_bottom + 6], radius=16, fill=(0, 40, 70, 160))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(8))
    img = Image.alpha_composite(img, shadow_layer)

    # Card body
    card_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card_layer)
    cd.rounded_rectangle([card_left, card_top, card_right, card_bottom], radius=14, fill=(14, 25, 42, 250), outline=(0, 220, 240, 220), width=2)
    img = Image.alpha_composite(img, card_layer)

    draw = ImageDraw.Draw(img)

    # Corner brackets
    cL, cC = 20, (0, 242, 255, 255)
    corners = [(card_left, card_top), (card_right, card_top), (card_left, card_bottom), (card_right, card_bottom)]
    for i, (cx, cy) in enumerate(corners):
        dx = 1 if i % 2 == 0 else -1
        dy = 1 if i < 2 else -1
        draw.line([(cx, cy), (cx + dx * cL, cy)], fill=cC, width=3)
        draw.line([(cx, cy), (cx, cy + dy * cL)], fill=cC, width=3)

    # Avatar
    av_size = 130
    av_x = card_left + 30
    av_cy = card_top + card_h // 2
    av_y = av_cy - av_size // 2

    primary_image_input = mc_head_input if (str(phase) == '2') and mc_head_input else avatar_input
    av_img = fetch_image(primary_image_input, (av_size, av_size))
    if not av_img and avatar_input and avatar_input != primary_image_input:
        av_img = fetch_image(avatar_input, (av_size, av_size))

    if not av_img:
        av_img = Image.new('RGBA', (av_size, av_size), (24, 38, 58, 255))
        avd = ImageDraw.Draw(av_img)
        cx, cy = av_size // 2, av_size // 2
        hr = av_size // 5
        avd.ellipse([cx - hr, cy - hr - 14, cx + hr, cy + hr - 14], fill=(0, 210, 245, 255))
        br = hr + 20
        avd.ellipse([cx - br, cy + hr - 6, cx + br, cy + hr + br * 2 - 6], fill=(0, 180, 220, 255))

    mask = Image.new('L', (av_size, av_size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, av_size, av_size], fill=255)

    is_phase_1 = str(phase) == '1'
    ring_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring_layer)
    ring_pad = 6
    if is_phase_1:
        rd.ellipse([av_x - ring_pad, av_y - ring_pad, av_x + av_size + ring_pad, av_y + av_size + ring_pad], outline=(245, 185, 35, 220), width=3)
    else:
        rd.ellipse([av_x - ring_pad, av_y - ring_pad, av_x + av_size + ring_pad, av_y + av_size + ring_pad], outline=(0, 242, 255, 240), width=3)
        rd.ellipse([av_x - ring_pad - 2, av_y - ring_pad - 2, av_x + av_size + ring_pad + 2, av_y + av_size + ring_pad + 2], outline=(245, 195, 45, 180), width=1)
    ring_layer = ring_layer.filter(ImageFilter.GaussianBlur(1))
    img = Image.alpha_composite(img, ring_layer)

    img.paste(av_img, (av_x, av_y), mask)
    draw = ImageDraw.Draw(img)

    text_x = av_x + av_size + 28

    badge_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge_layer)

    if is_phase_1:
        badge_txt = "UNVERIFIED SURVIVOR"
        bb = bd.textbbox((0, 0), badge_txt, font=font_badge)
        bw_px = bb[2] - bb[0]
        badge_y = card_top + 20
        bd.rounded_rectangle([text_x, badge_y, text_x + bw_px + 28, badge_y + 26], radius=6, fill=(35, 26, 16, 230), outline=(245, 185, 35, 220), width=1)
        img = Image.alpha_composite(img, badge_layer)
        draw = ImageDraw.Draw(img)
        draw.text((text_x + 14, badge_y + 5), badge_txt, font=font_badge, fill=(255, 215, 80, 255))
    else:
        badge_txt = "VERIFIED SURVIVOR"
        bb = bd.textbbox((0, 0), badge_txt, font=font_badge)
        bw_px = bb[2] - bb[0]
        badge_y = card_top + 20
        bd.rounded_rectangle([text_x, badge_y, text_x + bw_px + 28, badge_y + 26], radius=6, fill=(16, 32, 48, 230), outline=(0, 220, 240, 220), width=1)
        img = Image.alpha_composite(img, badge_layer)
        draw = ImageDraw.Draw(img)
        draw.text((text_x + 14, badge_y + 5), badge_txt, font=font_badge, fill=(0, 242, 255, 255))

    w_title = heading or "WELCOME!"
    welcome_y = badge_y + 34
    draw.text((text_x, welcome_y), w_title, font=font_welcome, fill=(255, 255, 255, 255))

    display_user = f"@{username}" if not username.startswith('@') else username
    user_y = welcome_y + 46
    draw.text((text_x, user_y), display_user, font=font_user, fill=(250, 198, 48, 255))

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

    pill_y = sub_y + 32
    p1 = "SEASON 1: SURVIVAL SMP"
    pb1 = draw.textbbox((0, 0), p1, font=font_pill)
    pw1 = pb1[2] - pb1[0]
    p1_r = text_x + pw1 + 28
    
    bot_pill_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bpd = ImageDraw.Draw(bot_pill_layer)
    bpd.rounded_rectangle([text_x, pill_y, p1_r, pill_y + 26], radius=6, fill=(18, 30, 48, 230), outline=(245, 185, 35, 180), width=1)
    img = Image.alpha_composite(img, bot_pill_layer)
    draw = ImageDraw.Draw(img)
    draw.text((text_x + 14, pill_y + 5), p1, font=font_pill, fill=(245, 205, 75, 255))

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    img.convert('RGB').save(out_path, quality=95)
    print(f"[WelcomeCard] Successfully generated KryloSMP card at {out_path}")


# ==============================================================================
#  2. THE LIGHT BEARERS (TLB) WELCOME CARD GENERATOR
# ==============================================================================
def render_tlb_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path, heading, subtext):
    W, H = 1100, 480

    tag_font     = load_font('bahnschrift.ttf', 14)
    welcome_font = load_font('bahnschrift.ttf', 26)
    name_font    = load_font('bahnschrift.ttf', 44)
    badge_font   = load_font('bahnschrift.ttf', 15)
    footer_font  = load_font('bahnschrift.ttf', 13)

    tcfg = {
        'accent': (255, 215, 0, 255),       # Gold
        'accent2': (0, 242, 255, 255),      # Cyan
        'glow': (255, 215, 0, 160),
        'grid_col': (255, 215, 0, 15),
        'pill_bg': (24, 30, 48, 220),
    }

    banner_candidates = [
        os.path.join(assets_dir, 'the_light_bearers_banner.jpg'),
        os.path.join(images_dir, 'the_light_bearers_banner.jpg'),
    ]
    banner_path = next((p for p in banner_candidates if os.path.exists(p)), None)

    clan_logo_candidates = [
        os.path.join(assets_dir, 'light_bearers_clan_emblem.jpg'),
        os.path.join(images_dir, 'light_bearers_clan_emblem.jpg'),
        os.path.join(images_dir, 'light_bearers_emblem.jpg'),
    ]
    clan_logo_path = next((p for p in clan_logo_candidates if os.path.exists(p)), None)

    if banner_path and os.path.exists(banner_path):
        b_raw = Image.open(banner_path).convert('RGBA')
        bw, bh = b_raw.size
        target_ratio = W / H
        cur_ratio = bw / bh
        if cur_ratio > target_ratio:
            new_w = int(bh * target_ratio)
            left = (bw - new_w) // 2
            b_crop = b_raw.crop((left, 0, left + new_w, bh))
        else:
            new_h = int(bw / target_ratio)
            top = (bh - new_h) // 2
            b_crop = b_raw.crop((0, top, bw, top + new_h))
        
        banner_base = b_crop.resize((W, H), Image.Resampling.LANCZOS)
        banner_base = ImageEnhance.Brightness(banner_base).enhance(0.40)
        banner_base = ImageEnhance.Contrast(banner_base).enhance(1.15)
        
        shade = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shade)
        for x in range(W):
            ratio = x / W
            alpha = int(205 - ratio * 85)
            s_draw.line([(x, 0), (x, H)], fill=(8, 12, 22, max(0, min(255, alpha))))
        img = Image.alpha_composite(banner_base, shade)
    else:
        img = Image.new('RGBA', (W, H), (10, 14, 23, 255))
        draw_bg = ImageDraw.Draw(img)
        for y in range(H):
            ratio = y / H
            r = int(12 + ratio * 8)
            g = int(18 + ratio * 10)
            b = int(32 + ratio * 12)
            draw_bg.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Cyber Grid
    grid_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grid_overlay)
    for x in range(0, W, 40): g_draw.line([(x, 0), (x, H)], fill=tcfg['grid_col'], width=1)
    for y in range(0, H, 40): g_draw.line([(0, y), (W, y)], fill=tcfg['grid_col'], width=1)

    # Watermarked Clan Emblem on Right
    if clan_logo_path and os.path.exists(clan_logo_path):
        shield = Image.open(clan_logo_path).convert('RGBA').resize((360, 360), Image.Resampling.LANCZOS)
        c_mask = Image.new('L', (360, 360), 0)
        ImageDraw.Draw(c_mask).ellipse([12, 12, 348, 348], fill=255)
        c_mask = c_mask.filter(ImageFilter.GaussianBlur(15))
        alpha = c_mask.point(lambda p: int(p * 0.40))
        shield.putalpha(alpha)
        img.paste(shield, (W - 390, (H - 360) // 2), shield)

    img = Image.alpha_composite(img, grid_overlay)

    # Dual Glowing Border
    border_glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(border_glow)
    bg_draw.rectangle([8, 8, W - 9, H - 9], outline=tcfg['glow'], width=3)
    bg_draw.rectangle([11, 11, W - 12, H - 12], outline=tcfg['accent2'], width=2)
    img = Image.alpha_composite(img, border_glow.filter(ImageFilter.GaussianBlur(4)))
    draw = ImageDraw.Draw(img)
    draw.rectangle([11, 11, W - 12, H - 12], outline=tcfg['accent'], width=2)

    # Corner L-brackets
    cL, cC = 35, tcfg['accent']
    draw.line([(6, 6), (6 + cL, 6)], fill=cC, width=4)
    draw.line([(6, 6), (6, 6 + cL)], fill=cC, width=4)
    draw.line([(W - 7, 6), (W - 7 - cL, 6)], fill=cC, width=4)
    draw.line([(W - 7, 6), (W - 7, 6 + cL)], fill=cC, width=4)
    draw.line([(6, H - 7), (6 + cL, H - 7)], fill=cC, width=4)
    draw.line([(6, H - 7), (6, H - 7 - cL)], fill=cC, width=4)
    draw.line([(W - 7, H - 7), (W - 7 - cL, H - 7)], fill=cC, width=4)
    draw.line([(W - 7, H - 7), (W - 7, H - 7 - cL)], fill=cC, width=4)

    # Avatar
    av_size, a_cx, a_cy = 190, 160, H // 2
    av = fetch_image(avatar_input, (av_size, av_size))
    if not av:
        av = Image.new('RGBA', (av_size, av_size), (40, 50, 70, 255))

    mask = Image.new('L', (av_size, av_size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, av_size, av_size], fill=255)

    halo = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(halo)
    h_draw.ellipse([a_cx - av_size//2 - 12, a_cy - av_size//2 - 12, a_cx + av_size//2 + 12, a_cy + av_size//2 + 12], outline=tcfg['glow'], width=6)
    h_draw.ellipse([a_cx - av_size//2 - 6, a_cy - av_size//2 - 6, a_cx + av_size//2 + 6, a_cy + av_size//2 + 6], outline=tcfg['accent2'], width=3)
    img = Image.alpha_composite(img, halo.filter(ImageFilter.GaussianBlur(6)))
    img = Image.alpha_composite(img, halo)
    img.paste(av, (a_cx - av_size//2, a_cy - av_size//2), mask)

    # Phase 2 MC Head badge on corner if present
    is_phase_2 = str(phase) == '2'
    if is_phase_2 and mc_head_input:
        mc_head = fetch_image(mc_head_input, (75, 75))
        if mc_head:
            head_mask = Image.new('L', (75, 75), 0)
            ImageDraw.Draw(head_mask).rounded_rectangle([0, 0, 75, 75], radius=14, fill=255)
            img.paste(mc_head, (a_cx + 40, a_cy + 25), head_mask)
            draw_mc = ImageDraw.Draw(img)
            draw_mc.rounded_rectangle([a_cx + 40, a_cy + 25, a_cx + 115, a_cy + 100], radius=14, outline=tcfg['accent2'], width=3)

    draw = ImageDraw.Draw(img)
    draw.ellipse([a_cx - av_size//2, a_cy - av_size//2, a_cx + av_size//2, a_cy + av_size//2], outline=(255, 255, 255, 220), width=2)

    # Status Pip
    status_col = (35, 165, 90, 255)
    draw.ellipse([a_cx + 60, a_cy + 60, a_cx + 90, a_cy + 90], fill=status_col, outline=(10, 14, 23, 255), width=4)

    tX = 310
    num_str = str(member_count).zfill(3)

    if not is_phase_2:
        draw.text((tX, 80), '[+] SYSTEM ENTRY // NEW OPERATIVE DETECTED', fill=tcfg['accent2'], font=tag_font)
        draw.text((tX, 115), heading or 'WELCOME TO THE LIGHT BEARERS', fill=(220, 230, 242, 255), font=welcome_font)
        draw.text((tX, 150), f'@{username}' if not username.startswith('@') else username, fill=tcfg['accent'], font=name_font)
        draw.line([(tX, 225), (W - 90, 225)], fill=tcfg['accent2'], width=2)

        draw.rectangle([tX, 245, tX + 180, 288], fill=tcfg['pill_bg'], outline=tcfg['accent2'], width=2)
        draw.text((tX + 90, 266), f'MEMBER #{num_str}', fill=tcfg['accent2'], font=badge_font, anchor='mm')

        draw.rectangle([tX + 195, 245, tX + 490, 288], fill=(35, 25, 15, 220), outline=(245, 158, 11, 220), width=2)
        draw.text((tX + 342, 266), 'PENDING MINECRAFT IGN', fill=(245, 158, 11, 255), font=badge_font, anchor='mm')

        draw.rectangle([tX, 340, W - 90, 385], fill=(8, 16, 28, 230), outline=tcfg['accent2'], width=1)
        draw.text((tX + 20, 362), 'CO-LEADER: KryloMCYT  •  LEADER: Jonesy  •  DROP IGN IN #ROSTER', fill=(160, 185, 210, 255), font=footer_font, anchor='lm')
    else:
        draw.text((tX, 80), '[+] ROSTER CONFIRMED // OPERATIVE VERIFIED', fill=tcfg['accent2'], font=tag_font)
        draw.text((tX, 115), 'THE LIGHT BEARERS • CLAN OPERATIVE', fill=(220, 230, 242, 255), font=welcome_font)
        draw.text((tX, 150), username, fill=tcfg['accent2'], font=name_font)
        draw.line([(tX, 225), (W - 90, 225)], fill=tcfg['accent2'], width=2)

        draw.rectangle([tX, 245, tX + 180, 288], fill=tcfg['pill_bg'], outline=tcfg['accent2'], width=2)
        draw.text((tX + 90, 266), f'MEMBER #{num_str}', fill=tcfg['accent2'], font=badge_font, anchor='mm')

        draw.rectangle([tX + 195, 245, tX + 465, 288], fill=(15, 40, 30, 220), outline=tcfg['accent2'], width=2)
        draw.text((tX + 330, 266), 'VERIFIED SMP ROSTER', fill=tcfg['accent2'], font=badge_font, anchor='mm')

        draw.rectangle([tX, 340, W - 90, 385], fill=(8, 16, 28, 230), outline=tcfg['accent2'], width=1)
        draw.text((tX + 20, 362), 'CO-LEADER: KryloMCYT  •  LEADER: Jonesy  •  BASE COMMS: UNLOCKED', fill=(160, 185, 210, 255), font=footer_font, anchor='lm')

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    img.convert('RGB').save(out_path, quality=95)
    print(f"[WelcomeCard] Successfully generated The Light Bearers card at {out_path}")


# ==============================================================================
#  DISPATCHER
# ==============================================================================
def generate_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path, heading=None, subtext=None, theme='ksmp'):
    # Detect server type
    srv_lower = (server_name or '').lower()
    theme_lower = (theme or '').lower()

    is_tlb = ('light bearer' in srv_lower or 'tlb' in srv_lower or 'half life' in srv_lower or theme_lower in ['tlb', 'light-bearer', 'lightbearer'])
    is_ksmp = ('krylo' in srv_lower or theme_lower == 'ksmp')

    if is_tlb and not is_ksmp:
        render_tlb_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path, heading, subtext)
    else:
        render_ksmp_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path, heading, subtext)


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
