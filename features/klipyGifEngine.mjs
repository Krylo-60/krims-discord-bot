import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const KLIPY_API_KEY = process.env.KLIPY_API_KEY || 'KFMMsJHkFOP466MZIMoHfKTpSdhw3feunrLUHCWBEiAmQVdOwBr2wHrL8O7e4x44';

// In-memory cache for cycling through search results: interactionId/messageId -> { items: [], index: 0, query: '' }
export const klipySearchCache = new Map();

/**
 * Searches KLIPY for GIFs, stickers, memes, or clips
 */
export async function searchKlipy(query, type = 'gifs', limit = 15) {
  const validTypes = ['gifs', 'stickers', 'memes', 'clips'];
  const targetType = validTypes.includes(type) ? type : 'gifs';
  const url = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/${targetType}/search?q=${encodeURIComponent(query)}&limit=${limit}`;

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      console.warn(`[KLIPY API] Search error: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(data?.data?.data)) items = data.data.data;
    else if (Array.isArray(data?.data)) items = data.data;
    else if (Array.isArray(data?.results)) items = data.results;

    const lowerQ = (query || '').toLowerCase();
    if (lowerQ.includes('krylo') || lowerQ.includes('half') || lowerQ.includes('clan')) {
      items.unshift({
        title: '⚡ The Half Lifes Clan Animation • Krylo_MC 👑',
        url: 'https://krims-discord-bot-d57m.onrender.com/gifs/the_half_lifes.gif',
        slug: 'the-half-lifes-clan-gif'
      });
    }

    return items;
  } catch (err) {
    console.error('[KLIPY API] Search network error:', err.message);
    return [];
  }
}

/**
 * Fetches trending content from KLIPY
 */
export async function getKlipyTrending(type = 'gifs', limit = 15) {
  const validTypes = ['gifs', 'stickers', 'memes', 'clips'];
  const targetType = validTypes.includes(type) ? type : 'gifs';
  const url = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/${targetType}/trending?limit=${limit}`;

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      console.warn(`[KLIPY API] Trending error: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(data?.data?.data)) items = data.data.data;
    else if (Array.isArray(data?.data)) items = data.data;
    else if (Array.isArray(data?.results)) items = data.results;
    return items;
  } catch (err) {
    console.error('[KLIPY API] Trending network error:', err.message);
    return [];
  }
}

/**
 * Helper to extract best GIF / media URL from a KLIPY item
 */
export function extractMediaUrl(item) {
  if (!item) return null;
  if (item.url) return item.url;
  if (!item.file) return null;
  const f = item.file;
  return (
    f.hd?.gif?.url ||
    f.md?.gif?.url ||
    f.sm?.gif?.url ||
    f.hd?.webp?.url ||
    f.md?.webp?.url ||
    f.hd?.jpg?.url ||
    f.md?.jpg?.url ||
    null
  );
}

/**
 * Builds the Rich Embed and Action Buttons for a KLIPY media item
 */
export function buildKlipyEmbed(item, query = 'Trending', index = 0, total = 1, type = 'gifs') {
  const mediaUrl = extractMediaUrl(item);
  const title = item.title || item.slug || `KLIPY ${type.slice(0, -1).toUpperCase()}`;
  const klipyWebUrl = item.slug ? `https://klipy.com/${type}/${item.slug}` : 'https://klipy.com';

  const typeIcons = {
    gifs: '🎬',
    stickers: '✨',
    memes: '🧠',
    clips: '📹'
  };
  const icon = typeIcons[type] || '🎬';

  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle(`${icon} ${title}`)
    .setURL(klipyWebUrl)
    .setFooter({ 
      text: `KLIPY • Result ${index + 1} of ${total} • Query: "${query}"`,
      iconURL: 'https://krims-code-chatbot.vercel.app/logo.png'
    })
    .setTimestamp();

  if (mediaUrl) {
    embed.setImage(mediaUrl);
  }

  const nextBtn = new ButtonBuilder()
    .setCustomId(`btn_klipy_next_${Date.now().toString(36)}`)
    .setLabel('🔄 Next')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(total <= 1);

  const webBtn = new ButtonBuilder()
    .setLabel('🔗 View on KLIPY')
    .setStyle(ButtonStyle.Link)
    .setURL(klipyWebUrl);

  const row = new ActionRowBuilder().addComponents(nextBtn, webBtn);

  return { embeds: [embed], components: [row] };
}

/**
 * Main Slash Command Handler for /gif
 */
export async function handleGifCommand(interaction) {
  const query = interaction.options.getString('search');
  const type = interaction.options.getString('type') || 'gifs';

  await interaction.deferReply();

  let items = [];
  if (query && query.trim().length > 0) {
    items = await searchKlipy(query.trim(), type, 20);
  } else {
    items = await getKlipyTrending(type, 20);
  }

  if (!items || items.length === 0) {
    return await interaction.editReply({
      content: `❌ No ${type} found on **KLIPY** for \`${query || 'Trending'}\`. Try a different keyword!`
    });
  }

  const cacheKey = `klipy_${interaction.id}`;
  klipySearchCache.set(cacheKey, {
    items,
    index: 0,
    query: query || 'Trending',
    type,
    userId: interaction.user.id
  });

  const payload = buildKlipyEmbed(items[0], query || 'Trending', 0, items.length, type);
  return await interaction.editReply(payload);
}

/**
 * Handles 'Next GIF' button clicks
 */
export async function handleKlipyButtonInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('btn_klipy_next_')) {
    return false;
  }

  // Find cache entry matching message
  let targetEntry = null;
  let targetKey = null;
  for (const [key, entry] of klipySearchCache.entries()) {
    if (entry.items && entry.items.length > 0) {
      targetEntry = entry;
      targetKey = key;
      break;
    }
  }

  if (!targetEntry || !targetEntry.items || targetEntry.items.length === 0) {
    return await interaction.reply({
      content: '⚠️ Search session expired! Please run `/gif` again.',
      ephemeral: true
    });
  }

  targetEntry.index = (targetEntry.index + 1) % targetEntry.items.length;
  const currentItem = targetEntry.items[targetEntry.index];
  const payload = buildKlipyEmbed(currentItem, targetEntry.query, targetEntry.index, targetEntry.items.length, targetEntry.type);

  await interaction.update(payload);
  return true;
}
