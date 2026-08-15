import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const GUILD_ID = '1538225337048236082';

client.once('ready', async () => {
  console.log(`[+] Bot connected: ${client.user.tag}`);
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);

  if (!guild) {
    console.error('❌ Guild not found!');
    process.exit(1);
  }

  console.log(`\n👑 Setting up '🤖 Bots' Role for: ${guild.name}`);

  let botRole = guild.roles.cache.find(r => r.name.toLowerCase() === '🤖 bots' || r.name.toLowerCase() === 'bots');
  if (!botRole) {
    botRole = await guild.roles.create({
      name: '🤖 Bots',
      color: 0x5865F2, // Discord Blurple
      hoist: true,
      mentionable: false,
      reason: 'KryloSMP Beta Release bot role setup'
    }).catch(err => {
      console.log('Error creating Bots role:', err.message);
      return null;
    });
  }

  if (botRole) {
    console.log(`✅ Role ready: ${botRole.name} (Color: #${botRole.color.toString(16).padStart(6, '0').toUpperCase()})`);

    // Fetch members and assign to all bots
    const members = await guild.members.fetch();
    for (const [, member] of members) {
      if (member.user.bot) {
        await member.roles.add(botRole).catch(() => {});
        console.log(`   [+] Assigned '🤖 Bots' role to: ${member.user.tag}`);
      }
    }
  }

  console.log(`\n🎉 '🤖 Bots' ROLE CONFIGURED AND ASSIGNED!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
