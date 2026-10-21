import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits 
} from 'discord.js';
import { addPersistentUpdate, syncPersistentUpdateToDiscord } from './persistentUpdatesManager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INCUBATOR_FILE = path.resolve(__dirname, '../data/beta_incubator.json');

export const AI_LAB_CHANNEL_ID = '1561175639606693929'; // #🧠・𝖠i-𝖫ab
export const BETA_TESTER_ROLE_ID = '1561175614008991746'; // 🧪 Beta Tester
export const DEV_ROLE_ID = '1561181304115044424'; // 💻 Bot Developer
export const EXECUTIVE_ROLE_ID = '1561175610930233464'; // 👑 Krims Executive
export const BOT_UPDATES_CHANNEL_ID = '1561175627799994402'; // #🚀・𝖡ot-𝖴pdates

/**
 * Weekly Beta Feature Pipeline Catalog
 */
const FEATURE_PIPELINE = [
  {
    id: 'feat_code_sandbox',
    title: 'Code Sandbox & Safe Terminal Runner',
    versionTag: 'v3.1-beta.1',
    category: 'Developer Tools',
    summary: 'Isolated sandboxed runtime allowing developers to test JavaScript and Python code snippets directly in Discord with syntax-highlighted terminal outputs.',
    instructions: 'Use `/sandbox language:javascript code:"console.log(2+2)"` or `!sandbox <code>` in this channel to execute test snippets.',
    testCommands: ['/sandbox', '!sandbox'],
    highlights: [
      '⚡ Zero-latency isolated sandbox for instant script execution',
      '🔒 Multi-layered memory & execution timeout protection (max 3s)',
      '📊 Execution time, memory footprint, and standard output telemetry'
    ]
  },
  {
    id: 'feat_voice_transcribe',
    title: 'Neural Voice Note Transcriber & Audio Summarizer',
    versionTag: 'v3.1-beta.2',
    category: 'Audio & Accessibility',
    summary: 'Autonomous speech-to-text listener that converts Discord voice messages into clean formatted text summaries with bullet points.',
    instructions: 'Reply to any voice message with `!transcribe` or use `/transcribe` in this channel.',
    testCommands: ['/transcribe', '!transcribe'],
    highlights: [
      '🎙️ Multi-lingual speech recognition and automated punctuation',
      '📝 Generates 3-bullet executive summary of long audio clips',
      '⚡ 100% private in-memory transcription with zero audio storage'
    ]
  },
  {
    id: 'feat_ai_trivia',
    title: 'Adaptive AI Trivia & Community Quiz Host',
    versionTag: 'v3.1-beta.3',
    category: 'Engagement & Games',
    summary: 'Autonomous interactive trivia host that dynamically drafts questions based on server interests, tracks fast responses, and rewards winner XP.',
    instructions: 'Run `/quiz category:gaming` or `!quiz` in this channel to launch a 3-question testing round.',
    testCommands: ['/quiz', '!quiz'],
    highlights: [
      '🧠 Unlimited dynamic AI questions spanning Coding, Gaming, and Science',
      '⏱️ 15-second rapid-fire button selection mode',
      '🏆 Direct integration with Krims 2.0x Leveling & Leaderboards'
    ]
  },
  {
    id: 'feat_threat_scanner',
    title: 'Autonomous Web Threat & Malicious Link Scanner',
    versionTag: 'v3.1-beta.4',
    category: 'Security & AutoMod',
    summary: 'Real-time URL reputation and safety scanner that analyzes links posted in chat for malware, credential stealers, and fake Discord Nitro phishing.',
    instructions: 'Test with `/scanlink url:example.com` or `!scanlink <url>` in this channel.',
    testCommands: ['/scanlink', '!scanlink'],
    highlights: [
      '🛡️ Autonomous zero-day domain reputation analysis',
      '🚨 Pre-click warning cards for suspect external links',
      '⚡ Silent automated deletion if link matches verified malicious signatures'
    ]
  }
];

let incubatorState = {
  activeBetaId: 'feat_code_sandbox',
  betaIndex: 0,
  activeMessageId: null,
  votes: {},
  startedAt: Date.now(),
  promotedFeatures: []
};

function loadIncubatorState() {
  try {
    if (fs.existsSync(INCUBATOR_FILE)) {
      incubatorState = JSON.parse(fs.readFileSync(INCUBATOR_FILE, 'utf8'));
    } else {
      saveIncubatorState();
    }
  } catch (err) {
    console.warn('[BetaIncubator] Initializing defaults:', err.message);
    saveIncubatorState();
  }
}

