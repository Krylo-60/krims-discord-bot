import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 REMOVE DUPLICATE & CLUTTER CHANNELS WITH NEW MESSAGES (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Channel Purge Auditor Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of guilds) {
      console.log(`=======================================================`);
      console.log(`🧹 REMOVING CLUTTER & DUPLICATE CHANNELS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const textChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.type === ChannelType.GuildText);

      // Duplicate names mapping to find legacy ones
      const nameMap = new Map();
      for (const ch of textChannels) {
        const cleanName = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!nameMap.has(cleanName)) {
          nameMap.set(cleanName, []);
        }
        nameMap.get(cleanName).push(ch);
      }

      let deletedCount = 0;

      for (const [key, chList] of nameMap.entries()) {
        if (chList.length > 1) {
          // Sort by creation timestamp (older legacy channels first)
          chList.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          
          // Delete older legacy channel(s) that contain clutter/messages
          for (let i = 0; i < chList.length - 1; i++) {
            const legacyCh = chList[i];
            try {
              const msgs = await legacyCh.messages.fetch({ limit: 10 }).catch(() => null);
              const msgCount = msgs ? msgs.size : 0;
              
              await legacyCh.delete(`Cleaning legacy duplicate channel #${legacyCh.name} with ${msgCount} clutter messages`);
              deletedCount++;
              console.log(`  🗑️ Deleted Legacy Duplicate Channel: #${legacyCh.name} (${msgCount} messages deleted)`);
            } catch (e) {
              console.warn(`  [-] Could not delete #${legacyCh.name}: ${e.message}`);
            }
          }
        }
      }

      console.log(`\n🏆 TOTAL DUPLICATE CHANNELS CLEANED IN [${guild.name}]: ${deletedCount} CHANNELS!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
