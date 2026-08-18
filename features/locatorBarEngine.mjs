import fetch from 'node-fetch';

/**
 * Convert UUID string to 32-bit integer hash code
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Convert RGB to HSV
 */
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

/**
 * Convert HSV to RGB Hex
 */
function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Compute the in-game 90% normalized locator bar color for a Minecraft player
 */
export async function getLocatorColor(input) {
  let username = input.trim();
  let uuid = '';

  // Check if input is a hex color directly
  if (input.startsWith('#') || (/^[0-9A-F]{6}$/i.test(input) && input.length === 6)) {
    const hex = input.startsWith('#') ? input : `#${input}`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const hsv = rgbToHsv(r, g, b);
    const normalizedHex = hsvToRgb(hsv.h, Math.max(hsv.s, 0.65), 0.90);
    return {
      type: 'color',
      rawHex: hex,
      normalizedHex,
      rgb: { r, g, b },
      hue: Math.round(hsv.h * 360),
      saturation: Math.round(hsv.s * 100),
      brightness: 90
    };
  }

  // Check if input is UUID or Username
  const cleanInput = input.replace(/-/g, '');
  if (/^[0-9a-fA-F]{32}$/.test(cleanInput)) {
    uuid = cleanInput;
    try {
      const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
      if (res.ok) {
        const data = await res.json();
        username = data.name;
      }
    } catch (e) {}
  } else {
    // Fetch UUID from Mojang API
    try {
      const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        uuid = data.id;
        username = data.name;
      }
    } catch (e) {}
  }

  // Fallback UUID if offline
  if (!uuid) {
    uuid = Array.from(username).reduce((acc, c) => acc + c.charCodeAt(0).toString(16), '').padEnd(32, '0').slice(0, 32);
  }

  // Compute Color from UUID
  // Split UUID into parts to compute consistent hash
  const part1 = parseInt(uuid.slice(0, 8), 16) || 0;
  const part2 = parseInt(uuid.slice(8, 16), 16) || 0;
  const part3 = parseInt(uuid.slice(16, 24), 16) || 0;
  const part4 = parseInt(uuid.slice(24, 32), 16) || 0;
  const combined = (part1 ^ part2 ^ part3 ^ part4) & 0xFFFFFF;

  const rawR = (combined >> 16) & 0xFF;
  const rawG = (combined >> 8) & 0xFF;
  const rawB = combined & 0xFF;
  const rawHex = `#${rawR.toString(16).padStart(2, '0')}${rawG.toString(16).padStart(2, '0')}${rawB.toString(16).padStart(2, '0')}`;

  const hsv = rgbToHsv(rawR, rawG, rawB);
  // Minecraft normalizes locator bar brightness to 90% and ensures vibrant hue
  const normalizedHex = hsvToRgb(hsv.h, Math.max(hsv.s, 0.70), 0.90);

  // Generate simulated locator neighbors
  const neighborSamples = [
    'Notch', 'Jeb_', 'DanTDM', 'Technoblade', 'Dream', 'Grian', 'MumboJumbo',
    'CaptainSparklez', 'TommyInnit', 'GeorgeNotFound', 'Sapnap', 'Krylo_MC'
  ];

  return {
    type: 'player',
    username,
    uuid: `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`,
    avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(username)}/128`,
    skinUrl: `https://mc-heads.net/body/${encodeURIComponent(username)}/right`,
    rawHex,
    normalizedHex,
    hue: Math.round(hsv.h * 360),
    saturation: Math.round(Math.max(hsv.s, 0.70) * 100),
    brightness: 90,
    barPreview: `[ ▬▬▬ ⬥ ${username.toUpperCase()} ⬥ ▬▬▬ ]`
  };
}