function saveIncubatorState() {
  try {
    const dir = path.dirname(INCUBATOR_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(INCUBATOR_FILE, JSON.stringify(incubatorState, null, 2), 'utf8');
  } catch (err) {
    console.error('[BetaIncubator] Save failed:', err.message);
  }
}

loadIncubatorState();

/**
 * Returns current active beta feature
 */
export function getCurrentBetaFeature() {
  return FEATURE_PIPELINE.find(f => f.id === incubatorState.activeBetaId) || FEATURE_PIPELINE[0];
}

/**
 * Builds the Beta Lab Drop Embed
 */
export function buildBetaDropEmbed(feature) {
  const f = feature || getCurrentBetaFeature();
  const upvoteCount = Object.values(incubatorState.votes).filter(v => v === 'upvote').length;
  const downvoteCount = Object.values(incubatorState.votes).filter(v => v === 'downvote').length;

  const embed = new EmbedBuilder()
    .setColor(0x8B5CF6) // Royal Purple for Beta
    .setAuthor({
      name: `Krims AI Beta Lab • Weekly Feature Staging (${f.versionTag})`,
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
    })
    .setTitle(`🔬 Staged Prototype: ${f.title}`)
    .setDescription(
      `Attention <@&${BETA_TESTER_ROLE_ID}> & <@&${DEV_ROLE_ID}>!\n\n` +
      `Our autonomous AI engine has dropped this week's prototype feature for private staging & rigorous stress-testing!\n\n` +
      `**Category:** \`${f.category}\` • **Target Platform:** \`Krims Code v5 / Krims AI v3.1\`\n\n` +
      `### 📝 Feature Overview:\n${f.summary}\n\n` +
      `### 🧪 How to Test in This Channel:\n${f.instructions}\n\n` +
      `### 🌟 Planned Highlights:\n` +
      f.highlights.map(h => `• ${h}`).join('\n') + '\n\n' +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `**Beta Community Approval:** 👍 \`${upvoteCount}\` Upvotes | 👎 \`${downvoteCount}\` Needs Tuning\n` +
      `*Once verified by developers and testers, this feature will be promoted into the Main AI fleet!*`
    )
    .setFooter({
      text: 'Krims Autonomous Feature Incubator • 7-Day Testing Window',
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
    })
    .setTimestamp();

  return embed;
}

/**
 * Builds the Beta Action Row
 */
export function buildBetaActionRow(featureId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`beta_test_${featureId}`)
      .setLabel('🧪 Test Prototype')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`beta_vote_up_${featureId}`)
      .setLabel('👍 Approve (Ready)')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`beta_vote_down_${featureId}`)
      .setLabel('🔧 Needs Polish')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`beta_promote_${featureId}`)
      .setLabel('🚀 Promote to Main AI')
      .setStyle(ButtonStyle.Danger)
  );
}

/**
 * Dispatches a new Weekly Beta Drop to #🧠・𝖠i-𝖫ab
 */
