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
  
  console.log(`Channel 1: ${ch1 ? ch1.name : 'None'}`);
  console.log(`Channel 2: ${ch2 ? ch2.name : 'None'}`);
  
  if (ch1 && ch2) {
    const msgs1 = await ch1.messages.fetch({ limit: 5 }).catch(() => new Map());
    const msgs2 = await ch2.messages.fetch({ limit: 5 }).catch(() => new Map());
    console.log(`Msgs in ch1: ${msgs1.size}, Msgs in ch2: ${msgs2.size}`);
    
    // If ch1 is the older default general chat and ch2 is empty, delete duplicate ch2
    if (msgs2.size === 0) {
      await ch2.delete('Removing duplicate general-chat');
      console.log('Deleted duplicate empty channel ch2');
    }
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
