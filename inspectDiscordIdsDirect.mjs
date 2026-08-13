import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const targetIds = [
  '1533156320021053621',
  '987363082147889192',
  '858402547249315841',
  '1462963503689371805'
];

client.once('ready', async () => {
  console.log('[+] Instant Direct Inspector Online as ' + client.user.tag + '\n');

  for (const id of targetIds) {
    try {
      // 1. Try finding as Guild
      const guild = client.guilds.cache.get(id) || await client.guilds.fetch(id).catch(() => null);
      if (guild) {
        console.log(`🏰 GUILD FOUND [${id}]:`);
        console.log(`   • Server Name: "${guild.name}"`);
        console.log(`   • Member Count: ${guild.memberCount}`);
        console.log(`   • Owner ID: ${guild.ownerId}\n`);
        continue;
      }

      // 2. Try finding as Channel across all guilds
      let foundChannel = null;
      for (const g of client.guilds.cache.values()) {
        const ch = g.channels.cache.get(id) || await g.channels.fetch(id).catch(() => null);
        if (ch) {
          foundChannel = { ch, guild: g };
          break;
        }
      }

      if (foundChannel) {
        console.log(`💬 CHANNEL FOUND [${id}]:`);
        console.log(`   • Channel Name: #${foundChannel.ch.name}`);
        console.log(`   • Channel Type: ${foundChannel.ch.type}`);
        console.log(`   • Belongs to Server: "${foundChannel.guild.name}" (${foundChannel.guild.id})\n`);
        continue;
      }

      // 3. Try finding as User
      const user = await client.users.fetch(id).catch(() => null);
      if (user) {
        console.log(`👤 USER/BOT FOUND [${id}]:`);
        console.log(`   • Username: ${user.tag}`);
        console.log(`   • Is Bot: ${user.bot}\n`);
        continue;
      }

      console.log(`❓ ID [${id}]: External Discord ID / Not accessible directly by bot.\n`);
    } catch (e) {
      console.warn(`[-] Error inspecting ID ${id}: ${e.message}`);
    }
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
