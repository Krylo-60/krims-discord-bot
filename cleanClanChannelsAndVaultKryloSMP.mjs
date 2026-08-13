import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Clean KryloSMP Specific Clan Channels Script Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of guilds) {
      console.log(`🏰 PROCESSING CLAN CLEANUP FOR GUILD: ${guild.name} (${guild.id})...`);

      // 1. Find FACTIONS & CLANS category
      let clanCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && (c.name.includes('FACTIONS') || c.name.includes('CLANS')));

      // 2. Delete duplicate placeholder `#🏰-ksmp-clan-chat`
      const duplicateCh = guild.channels.cache.find(c => c.name.includes('ksmp-clan-chat'));
      if (duplicateCh) {
        try {
          await duplicateCh.delete('Deleting duplicate generic clan placeholder channel');
          console.log(`  🗑️ Deleted duplicate channel on [${guild.name}]: #${duplicateCh.name}`);
        } catch (e) {
          console.warn(`  [-] Could not delete: ${e.message}`);
        }
      }

      // 3. Move `#🏰-krylo-clan-chat` into `FACTIONS & CLANS` category
      const kryloClanCh = guild.channels.cache.find(c => c.name.includes('krylo-clan-chat'));
      if (kryloClanCh && clanCat) {
        try {
          await kryloClanCh.setParent(clanCat.id);
          console.log(`  📂 Moved #${kryloClanCh.name} into Category on [${guild.name}]: ${clanCat.name}`);
        } catch (e) {
          console.warn(`  [-] Could not move channel: ${e.message}`);
        }
      }
    }

    console.log('\n🏆 ALL CLAN CHANNELS CLEANED AND ORGANIZED ACROSS ALL GUILDS!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
