import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const serverIds = ['955159464435150930', '987363082147889192'];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  for (const id of serverIds) {
    try {
      const guild = await client.guilds.fetch(id);
      console.log(`\n📌 FOUND GUILD ${id}: ${guild.name}`);
      console.log(`- Member Count: ${guild.memberCount}`);
      console.log(`- Description: ${guild.description || 'None'}`);
      
      const channels = await guild.channels.fetch();
      console.log(`- Channels Count: ${channels.size}`);
      console.log(`- Channel Names:`, Array.from(channels.values()).map(c => c.name).slice(0, 15));
    } catch (err) {
      console.log(`\n⚠️ Bot cannot directly fetch Guild ${id} via API: ${err.message}`);
    }
  }
  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
