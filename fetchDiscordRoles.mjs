import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = '1524878881918685405';

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const roles = await guild.roles.fetch();
    
    console.log(`=== ALL ROLES IN ${guild.name} (${roles.size} ROLES) ===`);
    const sorted = Array.from(roles.values()).sort((a, b) => b.position - a.position);
    sorted.forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.name}] - Color: #${r.color.toString(16).padStart(6, '0')} - Hoist: ${r.hoist} - Pos: ${r.position}`);
    });
  } catch (err) {
    console.error('Error fetching roles:', err.message);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
