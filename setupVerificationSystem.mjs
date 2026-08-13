import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405'; // KryloSMP
const KRYLO_EMOJI_ID = '1530370298262720722';
const KRYLO_EMOJI = `<:KryloSMP:${KRYLO_EMOJI_ID}>`;

// STARTER channels that unlock after verification (not everything!)
const starterChannelKeywords = [
  'rules', 'announcements', 'server-info', 'verify', 'general-chat',
  'bot-commands', 'starter-guide', 'ask-for-help', 'faq', 'socials',
  'store', 'players-online'
];

// ADVANCED channels that stay locked (need higher roles like Level 10, VIP, etc.)
// Everything NOT in starterChannelKeywords stays locked

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(guildId);
    console.log(`\n🚀 Rebuilding Verification System for: ${guild.name}...`);

    const channels = await guild.channels.fetch();

    // 1. Delete ALL bot messages from #verify
    const verifyChannel = channels.find(c => c && c.name && c.name.includes('verify') && c.isTextBased() && c.type !== ChannelType.GuildCategory);
    if (!verifyChannel) {
      console.error('No #verify channel found!');
      process.exit(1);
    }

    console.log(`Cleaning #${verifyChannel.name}...`);
    const msgs = await verifyChannel.messages.fetch({ limit: 100 });
    const botMsgs = msgs.filter(m => m.author.id === client.user.id);
    for (const m of botMsgs.values()) {
      await m.delete().catch(() => {});
    }
    console.log(`Deleted ${botMsgs.size} old bot messages.`);

    // 2. Ensure ✅ Verified role exists
    let verifiedRole = guild.roles.cache.find(r => r.name.includes('Verified'));
    if (!verifiedRole) {
      verifiedRole = await guild.roles.create({
        name: '✅ Verified Member',
        color: '#00ff88',
        hoist: false
      });
      console.log(`Created role: ${verifiedRole.name}`);
    }

    // 3. Set permissions: @everyone sees NOTHING except #verify and #rules
    const everyoneRole = guild.roles.everyone;

    for (const [cId, channel] of channels) {
      if (!channel || channel.type === ChannelType.GuildCategory) continue;

      const lowerName = channel.name.toLowerCase();
      const isVerifyOrRules = lowerName.includes('verify') || lowerName === 'rules' || lowerName.includes('welcome-and-rules') || lowerName === '📌┃rules';

      if (isVerifyOrRules) {
        // Everyone can SEE but not type in verify/rules
        await channel.permissionOverwrites.edit(everyoneRole, {
          ViewChannel: true, SendMessages: false, ReadMessageHistory: true
        }).catch(() => {});
        continue;
      }

      // Check if this is a STARTER channel
      const isStarter = starterChannelKeywords.some(kw => lowerName.includes(kw));

      if (isStarter) {
        // Hide from @everyone, show to ✅ Verified
        await channel.permissionOverwrites.edit(everyoneRole, { ViewChannel: false }).catch(() => {});
        await channel.permissionOverwrites.edit(verifiedRole, {
          ViewChannel: true, SendMessages: true, ReadMessageHistory: true
        }).catch(() => {});
      } else {
        // ADVANCED channels: hide from @everyone AND from ✅ Verified
        // These need Level 10+, VIP, PvP Specialist, etc.
        await channel.permissionOverwrites.edit(everyoneRole, { ViewChannel: false }).catch(() => {});
        // Don't give verified role access to advanced channels
      }
    }
    console.log(`✅ Channel permissions set! Starter channels unlock on verify, advanced channels need higher roles.`);

    // 4. Build the starter channel list
    const starterChannels = channels.filter(c => {
      if (!c || !c.isTextBased() || c.type === ChannelType.GuildCategory) return false;
      return starterChannelKeywords.some(kw => c.name.toLowerCase().includes(kw));
    });

    const advancedChannels = channels.filter(c => {
      if (!c || !c.isTextBased() || c.type === ChannelType.GuildCategory) return false;
      const lowerName = c.name.toLowerCase();
      if (lowerName.includes('verify') || lowerName.includes('rules')) return false;
      return !starterChannelKeywords.some(kw => lowerName.includes(kw));
    });

    // 5. Post the NEW verification embed
    const verifyEmbed = new EmbedBuilder()
      .setTitle(`${KRYLO_EMOJI} KRYLOSMP — VERIFICATION CENTER`)
      .setDescription(
        `Welcome to **KryloSMP**! ⚔️\n\n` +
        `To access the server, you must verify your account first.\n\n` +
        `**Click the ${KRYLO_EMOJI} button below to verify and unlock starter channels!**`
      )
      .addFields(
        {
          name: `${KRYLO_EMOJI} What You'll Unlock After Verifying`,
          value: starterChannels.map(c => `${KRYLO_EMOJI} <#${c.id}>`).join('\n') || 'Starter channels',
        },
        {
          name: `🔒 Advanced Channels (Earn Access!)`,
          value:
            `These channels require **activity & progression roles**:\n` +
            `• \`⚡ Level 10 Active\` → Unlocks PvP, trading, media channels\n` +
            `• \`🔥 Level 25 Veteran\` → Unlocks tournaments, bounties, quests\n` +
            `• \`🌟 Level 50 Legend\` → Unlocks ALL exclusive channels\n` +
            `• \`⚔️ PvP Specialist\` / \`🏰 Master Builder\` → Unlocks specialty zones`
        },
        {
          name: `📜 By Verifying You Agree To`,
          value:
            `• Follow all server rules in <#${channels.find(c => c?.name?.includes('rules'))?.id || '0'}>\n` +
            `• Respect all members and staff\n` +
            `• No spam, NSFW, or scam links\n` +
            `• Follow Discord Terms of Service`
        }
      )
      .setColor(0xFF0055)
      .setFooter({ text: `KryloSMP • Click the button below to start your journey!`, iconURL: guild.iconURL() })
      .setTimestamp();

    const verifyButton = new ButtonBuilder()
      .setCustomId('verify_member')
      .setLabel('Verify & Unlock Starter Channels!')
      .setStyle(ButtonStyle.Success)
      .setEmoji(KRYLO_EMOJI_ID);

    const row = new ActionRowBuilder().addComponents(verifyButton);

    await verifyChannel.send({ embeds: [verifyEmbed], components: [row] });
    console.log(`✅ New verification embed with ${KRYLO_EMOJI} button posted!`);

    // 6. Post the FULL channel map below (showing what's starter vs advanced)
    const mapEmbed = new EmbedBuilder()
      .setTitle(`${KRYLO_EMOJI} FULL SERVER CHANNEL MAP — KryloSMP`)
      .setDescription(`Here's everything available in KryloSMP.\n${KRYLO_EMOJI} = **Unlocked after verify** | 🔒 = **Earn through activity & roles**`)
      .setColor(0x00F2FF)
      .setFooter({ text: `KryloSMP • Verify above to start!`, iconURL: guild.iconURL() });

    const categories = channels.filter(c => c && c.type === ChannelType.GuildCategory);
    const textChannels = channels.filter(c => c && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    for (const [catId, cat] of categories) {
      const children = textChannels.filter(c => c.parentId === catId);
      if (children.size === 0) continue;

      const channelList = children.map(c => {
        const lowerName = c.name.toLowerCase();
        const isS = starterChannelKeywords.some(kw => lowerName.includes(kw));
        const isVerify = lowerName.includes('verify') || lowerName.includes('rules');
        if (isVerify) return `${KRYLO_EMOJI} <#${c.id}> *(visible now)*`;
        if (isS) return `${KRYLO_EMOJI} <#${c.id}>`;
        return `🔒 <#${c.id}>`;
      }).join('\n');

      if (channelList.length <= 1024) {
        mapEmbed.addFields({ name: `📁 ${cat.name}`, value: channelList, inline: false });
      }
    }

    // Uncategorized
    const uncategorized = textChannels.filter(c => !c.parentId);
    if (uncategorized.size > 0) {
      const uncatList = uncategorized.map(c => {
        const lowerName = c.name.toLowerCase();
        const isS = starterChannelKeywords.some(kw => lowerName.includes(kw));
        return isS ? `${KRYLO_EMOJI} <#${c.id}>` : `🔒 <#${c.id}>`;
      }).join('\n');
      if (uncatList.length <= 1024) {
        mapEmbed.addFields({ name: `📁 Uncategorized`, value: uncatList, inline: false });
      }
    }

    await verifyChannel.send({ embeds: [mapEmbed] });
    console.log(`✅ Full channel map with ${KRYLO_EMOJI} / 🔒 icons posted!`);

    console.log(`\n🏆 VERIFICATION SYSTEM REBUILT! Bot staying online for button clicks...`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }
});

