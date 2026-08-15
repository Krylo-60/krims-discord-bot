import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const TARGET_GUILD_ID = '1538225337048236082';

client.once('ready', async () => {
  console.log(`[+] Bot connected: ${client.user.tag}`);
  console.log(`[+] Fetching target guild: ${TARGET_GUILD_ID}...`);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID).catch(err => {
    console.error('Failed to fetch guild:', err.message);
    return null;
  });

  if (!guild) {
    console.error(`❌ Guild ${TARGET_GUILD_ID} not found! Check if bot was invited.`);
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`👑 TARGET GUILD: ${guild.name} (${guild.id})`);
  console.log(`========================================`);

  // 1. Delete all channels
  console.log('[+] Cleaning all channels and categories...');
  const channels = await guild.channels.fetch();
  for (const [, ch] of channels) {
    if (!ch) continue;
    try {
      console.log(`   [-] Deleting channel: ${ch.name} (${ch.type})`);
      await ch.delete();
    } catch (e) {
      console.log(`   Failed to delete ${ch.name}: ${e.message}`);
    }
  }

  // 2. Delete non-managed custom roles (except @everyone and bot managed role)
  console.log('[+] Cleaning roles...');
  const roles = await guild.roles.fetch();
  for (const [, r] of roles) {
    if (r.name === '@everyone' || r.managed) continue;
    try {
      console.log(`   [-] Deleting role: ${r.name}`);
      await r.delete();
    } catch (e) {
      console.log(`   Cannot delete role ${r.name}: ${e.message}`);
    }
  }

  console.log(`\n🎉 GUILD ${guild.name} (${guild.id}) IS NOW A 100% CLEAN BLANK SLATE!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
