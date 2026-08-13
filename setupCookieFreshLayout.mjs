import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Apply to KryloSMP (1524878881918685405) and Krishiv Studios (1531792924055048292)
  const targetGuildIds = ['1524878881918685405', '1531792924055048292'];

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`🚀 Applying Cookie Army & FreshSMP Layout to Guild: ${guild.name} (${guild.id})...`);

      const categories = [
        {
          name: '╭── 📚 Important ──',
          channels: [
            { name: '📑・rules', title: '📑 Server Rules & Guidelines', desc: 'Official community rules and terms of service.', color: 0x00F2FF },
            { name: '🌍・roles', title: '🌍 Reaction & Self Roles', desc: 'Select your notification roles and playstyles.', color: 0xFFAA00 },
            { name: '❓・faq', title: '❓ Frequently Asked Questions', desc: 'Quick answers for connection IPs, Java & Bedrock ports, and store links.', color: 0x00FF88 },
            { name: '🎫・contact-staff', title: '🎫 Support & Staff Tickets', desc: 'Need help? Click below to trigger Krishiv\'s AI Support Agent!', color: 0x00F2FF }
          ]
        },
        {
          name: '╭── 🎨 Creator & Showcase ──',
          channels: [
            { name: '🔴・youtube', title: '🔴 YouTube & Content Alerts', desc: 'Featured videos and official media announcements.', color: 0xFF0000 },
            { name: '📸・fan-arts-and-setups', title: '🎨 Fan Art & Gaming Setups', desc: 'Share your artwork, video edits, and setup photos!', color: 0xAA00FF }
          ]
        },
        {
          name: '╭── 📈 Interactive ──',
          channels: [
            { name: '📊・polls', title: '📊 Community Polls & Feedback', desc: 'Vote on upcoming feature updates and game tweaks.', color: 0x00F2FF },
            { name: '🎊・giveaways', title: '🎊 Rank & Item Giveaways', desc: 'Participate in rank giveaways and lucky crates!', color: 0xFFAA00 },
            { name: '✨・suggestions', title: '✨ Feature Suggestions', desc: 'Submit your server ideas and feedback for the developers.', color: 0x00FF88 }
          ]
        },
        {
          name: '╭── 🎲 Extra Chats ──',
          channels: [
            { name: '🏡・minecraft', title: '🏡 Minecraft Discussion', desc: 'General chat for Minecraft survival and build strategies.', color: 0x00F2FF },
            { name: '😂・memes', title: '😂 Memes & Funny Content', desc: 'Post your favorite gaming memes and clips!', color: 0xFFAA00 }
          ]
        }
      ];

      for (const catData of categories) {
        let category = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
        if (!category) {
          category = await guild.channels.create({
            name: catData.name,
            type: ChannelType.GuildCategory
          });
          console.log(`Created Category: ${catData.name}`);
        }

        for (const chData of catData.channels) {
          let textChan = guild.channels.cache.find(c => c.name === chData.name && c.parentId === category.id);
          if (!textChan) {
            textChan = await guild.channels.create({
              name: chData.name,
              type: ChannelType.GuildText,
              parent: category.id
            });
            console.log(`Created Channel: #${chData.name}`);
          }

          const embed = new EmbedBuilder()
            .setTitle(chData.title)
            .setDescription(chData.desc)
            .setColor(chData.color)
            .setFooter({ text: `${guild.name} • Cookie & Fresh Engine`, iconURL: guild.iconURL() });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
            new ButtonBuilder().setLabel("💬 Main Discord").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
          );

          await textChan.send({ embeds: [embed], components: [row] }).catch(e => console.error(`Failed to send to ${chData.name}: ${e.message}`));
        }
      }
    } catch (err) {
      console.error(`Error processing guild ${gId}:`, err.message);
    }
  }

  console.log(`✅ COOKIE ARMY & FRESHSMP COMBINED LAYOUT DEPLOYED SUCCESSFULLY!`);
  client.destroy();
});

client.login(token);
