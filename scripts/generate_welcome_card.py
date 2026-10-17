import sys
import os
import argparse
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

def generate_card(avatar_input, mc_head_input, username, member_count, server_name, phase, out_path):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fonts_dir = os.path.join(base_dir, 'assets', 'fonts')
    images_dir = os.path.join(base_dir, 'assets', 'images')
    clan_logo_path = os.path.join(images_dir, 'clan_shield.jpg')

    # Font lookups with fallbacks
    font_bahn = os.path.join(fonts_dir, 'bahnschrift.ttf')
    font_bold = os.path.join(fonts_dir, 'segoeuib.ttf')
    if not os.path.exists(font_bahn):
        font_bahn = r'C:\Windows\Fonts\bahnschrift.ttf'
    if not os.path.exists(font_bold):
        font_bold = r'C:\Windows\Fonts\segoeuib.ttf'

    try:
        tag_font = ImageFont.truetype(font_bahn, 16)
        welcome_font = ImageFont.truetype(font_bahn, 25)
        name_font = ImageFont.truetype(font_bold, 52)
        badge_font = ImageFont.truetype(font_bold, 17)
        footer_font = ImageFont.truetype(font_bahn, 15)
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
    img = Image.new('RGBA', (W, H), (10, 14, 23, 255))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(H):
        ratio = y / H
        r = int(10 + (6 - 10) * ratio)
        g = int(14 + (24 - 14) * ratio)
        b = int(23 + (38 - 23) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Cyber Grid
    grid_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grid_overlay)
    for x in range(0, W, 40): g_draw.line([(x, 0), (x, H)], fill=(0, 255, 200, 16), width=1)
    for y in range(0, H, 40): g_draw.line([(0, y), (W, y)], fill=(0, 255, 200, 16), width=1)

    # Watermarked Clan Shield
    if os.path.exists(clan_logo_path):
        shield = Image.open(clan_logo_path).convert('RGBA').resize((360, 360), Image.Resampling.LANCZOS)
        alpha = shield.split()[3]
        alpha = ImageEnhance.Brightness(alpha).enhance(0.25)
        shield.putalpha(alpha)
        img.paste(shield, (W - 380, (H - 360) // 2), shield)

    img = Image.alpha_composite(img, grid_overlay)

    # Neon Border
    border_glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(border_glow)
    bg_draw.rectangle([8, 8, W - 9, H - 9], outline=(0, 255, 255, 120), width=3)
    bg_draw.rectangle([11, 11, W - 12, H - 12], outline=(0, 255, 136, 170), width=2)
    img = Image.alpha_composite(img, border_glow.filter(ImageFilter.GaussianBlur(4)))
    draw = ImageDraw.Draw(img)
    draw.rectangle([11, 11, W - 12, H - 12], outline=(0, 255, 255, 255), width=2)

    # Corner brackets
    cL, cC = 35, (0, 255, 200, 255)
    draw.line([(6, 6), (6 + cL, 6)], fill=cC, width=4)
    draw.line([(6, 6), (6, 6 + cL)], fill=cC, width=4)
    draw.line([(W - 7, 6), (W - 7 - cL, 6)], fill=cC, width=4)
    draw.line([(W - 7, 6), (W - 7, 6 + cL)], fill=cC, width=4)
    draw.line([(6, H - 7), (6 + cL, H - 7)], fill=cC, width=4)
    draw.line([(6, H - 7), (6, H - 7 - cL)], fill=cC, width=4)
    draw.line([(W - 7, H - 7), (W - 7 - cL, H - 7)], fill=cC, width=4)
    draw.line([(W - 7, H - 7), (W - 7, H - 7 - cL)], fill=cC, width=4)

    # Avatar with Glowing Ring
    av_size, a_cx, a_cy = 190, 160, H // 2
    if avatar_path and os.path.exists(avatar_path):
        av = Image.open(avatar_path).convert('RGBA').resize((av_size, av_size), Image.Resampling.LANCZOS)
    else:
        av = Image.new('RGBA', (av_size, av_size), (40, 50, 70, 255))

    mask = Image.new('L', (av_size, av_size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, av_size, av_size], fill=255)

    ring_color = (0, 255, 136, 240) if phase == 2 else (0, 255, 255, 220)
    halo = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(halo)
    h_draw.ellipse([a_cx - av_size//2 - 12, a_cy - av_size//2 - 12, a_cx + av_size//2 + 12, a_cy + av_size//2 + 12], outline=ring_color, width=6)
    h_draw.ellipse([a_cx - av_size//2 - 6, a_cy - av_size//2 - 6, a_cx + av_size//2 + 6, a_cy + av_size//2 + 6], outline=(0, 255, 200, 255), width=3)
    img = Image.alpha_composite(img, halo.filter(ImageFilter.GaussianBlur(6)))
    img = Image.alpha_composite(img, halo)
    img.paste(av, (a_cx - av_size//2, a_cy - av_size//2), mask)

    # Draw Minecraft Head badge on corner if Phase 2
    if phase == 2 and mc_head_path and os.path.exists(mc_head_path):
        mc_head = Image.open(mc_head_path).convert('RGBA').resize((75, 75), Image.Resampling.LANCZOS)
        head_mask = Image.new('L', (75, 75), 0)
        ImageDraw.Draw(head_mask).rounded_rectangle([0, 0, 75, 75], radius=14, fill=255)
        img.paste(mc_head, (a_cx + 40, a_cy + 25), head_mask)
        draw_mc = ImageDraw.Draw(img)
        draw_mc.rounded_rectangle([a_cx + 40, a_cy + 25, a_cx + 115, a_cy + 100], radius=14, outline=(0, 255, 136, 255), width=3)

    draw = ImageDraw.Draw(img)
    draw.ellipse([a_cx - av_size//2, a_cy - av_size//2, a_cx + av_size//2, a_cy + av_size//2], outline=(255, 255, 255, 220), width=2)

    # Status pip
    status_col = (0, 255, 136, 255) if phase == 2 else (245, 158, 11, 255)
    draw.ellipse([a_cx + 60, a_cy + 60, a_cx + 90, a_cy + 90], fill=status_col, outline=(10, 14, 23, 255), width=4)

    # Typography
    tX = 310
    num_str = str(member_count).zfill(3)

    if phase == 1:
        # Phase 1: Initial Arrival / Pending IGN
        draw.text((tX, 80), '[+] SYSTEM ENTRY // NEW OPERATIVE DETECTED', fill=(0, 255, 200, 240), font=tag_font)
        draw.text((tX, 115), f'WELCOME TO {server_name.upper()}', fill=(220, 230, 242, 255), font=welcome_font)
        draw.text((tX, 150), username, fill=(0, 255, 255, 255), font=name_font)
        draw.line([(tX, 225), (W - 90, 225)], fill=(0, 255, 200, 120), width=2)

        # Badges
        draw.rectangle([tX, 245, tX + 180, 288], fill=(15, 30, 45, 220), outline=(0, 255, 136, 220), width=2)
        draw.text((tX + 90, 266), f'MEMBER #{num_str}', fill=(0, 255, 136, 255), font=badge_font, anchor='mm')

        draw.rectangle([tX + 195, 245, tX + 490, 288], fill=(35, 25, 15, 220), outline=(245, 158, 11, 220), width=2)
        draw.text((tX + 342, 266), 'PENDING MINECRAFT IGN', fill=(245, 158, 11, 255), font=badge_font, anchor='mm')

        # Footer
        draw.rectangle([tX, 340, W - 90, 385], fill=(8, 16, 28, 230), outline=(0, 255, 200, 80), width=1)
        draw.text((tX + 20, 362), 'CO-LEADER: KryloMCYT  •  LEADER: st1LLkill3r  •  DROP IGN IN #ROSTER', fill=(160, 185, 210, 255), font=footer_font, anchor='lm')

    else:
        # Phase 2: Roster Verified with Minecraft IGN
        draw.text((tX, 80), '[+] ROSTER CONFIRMED // OPERATIVE VERIFIED', fill=(0, 255, 136, 255), font=tag_font)
        draw.text((tX, 115), f'{server_name.upper()} • CLAN OPERATIVE', fill=(220, 230, 242, 255), font=welcome_font)
        draw.text((tX, 150), username, fill=(0, 255, 136, 255), font=name_font)
        draw.line([(tX, 225), (W - 90, 225)], fill=(0, 255, 200, 120), width=2)

        # Badges
        draw.rectangle([tX, 245, tX + 180, 288], fill=(15, 30, 45, 220), outline=(0, 255, 136, 220), width=2)
        draw.text((tX + 90, 266), f'MEMBER #{num_str}', fill=(0, 255, 136, 255), font=badge_font, anchor='mm')

        draw.rectangle([tX + 195, 245, tX + 465, 288], fill=(15, 40, 30, 220), outline=(0, 255, 136, 220), width=2)
        draw.text((tX + 330, 266), 'VERIFIED SMP ROSTER', fill=(0, 255, 136, 255), font=badge_font, anchor='mm')

        draw.rectangle([tX + 480, 245, tX + 680, 288], fill=(20, 25, 45, 220), outline=(0, 255, 255, 220), width=2)
        draw.text((tX + 580, 266), 'CLAN COMBATANT', fill=(0, 255, 255, 255), font=badge_font, anchor='mm')

        # Footer
        draw.rectangle([tX, 340, W - 90, 385], fill=(8, 16, 28, 230), outline=(0, 255, 200, 80), width=1)
        draw.text((tX + 20, 362), 'CO-LEADER: KryloMCYT  •  LEADER: st1LLkill3r  •  BASE COMMS: UNLOCKED', fill=(160, 185, 210, 255), font=footer_font, anchor='lm')

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
    parser.add_argument('--server_name', default='THE HALF LIFES')
    parser.add_argument('--phase', type=int, choices=[1, 2], default=1)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()

    generate_card(
        avatar_input=args.avatar,
        mc_head_input=args.mc_head,
        username=args.username,
        member_count=args.member_count,
        server_name=args.server_name,
        phase=args.phase,
        out_path=args.out
    )
