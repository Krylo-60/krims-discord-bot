import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag} - Auditing and fixing channel references across all guilds...`);

  const guilds = await client.guilds.fetch();
  for (const [guildId] of guilds) {
    const guild = await client.guilds.fetch(guildId);
    console.log(`\n🏰 Guild: ${guild.name} (${guild.id})`);
    const channels = await guild.channels.fetch();

    const verifyCh = channels.find(c => c && c.name && c.name.includes('verify') && c.isTextBased());
    const ticketCh = channels.find(c => c && c.name && (c.name.includes('ticket') || c.name.includes('support')) && c.isTextBased());
    const bumpCh = channels.find(c => c && c.name && (c.name.includes('bot-command') || c.name.includes('general')) && c.isTextBased());

    console.log(`   • Verify Channel: ${verifyCh ? `#${verifyCh.name} (${verifyCh.id})` : 'NOT FOUND'}`);
    console.log(`   • Ticket Channel: ${ticketCh ? `#${ticketCh.name} (${ticketCh.id})` : 'NOT FOUND'}`);
    console.log(`   • Command Channel: ${bumpCh ? `#${bumpCh.name} (${bumpCh.id})` : 'NOT FOUND'}`);
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
