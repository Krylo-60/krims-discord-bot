import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = [
  '1524878881918685405', // KryloSMP
  '1532574925356007525', // Krylo Fan Army 👑
  '1531792924055048292'  // Krishiv Studios
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  console.log(`\n🏷️ ENFORCING OFFICIAL GUILD ANNOUNCEMENT (NEWS) CHANNELS WITH [SERVER] BADGES...`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\nProcessing server: "${guild.name}" (${guild.id})...`);
      const channels = await guild.channels.fetch();

      const announceChannels = channels.filter(c => c && c.isTextBased() && (c.name.includes('announcement') || c.name.includes('updates') || c.name.includes('youtube')) && c.type !== ChannelType.GuildCategory);

      for (const [, ch] of announceChannels) {
        if (ch.type !== ChannelType.GuildAnnouncement) {
          try {
            await ch.setType(ChannelType.GuildAnnouncement);
            console.log(`  ✅ Upgraded #${ch.name} to official Guild Announcement (News) channel!`);
          } catch (e) {
            console.warn(`  ⚠️ Could not setType for #${ch.name}: ${e.message}`);
          }
        } else {
          console.log(`  - #${ch.name} is already an official Guild Announcement channel.`);
        }

        // Crosspost recent messages to attach [SERVER] badge
        try {
          const msgs = await ch.messages.fetch({ limit: 10 });
          for (const msg of msgs.values()) {
            if (msg.crosspostable) {
              await msg.crosspost().catch(() => {});
              console.log(`  - Crossposted message ${msg.id} in #${ch.name} (Attached [SERVER] badge)`);
            }
          }
        } catch (e) {}
      }

    } catch (err) {
      console.error(`Error processing guild ${gId}:`, err.message);
    }
  }

  console.log(`\n🏆 OFFICIAL GUILD ANNOUNCEMENT CHANNELS & [SERVER] BADGES ENFORCED!`);
  client.destroy();
});

client.login(token);
