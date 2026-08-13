import { Client, GatewayIntentBits, REST, Routes, PermissionFlagsBits, ChannelType } from 'discord.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405'];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

function snowflake() {
  // Generate a fake snowflake-like ID for onboarding prompt/option IDs
  return String(BigInt(Date.now()) * 1000000n + BigInt(Math.floor(Math.random() * 999999)));
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(token);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\n🚀 Onboarding & Guide Setup for: ${guild.name} (${guild.id})...`);

      const channels = await guild.channels.fetch();

      const findChannel = (keywords) => {
        for (const kw of keywords) {
          const found = channels.find(c => c && c.name && c.name.toLowerCase().includes(kw) && c.isTextBased() && c.type !== ChannelType.GuildCategory);
          if (found) return found;
        }
        return null;
      };

      const rulesChannel = findChannel(['rules', 'welcome']);
      const generalChannel = findChannel(['general-chat', 'general']);
      const announcementsChannel = findChannel(['announcements']);
      const faqChannel = findChannel(['faq']);
      const rolesChannel = findChannel(['roles', 'verify']);
      const botCommandsChannel = findChannel(['bot-commands', 'commands']);
      const showcaseChannel = findChannel(['showcase', 'portfolio', 'build-showcase']);
      const giveawaysChannel = findChannel(['giveaway']);

      // Ensure key welcome screen channels are readable by @everyone
      const everyoneRole = guild.roles.everyone;
      const channelsToFix = [rulesChannel, generalChannel, announcementsChannel, faqChannel, rolesChannel].filter(Boolean);
      
      for (const ch of channelsToFix) {
        try {
          await ch.permissionOverwrites.edit(everyoneRole, {
            ViewChannel: true,
            ReadMessageHistory: true
          });
        } catch (e) {
          // Ignore permission errors
        }
      }

      const defaultChannelIds = channelsToFix.map(c => c.id);
      if (botCommandsChannel) defaultChannelIds.push(botCommandsChannel.id);

      console.log(`Default channels: ${defaultChannelIds.length}`);

      // 1. Welcome Screen
      try {
        const welcomeChannels = [];
        if (rulesChannel) welcomeChannels.push({ channel_id: rulesChannel.id, description: "📑 Read the server rules before chatting", emoji_name: "📑" });
        if (generalChannel) welcomeChannels.push({ channel_id: generalChannel.id, description: "💬 Start chatting with the community", emoji_name: "💬" });
        if (announcementsChannel) welcomeChannels.push({ channel_id: announcementsChannel.id, description: "📢 Stay updated with official news", emoji_name: "📢" });
        if (faqChannel) welcomeChannels.push({ channel_id: faqChannel.id, description: "❓ Find quick answers to common questions", emoji_name: "❓" });
        if (rolesChannel) welcomeChannels.push({ channel_id: rolesChannel.id, description: "🌍 Pick your notification and gaming roles", emoji_name: "🌍" });

        const desc = guild.id === '1531792924055048292'
          ? "Welcome to Krishiv Studios! 🚀 Custom Discord bots, Minecraft plugins, and SaaS products built by Krishiv PB."
          : "Welcome to KryloSMP! ⚔️ The ultimate Minecraft survival experience with custom plugins, economy, and PvP.";

        await rest.patch(Routes.guildWelcomeScreen(gId), {
          body: { enabled: true, description: desc, welcome_channels: welcomeChannels }
        });
        console.log(`✅ Welcome Screen configured with ${welcomeChannels.length} channels!`);
      } catch (e) {
        console.warn(`⚠️ Welcome Screen: ${e.message}`);
      }

      // 2. Onboarding with proper IDs - use PUT to fully replace
      try {
        // First fetch existing onboarding to get structure
        let existingOnboarding;
        try {
          existingOnboarding = await rest.get(Routes.guildOnboarding(gId));
        } catch (e) {
          existingOnboarding = null;
        }

        const prompt1Id = snowflake();
        const prompt2Id = snowflake();

        const prompt1Options = [];
        if (generalChannel) {
          prompt1Options.push({ id: snowflake(), title: "💬 Just hanging out & chatting", description: "Join the community conversation", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "💬" } });
        }
        if (showcaseChannel) {
          prompt1Options.push({ id: snowflake(), title: "🎨 Checking out builds & projects", description: "See amazing creations", channel_ids: [showcaseChannel.id], role_ids: [], emoji: { name: "🎨" } });
        }
        if (botCommandsChannel) {
          prompt1Options.push({ id: snowflake(), title: "🤖 Using bot commands & features", description: "Economy, duels, and mini-games", channel_ids: [botCommandsChannel.id], role_ids: [], emoji: { name: "🤖" } });
        }
        if (giveawaysChannel) {
          prompt1Options.push({ id: snowflake(), title: "🎁 Joining giveaways & events", description: "Win free ranks, items, and Nitro", channel_ids: [giveawaysChannel.id], role_ids: [], emoji: { name: "🎁" } });
        }

        // Ensure we have at least 2 options
        if (prompt1Options.length < 2 && generalChannel) {
          prompt1Options.push({ id: snowflake(), title: "🌐 Exploring the server", description: "Just looking around!", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "🌐" } });
        }

        const prompt2Options = [];
        if (generalChannel) {
          prompt2Options.push({ id: snowflake(), title: "☕ Java Edition", description: "I play Minecraft Java Edition", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "☕" } });
          prompt2Options.push({ id: snowflake(), title: "📱 Bedrock Edition", description: "I play Minecraft Bedrock Edition", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "📱" } });
          prompt2Options.push({ id: snowflake(), title: "🖥️ I don't play Minecraft", description: "I'm here for other reasons", channel_ids: [generalChannel.id], role_ids: [], emoji: { name: "🖥️" } });
        }

        const prompts = [];
        if (prompt1Options.length >= 2) {
          prompts.push({
            id: prompt1Id,
            title: "What brings you to our server? 🎯",
            options: prompt1Options,
            single_select: false,
            required: true,
            in_onboarding: true,
            type: 0
          });
        }
        if (prompt2Options.length >= 2) {
          prompts.push({
            id: prompt2Id,
            title: "What platform do you play on? 🎮",
            options: prompt2Options,
            single_select: true,
            required: false,
            in_onboarding: true,
            type: 0
          });
        }

        if (prompts.length > 0) {
          await rest.put(Routes.guildOnboarding(gId), {
            body: {
              prompts: prompts,
              default_channel_ids: defaultChannelIds,
              enabled: true,
              mode: 0
            }
          });
          console.log(`✅ Onboarding configured with ${prompts.length} prompts!`);
        }
      } catch (e) {
        console.warn(`⚠️ Onboarding: ${e.message}`);
      }

      // 3. System channel
      try {
        if (rulesChannel) {
          await guild.edit({ systemChannel: rulesChannel.id, systemChannelFlags: 0 });
          console.log(`✅ System channel set to #${rulesChannel.name}!`);
        }
      } catch (e) {
        console.warn(`⚠️ System channel: ${e.message}`);
      }

    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  console.log(`\n✅ ALL ONBOARDING, WELCOME SCREEN & SERVER GUIDE SETUP COMPLETE!`);
  client.destroy();
});

client.login(token);
