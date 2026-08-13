import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
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

    console.log(`🚀 Creating Player-Type Categories in ${guild.name}...`);

    // 1. Category: ⚔️ PVP & COMPETITIVE PLAYERS
    const pvpCat = await guild.channels.create({
      name: '⚔️ PVP & COMPETITIVE',
      type: ChannelType.GuildCategory
    });

    const pvpChan = await guild.channels.create({
      name: '⚔️┃pvp-arena-chat',
      type: ChannelType.GuildText,
      parent: pvpCat.id
    });

    await guild.channels.create({
      name: '🏆┃duels-leaderboard',
      type: ChannelType.GuildText,
      parent: pvpCat.id
    });

    await guild.channels.create({
      name: '🛡️┃clan-recruitment',
      type: ChannelType.GuildText,
      parent: pvpCat.id
    });

    // Send Welcome Embed to PvP Channel
    const pvpEmbed = new EmbedBuilder()
      .setTitle("⚔️ PvP & Competitive Player Hub")
      .setDescription("Welcome, warriors! Discuss arena strategies, recruit for your clan (`/clan`), and challenge players to duels (`/duel`).")
      .setColor(0xFF0055);
    await pvpChan.send({ embeds: [pvpEmbed] });

    // 2. Category: 🏰 BUILDERS & CREATORS
    const buildCat = await guild.channels.create({
      name: '🏰 BUILDERS & CREATORS',
      type: ChannelType.GuildCategory
    });

    const buildChan = await guild.channels.create({
      name: '🎨┃build-showcase',
      type: ChannelType.GuildText,
      parent: buildCat.id
    });

    await guild.channels.create({
      name: '💡┃redstone-and-blueprints',
      type: ChannelType.GuildText,
      parent: buildCat.id
    });

    // Send Welcome Embed to Builder Channel
    const buildEmbed = new EmbedBuilder()
      .setTitle("🏰 Builder & Creator Studio")
      .setDescription("Share your epic mega-build screenshots, redstone contraptions, and base designs here!")
      .setColor(0x00F2FF);
    await buildChan.send({ embeds: [buildEmbed] });

    // 3. Category: 💰 SURVIVAL & TRADERS
    const tradeCat = await guild.channels.create({
      name: '💰 SURVIVAL & TRADERS',
      type: ChannelType.GuildCategory
    });

    const tradeChan = await guild.channels.create({
      name: '🏪┃player-shops',
      type: ChannelType.GuildText,
      parent: tradeCat.id
    });

    await guild.channels.create({
      name: '💎┃marketplace-trading',
      type: ChannelType.GuildText,
      parent: tradeCat.id
    });

    // Send Welcome Embed to Trading Channel
    const tradeEmbed = new EmbedBuilder()
      .setTitle("💰 Survival & Economy Marketplace")
      .setDescription("Advertise your in-game player shop coordinates (`/shop`), trade rare items, and view server riched lists (`/baltop`).")
      .setColor(0xFFAA00);
    await tradeChan.send({ embeds: [tradeEmbed] });

    // 4. Category: 🐣 NEW PLAYERS & BEGINNERS
    const newCat = await guild.channels.create({
      name: '🐣 NEW PLAYERS',
      type: ChannelType.GuildCategory
    });

    const newChan = await guild.channels.create({
      name: '📜┃starter-guide',
      type: ChannelType.GuildText,
      parent: newCat.id
    });

    await guild.channels.create({
      name: '❓┃ask-for-help',
      type: ChannelType.GuildText,
      parent: newCat.id
    });

    // Send Welcome Embed to Starter Guide Channel
    const newEmbed = new EmbedBuilder()
      .setTitle("🐣 New Player Orientation")
      .setDescription("New to KryloSMP? Use `/bday` for rewards, claiming land, and linking your Discord account!")
      .setColor(0x00FF88);
    await newChan.send({ embeds: [newEmbed] });

    console.log(`✅ SUCCESS! All player-type categories and channels created!`);
  } catch (err) {
    console.error("Error creating player categories:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