// Handle verify button clicks
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== 'verify_member') return;

  const guild = interaction.guild;
  const member = interaction.member;

  try {
    let verifiedRole = guild.roles.cache.find(r => r.name.includes('Verified'));
    if (!verifiedRole) {
      await interaction.reply({ content: '❌ Verified role not found. Contact staff.', ephemeral: true });
      return;
    }

    if (member.roles.cache.has(verifiedRole.id)) {
      await interaction.reply({ content: `${KRYLO_EMOJI} You are already verified! Starter channels are unlocked for you.\n\n🔒 To unlock advanced channels, earn activity roles by chatting and participating!`, ephemeral: true });
      return;
    }

    await member.roles.add(verifiedRole);

    await interaction.reply({
      content:
        `${KRYLO_EMOJI} **Welcome to KryloSMP!** You are now verified!\n\n` +
        `🔓 **Starter channels unlocked!** Start chatting and playing!\n\n` +
        `🔒 **Want more?** Earn progression roles to unlock advanced channels:\n` +
        `• Chat actively → \`⚡ Level 10\` → more channels\n` +
        `• Keep going → \`🔥 Level 25\` → tournaments & economy\n` +
        `• Legend status → \`🌟 Level 50\` → everything unlocked!\n\n` +
        `Enjoy your stay! ⚔️`,
      ephemeral: true
    });

    console.log(`✅ Verified: ${member.user.tag}`);
  } catch (err) {
    console.error(`Verify error:`, err.message);
    await interaction.reply({ content: '❌ Error during verification. Try again or contact staff.', ephemeral: true }).catch(() => {});
  }
});

client.login(token);
