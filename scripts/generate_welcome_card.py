import sys
import os
import argparse
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

THEMES = {
    'cyber-cyan': {
        'accent': (0, 242, 255, 255),
        'accent2': (0, 255, 136, 255),
        'glow': (0, 242, 255, 140),
        'bg_top': (9, 14, 24, 255),
        'bg_bottom': (3, 6, 12, 255),
        'pill_bg': (10, 25, 40, 220),
        'grid_col': (0, 242, 255, 12)
    },
    'ksmp-space': {
        'accent': (192, 132, 252, 255),
        'accent2': (139, 92, 246, 255),
        'glow': (139, 92, 246, 150),
        'bg_top': (19, 10, 36, 255),
        'bg_bottom': (6, 2, 12, 255),
        'pill_bg': (28, 15, 50, 220),
        'grid_col': (192, 132, 252, 14)
    },
    'matrix-green': {
        'accent': (52, 211, 153, 255),
        'accent2': (16, 185, 129, 255),
        'glow': (16, 185, 129, 150),
        'bg_top': (5, 24, 16, 255),
        'bg_bottom': (2, 9, 5, 255),
        'pill_bg': (10, 35, 22, 220),
        'grid_col': (52, 211, 153, 14)
    },
    'crimson-red': {
        'accent': (248, 113, 113, 255),
        'accent2': (239, 68, 68, 255),
        'glow': (239, 68, 68, 150),
        'bg_top': (32, 8, 8, 255),
        'bg_bottom': (9, 2, 2, 255),
        'pill_bg': (45, 12, 12, 220),
        'grid_col': (248, 113, 113, 14)
    },
    'obsidian-dark': {
        'accent': (251, 191, 36, 255),
        'accent2': (245, 158, 11, 255),
        'glow': (245, 158, 11, 140),
        'bg_top': (20, 20, 22, 255),
        'bg_bottom': (8, 8, 9, 255),
        'pill_bg': (35, 30, 20, 220),
        'grid_col': (251, 191, 36, 12)
    }
}

