import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🧹 REMOVE DUPLICATE LEGACY VOICE CHANNELS (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Voice Channels Purge Auditor Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of guilds) {
      console.log(`=======================================================`);
      console.log(`🧹 REMOVING DUPLICATE VOICE CHANNELS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const voiceChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.type === ChannelType.GuildVoice);

      const nameMap = new Map();
      for (const ch of voiceChannels) {
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

          // Delete older legacy voice channel(s) outside pro category
          for (let i = 0; i < chList.length - 1; i++) {
            const legacyVoiceCh = chList[i];
            try {
              const parentName = legacyVoiceCh.parent ? legacyVoiceCh.parent.name : 'Uncategorized';
              await legacyVoiceCh.delete(`Cleaning legacy duplicate voice channel #${legacyVoiceCh.name}`);
              deletedCount++;
              console.log(`  🗑️ Deleted Legacy Duplicate Voice Channel: #${legacyVoiceCh.name} (Category: "${parentName}")`);
            } catch (e) {
              console.warn(`  [-] Could not delete #${legacyVoiceCh.name}: ${e.message}`);
            }
          }
        }
      }

      console.log(`\n🏆 TOTAL DUPLICATE VOICE CHANNELS CLEANED IN [${guild.name}]: ${deletedCount} CHANNELS!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
