import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 DEEP PURGE OF ALL REMAINING LEGACY CATEGORIES & DUPLICATE CHANNELS (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const proCategories = [
  '╭━━━ 📌 INFORMATION ━━━╮',
  '╭━━━ 💬 COMMUNITY ━━━╮',
  '╭━━━ 🛒 ECONOMY & STORE ━━━╮',
  '╭━━━ 🏰 FACTIONS & CLANS ━━━╮',
  '╭━━━ ⚔️ PVP & TOURNAMENTS ━━━╮',
  '╭━━━ 🎟️ SUPPORT & TICKETS ━━━╮',
  '╭━━━ 🔊 VOICE LOUNGES ━━━╮'
];

client.once('ready', async () => {
  console.log('[+] Deep Legacy Categories & Channels Purger Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of guilds) {
      console.log(`=======================================================`);
      console.log(`🔥 DEEP PURGE IN PROGRESS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      // 1. Delete legacy categories not in proCategories
      const allCategories = Array.from(guild.channels.cache.values())
        .filter(c => c.type === ChannelType.GuildCategory);

      let deletedCats = 0;
      let deletedChs = 0;

      for (const cat of allCategories) {
        if (!proCategories.includes(cat.name)) {
          // Delete all child channels inside this legacy category
          const children = Array.from(guild.channels.cache.values()).filter(c => c.parentId === cat.id);
          for (const ch of children) {
            try {
              await ch.delete(`Purging legacy channel inside non-pro category ${cat.name}`);
              deletedChs++;
              console.log(`  🗑️ Deleted Legacy Channel: #${ch.name} (from category: ${cat.name})`);
            } catch (e) {
              console.warn(`  [-] Could not delete channel #${ch.name}: ${e.message}`);
            }
          }

          // Delete the legacy category itself
          try {
            await cat.delete(`Purging legacy category ${cat.name}`);
            deletedCats++;
            console.log(`  📁 Deleted Legacy Category: ${cat.name}`);
          } catch (e) {
            console.warn(`  [-] Could not delete category ${cat.name}: ${e.message}`);
          }
        }
      }

      console.log(`\n🏆 PURGE COMPLETE IN [${guild.name}]: ${deletedCats} Categories & ${deletedChs} Channels Deleted!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Purge Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
