import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405']; // Krishiv Studios & KryloSMP

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\n🧹 STRICT DEEP CLEANUP & EXPANSION FOR: ${guild.name} (${guild.id})...`);
      const channels = await guild.channels.fetch();

      // 1. Strict Duplicate Detection Map
      const map = new Map();
      const idsToDelete = [];

      for (const [cId, channel] of channels) {
        if (channel.type === 4) continue; // Skip category headers for now

        // Normalize string: removing emojis, symbols, spaces, case
        const rawName = channel.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        if (!rawName) continue;

        if (map.has(rawName)) {
          const existing = map.get(rawName);
          // Prefer keeping the channel with fancy emoji/bracket formatting
          if (channel.name.includes('┃') || channel.name.includes('・') || channel.name.includes('👋') || channel.name.includes('📢')) {
            idsToDelete.push(existing.id);
            map.set(rawName, channel);
          } else {
            idsToDelete.push(channel.id);
          }
        } else {
          map.set(rawName, channel);
        }
      }

      console.log(`Found ${idsToDelete.length} duplicates to delete in ${guild.name}.`);

      for (const delId of idsToDelete) {
        try {
          const ch = guild.channels.cache.get(delId);
          if (ch) {
            console.log(`Deleting duplicate: #${ch.name} (${delId})`);
            await ch.delete('Strict duplicate cleanup');
          }
        } catch (e) {
          console.warn(`Could not delete #${delId}: ${e.message}`);
        }
      }

      // 2. Add New Categories: 🎁 PERKS & BOOSTERS and 💼 FREELANCE & COMMISSIONS
      const newCats = [
        {
          name: '╭── 🎁 Perks & Boosters ──',
          channels: [
            { name: '💎・booster-perks', title: '💎 Server Booster Exclusive Perks', desc: 'Custom roles, double XP, and exclusive chat access for Nitro Boosters!', color: 0xF47FFF },
            { name: '🎁・nitro-giveaways', title: '🎁 Exclusive Nitro & Rank Giveaways', desc: 'Monthly giveaways reserved for active server supporters.', color: 0xFFAA00 }
          ]
        },
        {
          name: '╭── 💼 Freelance & Agency ──',
          channels: [
            { name: '💼・hire-developers', title: '💼 Hire Krishiv Studios Developers', desc: 'Custom Discord bots, Minecraft Paper plugins, and Vercel web apps.', color: 0x00F2FF },
            { name: '📜・terms-of-service', title: '📜 Service Terms & Refund Policy', desc: 'Guaranteed 24-48 hour delivery and transparent revision policies.', color: 0x00FF88 }
          ]
        }
      ];

      for (const catData of newCats) {
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
            .setFooter({ text: `${guild.name} • Official Protocol`, iconURL: guild.iconURL() });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Portfolio Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
            new ButtonBuilder().setLabel("📝 Order Online").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
          );

          await textChan.send({ embeds: [embed], components: [row] }).catch(e => console.error(`Failed to send to #${chData.name}: ${e.message}`));
        }
      }

    } catch (err) {
      console.error(`Error processing guild ${gId}:`, err.message);
    }
  }

  console.log(`✅ STRICT DEEP CLEANUP & NEW CATEGORIES COMPLETE!`);
  client.destroy();
});

client.login(token);
