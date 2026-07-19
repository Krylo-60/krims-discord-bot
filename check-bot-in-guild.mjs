import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      console.log(`[-] Bot is NOT in the Guild ${guildId}! It needs to be invited to the server!`);
      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
      console.log(`Invite link for the bot: ${inviteUrl}`);
    } else {
      console.log(`[+] Bot is IN the Guild: ${guild.name} (${guild.id})`);
      const botMember = await guild.members.fetch(client.user.id).catch(() => null);
      if (botMember) {
        console.log(`Bot Roles: ${botMember.roles.cache.map(r => r.name).join(', ')}`);
        console.log(`Bot Permissions (Admin?): ${botMember.permissions.has('Administrator')}`);
      } else {
        console.log(`[-] Failed to fetch bot member info in the guild.`);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