def generate_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path, heading=None, subtext=None, theme='cyber-cyan'):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fonts_dir = os.path.join(base_dir, 'assets', 'fonts')
    images_dir = os.path.join(base_dir, 'assets', 'images')
    tlb_logo_path = os.path.join(images_dir, 'light_bearers_emblem.jpg')
    clan_logo_path = tlb_logo_path if os.path.exists(tlb_logo_path) else os.path.join(images_dir, 'clan_shield.jpg')

    # Selected theme configuration
    tcfg = THEMES.get(theme, THEMES['cyber-cyan'])

    # Font lookups with robust fallbacks
    font_bahn = os.path.join(fonts_dir, 'bahnschrift.ttf')
    font_bold = os.path.join(fonts_dir, 'segoeuib.ttf')
    if not os.path.exists(font_bahn):
        font_bahn = r'C:\Windows\Fonts\bahnschrift.ttf'
    if not os.path.exists(font_bold):
        font_bold = r'C:\Windows\Fonts\segoeuib.ttf'

    try:
        tag_font = ImageFont.truetype(font_bahn, 15)
        welcome_font = ImageFont.truetype(font_bahn, 22)
        name_font = ImageFont.truetype(font_bold, 44)
        badge_font = ImageFont.truetype(font_bold, 16)
        footer_font = ImageFont.truetype(font_bahn, 14)
    except Exception:
        tag_font = welcome_font = name_font = badge_font = footer_font = ImageFont.load_default()

    # Download or load Avatar
    temp_avatar = os.path.join(base_dir, 'data', 'temp_avatar_' + str(os.getpid()) + '.png')
    os.makedirs(os.path.dirname(temp_avatar), exist_ok=True)
    if avatar_input.startswith('http://') or avatar_input.startswith('https://'):
        try:
            req = urllib.request.Request(avatar_input, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp, open(temp_avatar, 'wb') as f:
                f.write(resp.read())
            avatar_path = temp_avatar
        except Exception as e:
            print('[Avatar DL error]:', e, file=sys.stderr)
            avatar_path = None
    else:
        avatar_path = avatar_input if os.path.exists(avatar_input) else None

    # Download or load MC Head
    temp_mc_head = os.path.join(base_dir, 'data', 'temp_mc_head_' + str(os.getpid()) + '.png')
    mc_head_path = None
    if mc_head_input:
        if mc_head_input.startswith('http://') or mc_head_input.startswith('https://'):
            try:
                req = urllib.request.Request(mc_head_input, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as resp, open(temp_mc_head, 'wb') as f:
                    f.write(resp.read())
                mc_head_path = temp_mc_head
            except Exception as e:
                print('[MC Head DL error]:', e, file=sys.stderr)
        elif os.path.exists(mc_head_input):
            mc_head_path = mc_head_input

    W, H = 1100, 480
    banner_path = os.path.join(base_dir, 'assets', 'the_light_bearers_banner.jpg')
    if not os.path.exists(banner_path):
        banner_path = os.path.join(images_dir, 'the_light_bearers_banner.jpg')

    is_light_bearer = 'light bearer' in server_name.lower() or 'half life' in server_name.lower()

    if is_light_bearer and os.path.exists(banner_path):
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
        # High-tech procedural obsidian gradient
        img = Image.new('RGBA', (W, H), (10, 14, 23, 255))
        draw_bg = ImageDraw.Draw(img)
        r1, g1, b1, _ = tcfg['bg_top']
        r2, g2, b2, _ = tcfg['bg_bottom']
        for y in range(H):
            ratio = y / H
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            draw_bg.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Cyber Grid
    grid_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grid_overlay)
    for x in range(0, W, 40): g_draw.line([(x, 0), (x, H)], fill=tcfg['grid_col'], width=1)
    for y in range(0, H, 40): g_draw.line([(0, y), (W, y)], fill=tcfg['grid_col'], width=1)

    # Watermarked Reticle / Emblem on Right
    if is_light_bearer and os.path.exists(clan_logo_path):
        shield = Image.open(clan_logo_path).convert('RGBA').resize((360, 360), Image.Resampling.LANCZOS)
        c_mask = Image.new('L', (360, 360), 0)
        ImageDraw.Draw(c_mask).ellipse([12, 12, 348, 348], fill=255)
        c_mask = c_mask.filter(ImageFilter.GaussianBlur(15))
        alpha = c_mask.point(lambda p: int(p * 0.40))
        shield.putalpha(alpha)
        img.paste(shield, (W - 390, (H - 360) // 2), shield)
    else:
        # Draw cyber reticle crosshairs watermark
        reticle = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        r_draw = ImageDraw.Draw(reticle)
        rcx, rcy = W - 220, H // 2
        r_draw.ellipse([rcx - 140, rcy - 140, rcx + 140, rcy + 140], outline=tcfg['grid_col'], width=2)
        r_draw.ellipse([rcx - 100, rcy - 100, rcx + 100, rcy + 100], outline=tcfg['grid_col'], width=1)
        r_draw.ellipse([rcx - 60, rcy - 60, rcx + 60, rcy + 60], outline=tcfg['grid_col'], width=2)
        r_draw.line([(rcx - 170, rcy), (rcx + 170, rcy)], fill=tcfg['grid_col'], width=1)
        r_draw.line([(rcx, rcy - 170), (rcx, rcy + 170)], fill=tcfg['grid_col'], width=1)
        img = Image.alpha_composite(img, reticle)

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

    # Avatar with Glowing Halo Ring
    av_size, a_cx, a_cy = 190, 160, H // 2
    if avatar_path and os.path.exists(avatar_path):
        av = Image.open(avatar_path).convert('RGBA').resize((av_size, av_size), Image.Resampling.LANCZOS)
    else:
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

    # Minecraft Head badge on corner if present
    if phase == 2 and mc_head_path and os.path.exists(mc_head_path):
        mc_head = Image.open(mc_head_path).convert('RGBA').resize((75, 75), Image.Resampling.LANCZOS)
        head_mask = Image.new('L', (75, 75), 0)
        ImageDraw.Draw(head_mask).rounded_rectangle([0, 0, 75, 75], radius=14, fill=255)
        img.paste(mc_head, (a_cx + 40, a_cy + 25), head_mask)
        draw_mc = ImageDraw.Draw(img)
        draw_mc.rounded_rectangle([a_cx + 40, a_cy + 25, a_cx + 115, a_cy + 100], radius=14, outline=tcfg['accent2'], width=3)

    draw = ImageDraw.Draw(img)
    draw.ellipse([a_cx - av_size//2, a_cy - av_size//2, a_cx + av_size//2, a_cy + av_size//2], outline=(255, 255, 255, 220), width=2)

    # Discord Online Green Status Pip
    status_col = (35, 165, 90, 255)
    draw.ellipse([a_cx + 60, a_cy + 60, a_cx + 90, a_cy + 90], fill=status_col, outline=(10, 14, 23, 255), width=4)

    # Typography & Information Display
    tX = 310
    num_str = str(member_count).zfill(3)

    primary_title = heading if heading else f'WELCOME TO {server_name.upper()}'
    primary_sub = subtext if subtext else f'MEMBER #{num_str}'
    if '{count}' in primary_sub:
        primary_sub = primary_sub.replace('{count}', str(member_count))

    if is_light_bearer:
        if phase == 1:
            draw.text((tX, 80), '[+] SYSTEM ENTRY // NEW OPERATIVE DETECTED', fill=tcfg['accent2'], font=tag_font)
            draw.text((tX, 115), primary_title, fill=(220, 230, 242, 255), font=welcome_font)
            draw.text((tX, 150), username, fill=tcfg['accent'], font=name_font)
            draw.line([(tX, 225), (W - 90, 225)], fill=tcfg['accent2'], width=2)

            draw.rectangle([tX, 245, tX + 180, 288], fill=tcfg['pill_bg'], outline=tcfg['accent2'], width=2)
            draw.text((tX + 90, 266), f'MEMBER #{num_str}', fill=tcfg['accent2'], font=badge_font, anchor='mm')

            draw.rectangle([tX + 195, 245, tX + 490, 288], fill=(35, 25, 15, 220), outline=(245, 158, 11, 220), width=2)
            draw.text((tX + 342, 266), 'PENDING MINECRAFT IGN', fill=(245, 158, 11, 255), font=badge_font, anchor='mm')

            draw.rectangle([tX, 340, W - 90, 385], fill=(8, 16, 28, 230), outline=tcfg['accent2'], width=1)
            draw.text((tX + 20, 362), 'CO-LEADER: KryloMCYT  •  LEADER: Jonesy  •  DROP IGN IN #ROSTER', fill=(160, 185, 210, 255), font=footer_font, anchor='lm')
        else:
            draw.text((tX, 80), '[+] ROSTER CONFIRMED // OPERATIVE VERIFIED', fill=tcfg['accent2'], font=tag_font)
            draw.text((tX, 115), f'{server_name.upper()} • CLAN OPERATIVE', fill=(220, 230, 242, 255), font=welcome_font)
            draw.text((tX, 150), username, fill=tcfg['accent2'], font=name_font)
            draw.line([(tX, 225), (W - 90, 225)], fill=tcfg['accent2'], width=2)

            draw.rectangle([tX, 245, tX + 180, 288], fill=tcfg['pill_bg'], outline=tcfg['accent2'], width=2)
            draw.text((tX + 90, 266), f'MEMBER #{num_str}', fill=tcfg['accent2'], font=badge_font, anchor='mm')

            draw.rectangle([tX + 195, 245, tX + 465, 288], fill=(15, 40, 30, 220), outline=tcfg['accent2'], width=2)
            draw.text((tX + 330, 266), 'VERIFIED SMP ROSTER', fill=tcfg['accent2'], font=badge_font, anchor='mm')

            draw.rectangle([tX, 340, W - 90, 385], fill=(8, 16, 28, 230), outline=tcfg['accent2'], width=1)
            draw.text((tX + 20, 362), 'CO-LEADER: KryloMCYT  •  LEADER: Jonesy  •  BASE COMMS: UNLOCKED', fill=(160, 185, 210, 255), font=footer_font, anchor='lm')
    else:
        # Standard High-Tech Universal HUD Welcome Card
        draw.text((tX, 80), '[+] SYSTEM GATEWAY // VERIFIED ACCESS', fill=tcfg['accent2'], font=tag_font)
        draw.text((tX, 115), primary_title.upper(), fill=(220, 230, 242, 255), font=welcome_font)
        draw.text((tX, 150), f'@{username}', fill=tcfg['accent'], font=name_font)
        draw.line([(tX, 225), (W - 90, 225)], fill=tcfg['accent2'], width=2)

        # Badges Row
        badge_w1 = max(180, int(len(primary_sub) * 11) + 30)
        draw.rectangle([tX, 245, tX + badge_w1, 288], fill=tcfg['pill_bg'], outline=tcfg['accent'], width=2)
        draw.text((tX + (badge_w1 // 2), 266), primary_sub.upper(), fill=tcfg['accent'], font=badge_font, anchor='mm')

        draw.rectangle([tX + badge_w1 + 15, 245, tX + badge_w1 + 220, 288], fill=(10, 35, 22, 220), outline=tcfg['accent2'], width=2)
        draw.text((tX + badge_w1 + 118, 266), 'VERIFIED OPERATIVE', fill=tcfg['accent2'], font=badge_font, anchor='mm')

        # Footer Terminal Row
        draw.rectangle([tX, 340, W - 90, 385], fill=(8, 16, 28, 230), outline=tcfg['accent2'], width=1)
        draw.text((tX + 20, 362), 'POWERED BY KRIMS CODE AI // VERIFIED COMMUNITY ACCESS', fill=(160, 185, 210, 255), font=footer_font, anchor='lm')

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    img.convert('RGB').save(out_path, quality=95)
    print(f'[WelcomeCard] Generated successfully at: {out_path}')

    # Cleanup temp files
    if os.path.exists(temp_avatar): os.remove(temp_avatar)
    if os.path.exists(temp_mc_head): os.remove(temp_mc_head)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--avatar', required=True)
    parser.add_argument('--mc_head', default='')
    parser.add_argument('--username', required=True)
    parser.add_argument('--member_count', type=int, default=1)
    parser.add_argument('--server_name', default='KRIMS CODE')
    parser.add_argument('--phase', type=int, choices=[1, 2], default=1)
    parser.add_argument('--heading', default=None)
    parser.add_argument('--subtext', default=None)
    parser.add_argument('--theme', default='cyber-cyan')
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
