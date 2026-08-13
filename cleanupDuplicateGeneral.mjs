import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  const guild = await client.guilds.fetch('1420991845546332162');
  const ch1 = await guild.channels.fetch('1420991846502498366').catch(() => null);
  const ch2 = await guild.channels.fetch('1537229770482257930').catch(() => null);
  
  if (ch1) {
    const msgs1 = await ch1.messages.fetch({ limit: 5 });
    console.log('Ch1 messages:');
    msgs1.forEach(m => console.log(`  [${m.author.username}]: ${m.content}`));
  }
  if (ch2) {
    const msgs2 = await ch2.messages.fetch({ limit: 5 });
    console.log('Ch2 messages:');
    msgs2.forEach(m => console.log(`  [${m.author.username}]: ${m.content}`));
  }
  
  // Clean up duplicate ch2
  if (ch2) {
    await ch2.delete('Cleaning duplicate');
    console.log('Deleted ch2');
  }
  if (ch1 && ch1.name !== '💬┃general-chat') {
    await ch1.setName('💬┃general-chat');
    console.log('Renamed ch1 to 💬┃general-chat');
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
