import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 ENFORCE USER PREFERRED LINE SEPARATOR (┃) LAYOUT (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const STORE_URL = 'https://krylosmp-store.web.app/';
const PORTAL_URL = 'https://krylosmp.web.app/';

client.once('ready', async () => {
  console.log('[+] Line Separator Layout Enforcer Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`⚙️ ENFORCING LINE SEPARATOR (┃) CHANNELS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      // Helper to ensure category
      const ensureCategory = async (name) => {
        let cat = guild.channels.cache.find(c => c.name.toUpperCase().includes(name.toUpperCase().replace(/━/g, '')) && c.type === ChannelType.GuildCategory);
        if (!cat) {
          cat = await guild.channels.create({ name, type: ChannelType.GuildCategory });
          console.log(`  [+] Created category: ${name}`);
        }
        return cat;
      };

      const infoCat = await ensureCategory('╭━━━ 📌 INFORMATION ━━━╮');
      const commCat = await ensureCategory('╭━━━ 💬 COMMUNITY ━━━╮');
      const econCat = await ensureCategory('╭━━━ 🛒 ECONOMY & STORE ━━━╮');
      const clanCat = await ensureCategory('╭━━━ 🏰 FACTIONS & CLANS ━━━╮');
      const pvpCat  = await ensureCategory('╭━━━ ⚔️ PVP & TOURNAMENTS ━━━╮');
      const suppCat = await ensureCategory('╭━━━ 🎟️ SUPPORT & TICKETS ━━━╮');

      // Exact preferred channels list:
      const preferredChannels = [
        // Information
        { name: '📌┃rules', cat: infoCat },
        { name: '📢┃server-announcements', cat: infoCat },
        { name: '📺┃youtube-announcements', cat: infoCat },
        { name: 'ℹ️┃server-info', cat: infoCat },
        { name: '🌐┃socials', cat: infoCat },
        { name: '✅┃verify', cat: infoCat },
        { name: '📢┃new-updates', cat: infoCat },
        // Community
        { name: '💬┃general-chat', cat: commCat },
        { name: '🎵┃music-chat', cat: commCat },
        { name: '📷┃media-clips', cat: commCat },
        { name: '😂┃memes', cat: commCat },
        { name: '💡┃suggestions', cat: commCat },
        { name: '🤖┃bot-commands', cat: commCat },
        // Economy & Store
        { name: '🛒┃store', cat: econCat },
        { name: '🤝┃item-trading', cat: econCat },
        { name: '💰┃jackpot-vault', cat: econCat },
        { name: '🎯┃bounty-board', cat: econCat },
        // Factions & Clans
        { name: '🛡️┃clan-recruitment', cat: clanCat },
        { name: '🏆┃clan-leaderboard', cat: clanCat },
        // PvP & Tournaments
        { name: '⚔️┃pvp-chat', cat: pvpCat },
        { name: '🏆┃monthly-tournament', cat: pvpCat },
        // Support
        { name: '🎫┃support-tickets', cat: suppCat }
      ];

      // Step 1: Ensure preferred channels exist and are inside correct category
      for (const item of preferredChannels) {
        let ch = guild.channels.cache.find(c => c.name === item.name && c.type === ChannelType.GuildText);
        if (!ch) {
          // Check if a similar channel can be renamed
          const similar = guild.channels.cache.find(c => c.name.replace(/・/g, '┃').replace(/-/g, '┃').includes(item.name.split('┃')[1]) && c.type === ChannelType.GuildText);
          if (similar) {
            await similar.setName(item.name).catch(() => {});
            await similar.setParent(item.cat.id).catch(() => {});
            console.log(`  [✏️] Renamed & moved #${similar.name} -> #${item.name}`);
          } else {
            ch = await guild.channels.create({
              name: item.name,
              type: ChannelType.GuildText,
              parent: item.cat.id
            });
            console.log(`  [+] Created preferred channel: #${item.name}`);
          }
        } else {
          await ch.setParent(item.cat.id).catch(() => {});
        }
      }

      // Step 2: Delete all dot-bullet (・) duplicate channels that are NOT in preferredChannels
      const allTextChannels = Array.from(guild.channels.cache.values()).filter(c => c.type === ChannelType.GuildText);
      const preferredNames = preferredChannels.map(p => p.name);

      let deletedCount = 0;

      for (const ch of allTextChannels) {
        if (ch.name.startsWith('ticket-')) continue; // keep active support tickets

        if (!preferredNames.includes(ch.name) && ch.name.includes('・')) {
          try {
            await ch.delete('Removing dot bullet duplicate in favor of user preferred line separator channel');
            deletedCount++;
            console.log(`  🗑️ Deleted duplicate channel: #${ch.name}`);
          } catch (e) {
            console.warn(`  [-] Could not delete #${ch.name}: ${e.message}`);
          }
        }
      }

      console.log(`\n🏆 LAYOUT ENFORCEMENT COMPLETE IN [${guild.name}]: ${deletedCount} DUPLICATES REMOVED!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error enforcing layout:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