export async function dispatchWeeklyBetaDrop(client, featureOverride = null) {
  if (!client) return null;
  try {
    const channel = await client.channels.fetch(AI_LAB_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return null;

    let targetFeature = featureOverride;
    if (!targetFeature) {
      targetFeature = FEATURE_PIPELINE[incubatorState.betaIndex % FEATURE_PIPELINE.length];
      incubatorState.activeBetaId = targetFeature.id;
      incubatorState.startedAt = Date.now();
      incubatorState.votes = {};
    }

    const embed = buildBetaDropEmbed(targetFeature);
    const row = buildBetaActionRow(targetFeature.id);

    const msg = await channel.send({
      content: `🚨 **NEW WEEKLY FEATURE PROTOTYPE DROPPED!** <@&${BETA_TESTER_ROLE_ID}> <@&${DEV_ROLE_ID}>`,
      embeds: [embed],
      components: [row]
    });

    incubatorState.activeMessageId = msg.id;
    saveIncubatorState();
    console.log(`[BetaIncubator] Dispatched weekly beta drop: ${targetFeature.id} (Msg: ${msg.id})`);
    return msg;
  } catch (err) {
    console.error('[BetaIncubator] Error dispatching beta drop:', err.message);
    return null;
  }
}

/**
 * Promotes the tested Beta feature directly into the Main AI / Krims Code v5 fleet!
 */
export async function promoteBetaFeatureToMain(client, featureId, promotedBy = 'Krims Executive Team') {
  const f = FEATURE_PIPELINE.find(item => item.id === featureId) || getCurrentBetaFeature();
  if (!f) return null;

  console.log(`[BetaIncubator] Promoting feature ${f.id} to Main Krims Code v5 / Krims AI v3.1...`);

  // 1. Add persistent platform update
  const newUpdate = addPersistentUpdate({
    version: 'v5.4.0',
    title: `${f.title} (Graduated from Beta Lab)`,
    category: f.category,
    summary: `Following successful stress-testing by our developer & beta community in #🧠・𝖠i-𝖫ab, ${f.title} has officially graduated and joined the main Krims Code v5 fleet!`,
    highlights: [
      `🌟 Officially promoted by ${promotedBy}`,
      ...f.highlights,
      `📖 Integrated into official Krims Wiki command directory`
    ],
    author: `${promotedBy} & Beta Community`,
    pinned: true
  });

  // 2. Sync to Discord #🚀・𝖡ot-𝖴pdates
  await syncPersistentUpdateToDiscord(client, BOT_UPDATES_CHANNEL_ID);

  // 3. Mark as promoted and advance queue
  incubatorState.promotedFeatures.push({
    id: f.id,
    title: f.title,
    promotedAt: Date.now(),
    promotedBy
  });
  incubatorState.betaIndex = (incubatorState.betaIndex + 1) % FEATURE_PIPELINE.length;
  incubatorState.activeBetaId = FEATURE_PIPELINE[incubatorState.betaIndex].id;
  incubatorState.votes = {};
  saveIncubatorState();

  // 4. Send celebration announcement in #🧠・𝖠i-𝖫ab
  try {
    const labChannel = await client.channels.fetch(AI_LAB_CHANNEL_ID).catch(() => null);
    if (labChannel && labChannel.isTextBased()) {
      const gradEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle(`🎉 PROMOTION COMPLETE: ${f.title} is now in Main AI v3.1!`)
        .setDescription(
          `**${f.title}** has graduated from beta testing with community approval!\n\n` +
          `• **New Version:** \`Krims Code v5.4.0 (Powered by Krims AI v3.1)\`\n` +
          `• **Live Announcement:** See <#${BOT_UPDATES_CHANNEL_ID}>\n` +
          `• **Wiki Docs:** Available in https://krims-bot-dashboard.vercel.app/wiki\n\n` +
          `Thank you to all <@&${BETA_TESTER_ROLE_ID}> and <@&${DEV_ROLE_ID}> members who stress-tested this release!`
        )
        .setTimestamp();

      await labChannel.send({ embeds: [gradEmbed] });
    }
  } catch (err) {
    console.warn('[BetaIncubator] Graduation notice error:', err.message);
  }

  return newUpdate;
}

/**
 * Handles button interactions for Beta testing & voting
 */
export async function handleBetaInteraction(interaction, client) {
  const { customId, user, member } = interaction;

  if (customId.startsWith('beta_vote_up_')) {
    incubatorState.votes[user.id] = 'upvote';
    saveIncubatorState();
    const embed = buildBetaDropEmbed();
    const f = getCurrentBetaFeature();
    const row = buildBetaActionRow(f.id);
    await interaction.update({ embeds: [embed], components: [row] });
    return interaction.followUp({ content: '👍 Thanks for testing! Your approval has been recorded.', ephemeral: true });
  }

  if (customId.startsWith('beta_vote_down_')) {
    incubatorState.votes[user.id] = 'downvote';
    saveIncubatorState();
    const embed = buildBetaDropEmbed();
    const f = getCurrentBetaFeature();
    const row = buildBetaActionRow(f.id);
    await interaction.update({ embeds: [embed], components: [row] });
    return interaction.followUp({ content: '🔧 Thanks for the feedback! Tell us in this channel what needs tuning.', ephemeral: true });
  }

  if (customId.startsWith('beta_test_')) {
    const f = getCurrentBetaFeature();
    return interaction.reply({
      content: `🧪 **How to Test ${f.title}:**\n${f.instructions}\n\n*Note: Prototype commands are active in this channel (#🧠・𝖠i-𝖫ab) for verified testers!*`,
      ephemeral: true
    });
  }

  if (customId.startsWith('beta_promote_')) {
    const isExecutive = member?.roles?.cache?.has(EXECUTIVE_ROLE_ID) || 
                        member?.permissions?.has(PermissionFlagsBits.Administrator) ||
                        user.id === '1414143825538191373';

    if (!isExecutive) {
      return interaction.reply({
        content: '🔒 Only Server Executives and Lead Bot Developers can promote beta features to the Main AI fleet!',
        ephemeral: true
      });
    }

    await interaction.deferReply();
    const f = getCurrentBetaFeature();
    await promoteBetaFeatureToMain(client, f.id, user.tag);
    return interaction.editReply(`🚀 **Success!** Staged prototype \`${f.title}\` has been successfully promoted to the Main Krims Code v5 / Krims AI v3.1 fleet and announced in <#${BOT_UPDATES_CHANNEL_ID}>!`);
  }
}
