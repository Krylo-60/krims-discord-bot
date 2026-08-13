import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';
const KEEP_ANNOUNCEMENT_ID = '1526685107044356198';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n🧹 Cleaning duplicate announcement channels in KryloSMP...`);
    const channels = await guild.channels.fetch();

    const announceChs = channels.filter(c => c && c.name && c.name.toLowerCase().includes('announcement') && c.id !== KEEP_ANNOUNCEMENT_ID);

    for (const [cId, ch] of announceChs) {
      try {
        await ch.delete('Deleting duplicate announcements channel');
        console.log(`✅ Deleted duplicate channel: #${ch.name} (ID: ${cId})`);
      } catch (e) {
        console.warn(`Could not delete #${ch.name}: ${e.message}`);
      }
    }

    console.log(`\n🏆 DUPLICATE ANNOUNCEMENT CHANNELS DELETED! Only 1 single official #announcements remains!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
