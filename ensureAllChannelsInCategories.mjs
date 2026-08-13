import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 KRYLOSMP CATEGORY CONSOLIDATOR (.MJS)
 * Ensures every single channel across all connected servers belongs to a designated Category!
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log('[+] Category Consolidator Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      if (!guild.name.toLowerCase().includes('krylo')) continue;

      console.log(`=======================================================`);
      console.log(`🏰 CHECKING CATEGORY ORGANIZATIONS IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = await guild.channels.fetch();
      const allChannels = [...channels.values()].filter(c => c !== null);

      // Map out or create primary categories
      const getOrCreateCategory = async (catName) => {
        let cat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === catName.toLowerCase());
        if (!cat) {
          cat = await guild.channels.create({
            name: catName,
            type: ChannelType.GuildCategory
          });
          allChannels.push(cat);
          console.log(`  [+] Created Category: "${catName}"`);
        }
        return cat;
      };

      const infoCat = await getOrCreateCategory('╭━━━ 📌 INFORMATION ━━━╮');
      const communityCat = await getOrCreateCategory('╭━━━ 💬 COMMUNITY ━━━╮');
      const economyCat = await getOrCreateCategory('╭━━━ 🛒 ECONOMY & STORE ━━━╮');
      const pvpCat = await getOrCreateCategory('╭━━━ ⚔️ PVP & TOURNAMENTS ━━━╮');
      const factionsCat = await getOrCreateCategory('╭━━━ 🏰 FACTIONS & CLANS ━━━╮');
      const supportCat = await getOrCreateCategory('╭━━━ 🎟️ SUPPORT & TICKETS ━━━╮');
      const voiceCat = await getOrCreateCategory('╭━━━ 🔊 VOICE LOUNGES ━━━╮');

      let movedCount = 0;

      for (const ch of allChannels) {
        // Ignore categories themselves
        if (ch.type === ChannelType.GuildCategory) continue;

        // If channel is already in a category, skip unless it's orphan
        if (ch.parentId) {
          console.log(`  [✓] #${ch.name} -> Already inside category ID ${ch.parentId}`);
          continue;
        }

        // Determine destination category for orphan channels
        const name = ch.name.toLowerCase();
        let targetCat = communityCat;

        if (ch.type === ChannelType.GuildVoice) {
          targetCat = voiceCat;
        } else if (name.includes('rule') || name.includes('announcement') || name.includes('info') || name.includes('social') || name.includes('update')) {
          targetCat = infoCat;
        } else if (name.includes('store') || name.includes('trade') || name.includes('jackpot') || name.includes('eco')) {
          targetCat = economyCat;
        } else if (name.includes('pvp') || name.includes('bounty') || name.includes('tournament')) {
          targetCat = pvpCat;
        } else if (name.includes('clan') || name.includes('faction')) {
          targetCat = factionsCat;
        } else if (name.includes('ticket') || name.includes('support')) {
          targetCat = supportCat;
        } else if (name.includes('general') || name.includes('chat') || name.includes('clip') || name.includes('media') || name.includes('meme') || name.includes('suggest')) {
          targetCat = communityCat;
        }

        try {
          await ch.setParent(targetCat.id, { lockPermissions: false });
          console.log(`  [➔ MOVED] #${ch.name} -> Moved inside "${targetCat.name}"`);
          movedCount++;
        } catch (e) {
          console.warn(`  [-] Failed to move #${ch.name}: ${e.message}`);
        }
      }

      console.log(`\n🏆 CATEGORY CONSOLIDATION COMPLETE IN [${guild.name}]! (Moved ${movedCount} orphan channels)\n\n`);
    }

    console.log('🏆 ALL SERVERS CONSOLIDATED: ALL CHANNELS ARE NOW INSIDE CATEGORIES!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
