import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    const storeCh = channels.find(c => c && c.name && c.name.includes('store'));

    if (storeCh) {
      const msg = await storeCh.messages.fetch('1528410261592215764');
      if (msg) {
        console.log("Found message! Updating embed and button...");
        const newEmbed = new EmbedBuilder()
          .setColor(0x00FF66)
          .setTitle('🛒 KryloSMP Official Webstore')
          .setDescription(
            "Support the development of **KryloSMP** and unlock exclusive perks, cosmetics, keys, and ranks!\n\n" +
            "🏆 **VIP Ranks:** Get special colored tags, extra homes, `/fly`, and custom cosmetics.\n" +
            "🔑 **Crate Keys:** Win rare gear, currency, and items in the spawn area.\n" +
            "🎨 **Custom Cosmetics:** Stand out with trails, hats, and particles!\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "🔗 **Webstore Link:** [krylosmp-store-website.vercel.app](https://krylosmp-store-website.vercel.app)\n" +
            "*Note: Purchases are processed instantly. Please ensure you are online in-game when purchasing!*"
          );
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Visit Webstore')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp-store-website.vercel.app')
        );
        
        await msg.edit({ embeds: [newEmbed], components: [row] });
        console.log("✓ Updated embed and link button in Discord channel!");
      }
    }
  } catch (err) {
    console.error("Failed to update message:", err.message);
  }
  client.destroy();
});

client.login(token);
