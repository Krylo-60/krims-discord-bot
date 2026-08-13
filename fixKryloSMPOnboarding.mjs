import { Client, GatewayIntentBits, REST, Routes, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405'; // KryloSMP

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

function snowflake() {
  return String(BigInt(Date.now()) * 1000000n + BigInt(Math.floor(Math.random() * 999999)));
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    const guild = await client.guilds.fetch(guildId);
    console.log(`\n🚀 Fixing KryloSMP Onboarding...`);

    const channels = await guild.channels.fetch();
    const everyoneRole = guild.roles.everyone;

    // Fix ALL text channels to be readable by @everyone
    for (const [cId, channel] of channels) {
      if (!channel || channel.type === ChannelType.GuildCategory) continue;
      if (!channel.isTextBased()) continue;

      try {
        await channel.permissionOverwrites.edit(everyoneRole, {
          ViewChannel: true,
          ReadMessageHistory: true,
          SendMessages: true
        });
      } catch (e) {
        // Ignore
      }
    }
    console.log(`✅ Fixed @everyone permissions on all text channels.`);

    // Find channels
    const findChannel = (keywords) => {
      for (const kw of keywords) {
        const found = channels.find(c => c && c.name && c.name.toLowerCase().includes(kw) && c.isTextBased() && c.type !== ChannelType.GuildCategory);
        if (found) return found;
      }
      return null;
    };

    const rulesChannel = findChannel(['rules']);
    const generalChannel = findChannel(['general-chat', 'general']);
    const announcementsChannel = findChannel(['announcements']);
    const faqChannel = findChannel(['faq']);
    const rolesChannel = findChannel(['verify', 'roles']);
    const botCommandsChannel = findChannel(['bot-commands', 'commands']);
    const showcaseChannel = findChannel(['build-showcase', 'showcase']);
    const giveawaysChannel = findChannel(['giveaway']);
    const pvpChannel = findChannel(['pvp']);

    const defaultChannelIds = [rulesChannel, generalChannel, announcementsChannel, faqChannel, rolesChannel, botCommandsChannel].filter(Boolean).map(c => c.id);

    // Onboarding
    const prompt1Options = [];
    if (generalChannel) prompt1Options.push({ id: snowflake(), title: "💬 Chatting & community", description: "Join survival discussions", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "💬" } });
    if (showcaseChannel) prompt1Options.push({ id: snowflake(), title: "🏰 Building & creating", description: "Show off your mega-builds", channel_ids: [showcaseChannel.id], role_ids: [], emoji: { name: "🏰" } });
    if (pvpChannel) prompt1Options.push({ id: snowflake(), title: "⚔️ PvP & competitive play", description: "Duels, clans, and tournaments", channel_ids: [pvpChannel.id], role_ids: [], emoji: { name: "⚔️" } });
    if (giveawaysChannel) prompt1Options.push({ id: snowflake(), title: "🎁 Giveaways & events", description: "Win ranks, items, and prizes", channel_ids: [giveawaysChannel.id], role_ids: [], emoji: { name: "🎁" } });

    if (prompt1Options.length < 2 && generalChannel) {
      prompt1Options.push({ id: snowflake(), title: "🌐 Exploring the server", description: "Just looking around!", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "🌐" } });
    }

    const prompt2Options = [];
    if (generalChannel) {
      prompt2Options.push({ id: snowflake(), title: "☕ Java Edition", description: "I play Java", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "☕" } });
      prompt2Options.push({ id: snowflake(), title: "📱 Bedrock Edition", description: "I play Bedrock", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "📱" } });
      prompt2Options.push({ id: snowflake(), title: "🖥️ Both / Other", description: "Both or just here to hang", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "🖥️" } });
    }

    const prompts = [];
    if (prompt1Options.length >= 2) {
      prompts.push({ id: snowflake(), title: "What brings you to KryloSMP? 🎯", options: prompt1Options, single_select: false, required: true, in_onboarding: true, type: 0 });
    }
    if (prompt2Options.length >= 2) {
      prompts.push({ id: snowflake(), title: "What platform do you play on? 🎮", options: prompt2Options, single_select: true, required: false, in_onboarding: true, type: 0 });
    }

    if (prompts.length > 0) {
      await rest.put(Routes.guildOnboarding(guildId), {
        body: { prompts, default_channel_ids: defaultChannelIds, enabled: true, mode: 0 }
      });
      console.log(`✅ KryloSMP Onboarding configured with ${prompts.length} prompts!`);
    }

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  console.log(`\n✅ KRYLOSMP ONBOARDING FIX COMPLETE!`);
  client.destroy();
});

client.login(token);
