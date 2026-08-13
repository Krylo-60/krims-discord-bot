import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n🧹 CLEANING UP Krishiv Studios duplicate categories from KryloSMP...`);
    const channels = await guild.channels.fetch();

    const duplicateCategoryPrefixes = [
      '╭── 📚 Important ──',
      '╭── 🎨 Creator & Showcase ──',
      '╭── 📈 Interactive ──',
      '╭── 🎲 Extra Chats ──',
      '╭── 🎁 Perks & Boosters ──',
      '╭── 💼 Freelance & Agency ──'
    ];

    let deletedCats = 0;
    let deletedChs = 0;

    for (const [cId, channel] of channels) {
      if (!channel) continue;

      if (duplicateCategoryPrefixes.includes(channel.name)) {
        // Delete channels inside this duplicate category first
        const childChannels = channels.filter(c => c && c.parentId === channel.id);
        for (const [, child] of childChannels) {
          try {
            await child.delete('Cleaning duplicate category from KryloSMP');
            deletedChs++;
            console.log(`  - Deleted duplicate channel: #${child.name}`);
          } catch (e) {
            console.warn(`  ⚠️ Could not delete #${child.name}: ${e.message}`);
          }
        }

        // Delete category
        try {
          await channel.delete('Cleaning duplicate category from KryloSMP');
          deletedCats++;
          console.log(`  - Deleted duplicate category: ${channel.name}`);
        } catch (e) {
          console.warn(`  ⚠️ Could not delete category ${channel.name}: ${e.message}`);
        }
      }
    }

    console.log(`\n🏆 CLEANUP COMPLETE! Deleted ${deletedCats} duplicate categories and ${deletedChs} duplicate channels from KryloSMP!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
