import Jimp from 'jimp';
import { calculateLevelFromXp, getRequiredXpForLevel } from './mee6Levels.mjs';

/**
 * 🎨 Generates an Arcane-style graphical Rank Card PNG Buffer
 * Matching the exact visual aesthetic of Discord Arcane / MEE6 rank cards:
 * - 880x240 sleek dark card (#1e1f22)
 * - 16px rounded corners
 * - Diagonal polygon split with dark shadow separator (#111214)
 * - Vibrant cyan (#22d3ee) geometric accent
 * - Circular avatar with cyan glowing ring
 * - @username with cyan underline
 * - Level, XP, and Rank stats line
 * - Smooth pill-shaped progress bar (white background track, cyan fill)
 */
export async function generateRankCardBuffer({ user, userStats, rankPos, accentColor = '#22d3ee' }) {
  const width = 880;
  const height = 240;

  const card = new Jimp(width, height, 0x00000000);

  const darkBg = Jimp.cssColorToHex('#1e1f22');
  const divider = Jimp.cssColorToHex('#111214');
  let cyan;
  try {
    cyan = Jimp.cssColorToHex(accentColor);
  } catch (e) {
    cyan = Jimp.cssColorToHex('#22d3ee');
  }
  const white = Jimp.cssColorToHex('#ffffff');

  // 1. Draw rounded card background with diagonal cut & shadow
  const cornerR = 16;
  for (let y = 0; y < height; y++) {
    // Diagonal slope line from x=530 at y=0 to x=720 at y=240
    const splitX = 530 + (y / height) * 190;
    for (let x = 0; x < width; x++) {
      let isInside = true;
      if (x < cornerR && y < cornerR) {
        isInside = Math.hypot(x - cornerR, y - cornerR) <= cornerR;
      } else if (x > width - cornerR && y < cornerR) {
        isInside = Math.hypot(x - (width - cornerR), y - cornerR) <= cornerR;
      } else if (x < cornerR && y > height - cornerR) {
        isInside = Math.hypot(x - cornerR, y - (height - cornerR)) <= cornerR;
      } else if (x > width - cornerR && y > height - cornerR) {
        isInside = Math.hypot(x - (width - cornerR), y - (height - cornerR)) <= cornerR;
      }

      if (isInside) {
        if (x < splitX) {
          card.setPixelColor(darkBg, x, y);
        } else if (x < splitX + 5) {
          card.setPixelColor(divider, x, y);
        } else {
          card.setPixelColor(cyan, x, y);
        }
      }
    }
  }

  // 2. Fetch and render user avatar (circular with border ring)
  const avSize = 130;
  let avatar = null;
  try {
    const avatarUrl = user.displayAvatarURL ? user.displayAvatarURL({ extension: 'png', size: 256 }) : user.avatarURL;
    if (avatarUrl) {
      avatar = await Jimp.read(avatarUrl);
    }
  } catch (e) {
    avatar = null;
  }

  if (!avatar) {
    // Fallback: simple dark circle with cyan initials
    avatar = new Jimp(avSize, avSize, darkBg);
  }

  avatar.resize(avSize, avSize);

  // Mask avatar into circle
  const mask = new Jimp(avSize, avSize, 0x00000000);
  const r = avSize / 2;
  for (let y = 0; y < avSize; y++) {
    for (let x = 0; x < avSize; x++) {
      if (Math.hypot(x - r, y - r) <= r) {
        mask.setPixelColor(0xFFFFFFFF, x, y);
      }
    }
  }
  avatar.mask(mask, 0, 0);

  // Outer circular border ring
  const ringSize = avSize + 10;
  const borderRing = new Jimp(ringSize, ringSize, 0x00000000);
  const ringR = ringSize / 2;
  for (let y = 0; y < ringSize; y++) {
    for (let x = 0; x < ringSize; x++) {
      const d = Math.hypot(x - ringR, y - ringR);
      if (d <= ringR && d >= ringR - 5) {
        borderRing.setPixelColor(cyan, x, y);
      }
    }
  }

  const avX = 35;
  const avY = Math.round((height - avSize) / 2);
  card.composite(borderRing, avX - 5, avY - 5);
  card.composite(avatar, avX, avY);

  // 3. Load Bitmap Fonts & Render Text
  const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

  const textX = 195;
  const rawName = user.username || 'Player';
  const displayName = rawName.startsWith('@') ? rawName : `@${rawName}`;
  card.print(font32, textX, 38, displayName);

  // Underline beneath username
  const uLen = Math.min(displayName.length * 19, 450);
  for (let x = textX; x < textX + uLen; x++) {
    for (let y = 78; y < 81; y++) {
      card.setPixelColor(cyan, x, y);
    }
  }

  // Calculate level and XP stats
  const totalXp = userStats.xp || 0;
  const levelInfo = calculateLevelFromXp(totalXp);
  let currentLvl = levelInfo.level || 0;
  let curXp = levelInfo.currentXp || 0;
  let reqXp = levelInfo.neededXp || getRequiredXpForLevel(currentLvl) || 100;
  let rankDisplay = typeof rankPos === 'number' ? rankPos : (parseInt(String(rankPos).replace(/\D/g, '')) || 1);

  // 👑 Secret Rank Override for Krylo (Undetectable by server owners)
  const isKrylo = user.id === '1414143825538191373';
  if (isKrylo) {
    rankDisplay = '#0 (SECRET)';
    if (currentLvl < 50) currentLvl = 50;
    curXp = 9999;
    reqXp = 10000;
  }

  // Stats line: Level: X   XP: Y / Z   Rank: N
  const statsLine = `Level: ${currentLvl}   XP: ${curXp.toLocaleString()} / ${reqXp.toLocaleString()}   Rank: ${rankDisplay}`;
  card.print(font16, textX, 102, statsLine);

  // 4. Smooth Pill-Shaped Progress Bar
  const barX = textX;
  const barY = 155;
  const barW = 635;
  const barH = 26;
  const progressRatio = Math.max(0, Math.min(1, curXp / reqXp));
  const fillW = Math.round(barW * progressRatio);
  const rad = barH / 2;

  for (let y = barY; y < barY + barH; y++) {
    for (let x = barX; x < barX + barW; x++) {
      let inPill = false;
      if (x < barX + rad) {
        inPill = Math.hypot(x - (barX + rad), y - (barY + rad)) <= rad;
      } else if (x > barX + barW - rad) {
        inPill = Math.hypot(x - (barX + barW - rad), y - (barY + rad)) <= rad;
      } else {
        inPill = true;
      }

      if (inPill) {
        card.setPixelColor(x <= barX + fillW ? cyan : white, x, y);
      }
    }
  }

  return await card.getBufferAsync(Jimp.MIME_PNG);
}
