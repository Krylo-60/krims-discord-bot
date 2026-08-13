import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildId = process.argv[2] || '1420991845546332162'; // Pass target Guild ID as argument

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(targetGuildId);
    if (!guild) {
      console.error(`Guild ${targetGuildId} not found! Make sure the bot is invited to the server first.`);
      process.exit(1);
    }

    console.log(`🚀 Starting Automatic Server Setup for "Krishiv Studios" in Guild: ${guild.name} (${guild.id})...`);

    // 1. Category: 📌 INFORMATION
    const infoCat = await guild.channels.create({
      name: '📌 INFORMATION',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '👋┃welcome-and-rules',
      type: ChannelType.GuildText,
      parent: infoCat.id
    });

    await guild.channels.create({
      name: '📢┃announcements',
      type: ChannelType.GuildText,
      parent: infoCat.id
    });

    await guild.channels.create({
      name: '🚀┃portfolio-showcase',
      type: ChannelType.GuildText,
      parent: infoCat.id
    });

    await guild.channels.create({
      name: '💳┃pricing-and-services',
      type: ChannelType.GuildText,
      parent: infoCat.id
    });

    // 2. Category: 💼 CLIENT SERVICES & TICKETS
    const clientCat = await guild.channels.create({
      name: '💼 CLIENT SERVICES',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '🎫┃order-a-bot-ticket',
      type: ChannelType.GuildText,
      parent: clientCat.id
    });

    await guild.channels.create({
      name: '⭐┃client-reviews',
      type: ChannelType.GuildText,
      parent: clientCat.id
    });

    await guild.channels.create({
      name: '❓┃faq-support',
      type: ChannelType.GuildText,
      parent: clientCat.id
    });

    // 3. Category: 💬 COMMUNITY LOUNGE
    const commCat = await guild.channels.create({
      name: '💬 COMMUNITY LOUNGE',
      type: ChannelType.GuildCategory
    });

    await guild.channels.create({
      name: '💬┃general-chat',
      type: ChannelType.GuildText,
      parent: commCat.id
    });

    await guild.channels.create({
      name: '🤖┃bot-commands',
      type: ChannelType.GuildText,
      parent: commCat.id
    });

    await guild.channels.create({
      name: '🔊┃Client Lounge',
      type: ChannelType.GuildVoice,
      parent: commCat.id
    });

    console.log(`✅ SUCCESS! All categories and channels for "Krishiv Studios" have been automatically created by Krims Code AI!`);
  } catch (err) {
    console.error("Error setting up server:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
