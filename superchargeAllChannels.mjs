import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405'; // KryloSMP Guild ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      console.error(`Guild ${guildId} not found!`);
      process.exit(1);
    }

    console.log(`🚀 Supercharging All Channels in ${guild.name}...`);

    // 1. Create New Feature Categories & Channels
    const categoriesData = [
      {
        name: '🎮 MINIGAMES & EVENTS',
        channels: [
          { name: '🎉┃daily-events', title: '🎉 Daily Events & Tournaments', desc: 'Check upcoming server events, parkour races, and boss fights!', color: 0xFFAA00 },
          { name: '🎲┃jackpot-and-spin', title: '🎲 Jackpot & Wheel of Fortune', desc: 'Use `/spin` and `/jackpot` to win in-game diamonds, netherite, and OP ranks!', color: 0x00F2FF },
          { name: '⚔️┃pvp-tournaments', title: '⚔️ 1v1 PvP Tournament Arena', desc: 'Join automated PvP tournaments! Use `/duel` to challenge players.', color: 0xFF0055 }
        ]
      },
      {
        name: '📜 QUESTS & ECONOMY',
        channels: [
          { name: '🎯┃daily-quests', title: '🎯 Daily Quests & Challenges', desc: 'Complete daily mining, killing, and crafting quests using `/quests` for double XP!', color: 0x00FF88 },
          { name: '💰┃bounty-board', title: '💰 Target Bounty Board', desc: 'Place bounties on rival players using `/bounty` and claim rewards upon elimination!', color: 0xFFAA00 },
          { name: '🏦┃bank-and-vault', title: '🏦 Bank & Vault System', desc: 'Deposit funds into the server bank vault to earn interest every 24 hours.', color: 0x0088FF }
        ]
      },
      {
        name: '🎬 MEDIA & CREATORS',
        channels: [
          { name: '🎥┃youtube-and-streams', title: '🎥 Creator Streams & Videos', desc: 'Share your YouTube videos and Twitch live streams recorded on KryloSMP!', color: 0xFF0000 },
          { name: '📸┃clips-and-highlights', title: '📸 Epic Clips & Clutch Plays', desc: 'Post short video clips of PvP clutches, base raids, and funny moments.', color: 0xAA00FF }
        ]
      },
      {
        name: '⚡ SYSTEM & NETWORK STATUS',
        channels: [
          { name: '🟢┃server-status', title: '🟢 24/7 Network Status & Uptime', desc: 'Live server telemetry, TPS monitor, and Pterodactyl node status.', color: 0x00FF88 },
          { name: '📊┃live-stats-tracker', title: '📊 Live Player Database & Leaderboards', desc: 'Inspect top player stats, playtime, and riched balances.', color: 0x00F2FF }
        ]
      }
    ];

    for (const catData of categoriesData) {
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

        // Post Feature Interactive Embed
        const embed = new EmbedBuilder()
          .setTitle(chData.title)
          .setDescription(chData.desc)
          .setColor(chData.color)
          .setFooter({ text: "KryloSMP Network • Powered by Krims Code AI", iconURL: guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("🛒 Server Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
          new ButtonBuilder().setLabel("💬 Main Discord").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
        );

        await textChan.send({ embeds: [embed], components: [row] }).catch(e => console.error(`Failed to send to ${chData.name}: ${e.message}`));
      }
    }

    console.log(`✅ ALL CHANNELS SUPERCHARGED WITH INTERACTIVE EMBEDS & BUTTONS!`);
  } catch (err) {
    console.error("Error supercharging channels:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
