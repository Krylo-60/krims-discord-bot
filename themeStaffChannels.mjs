import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1549875778575929446';
const CAT_ID = '1551258636750426148';
const ADMIN_CHAT_ID = '1551258641796046850';
const MOD_CHAT_ID = '1549883558208868373';
const STAFF_LOGS_ID = '1551258646216708162';
const ADMIN_VOICE_ID = '1551258650356486175';
const STAFF_VOICE_ID = '1551258652026077318';

client.once('clientReady', async () => {
  console.log(`[Logged In] ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(GUILD_ID);

    // 1. Rename Category to thematic Skybase Command
    const cat = guild.channels.cache.get(CAT_ID);
    if (cat) {
      await cat.setName('🛡️ ─── SKY COMMAND ───');
      console.log('[+] Renamed category to "🛡️ ─── SKY COMMAND ───"');
    }

    // 2. Rename Text Channels with Skybase Flight Theme
    const adminChat = guild.channels.cache.get(ADMIN_CHAT_ID);
    if (adminChat) {
      await adminChat.setName('⚡・𝖼ommand-𝖻ridge');
      await adminChat.setTopic('🚁 Skybase Command Bridge. Restricted to Sky Commander & Fleet Admirals.');
      console.log('[+] Renamed admin chat to "⚡・𝖼ommand-𝖻ridge"');

      const bridgeEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('⚡ Skybase Command Bridge — High Command Deck')
        .setDescription(
          `Welcome to the **Command Bridge** of **Krylo\'s Skybase**! 🚁☁️\n\n` +
          `🔒 **Access Clearance:** Level 5 — Restricted strictly to **👑 Sky Commander** & **⚡ Fleet Admiral**.\n\n` +
          `• **Mission:** Executive server oversight, sensitive moderation escalations, bot orchestration, and film shoot schedules.\n` +
          `• **Direct Line to Krylo:** Private headquarters for server leadership.`
        )
        .setFooter({ text: 'Krylo\'s Skybase • Command Bridge' })
        .setTimestamp();
      await adminChat.send({ embeds: [bridgeEmbed] }).catch(() => {});
    }

    const modChat = guild.channels.cache.get(MOD_CHAT_ID);
    if (modChat) {
      await modChat.setName('🛡️・𝗐arden-𝖽eck');
      await modChat.setTopic('🛡️ Sky Warden Station. Incident reports, application reviews & moderation operations.');
      console.log('[+] Renamed mod chat to "🛡️・𝗐arden-𝖽eck"');

      const wardenEmbed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('🛡️ Sky Warden Station — Security Deck')
        .setDescription(
          `Welcome to the **Sky Warden Deck**! 🛡️☁️\n\n` +
          `🔒 **Station Crew:** **🛡️ Sky Warden**, **⚡ Fleet Admiral**, and **👑 Sky Commander**.\n\n` +
          `• **Operations:** Real-time chat defense, member assistance, rule enforcement, and application reviews.\n` +
          `• **Automated Radar:** Anti-spam defense and bot alerts are routed to <#${STAFF_LOGS_ID}>.`
        )
        .setFooter({ text: 'Krylo\'s Skybase • Warden Security' })
        .setTimestamp();
      await modChat.send({ embeds: [wardenEmbed] }).catch(() => {});
    }

    const staffLogs = guild.channels.cache.get(STAFF_LOGS_ID);
    if (staffLogs) {
      await staffLogs.setName('📋・𝖿light-𝗅ogs');
      await staffLogs.setTopic('📡 Skybase Flight & Radar Logs. Automated ban records, mention strikes & security telemetry.');
      console.log('[+] Renamed staff logs to "📋・𝖿light-𝗅ogs"');
    }

    // 3. Rename Voice Channels with Skybase Flight Theme
    const adminVoice = guild.channels.cache.get(ADMIN_VOICE_ID);
    if (adminVoice) {
      await adminVoice.setName('🔒・Commander\'s Quarters');
      console.log('[+] Renamed admin voice to "🔒・Commander\'s Quarters"');
    }

    const staffVoice = guild.channels.cache.get(STAFF_VOICE_ID);
    if (staffVoice) {
      await staffVoice.setName('🔊・Warden Station Comms');
      console.log('[+] Renamed staff voice to "🔊・Warden Station Comms"');
    }

    console.log('🎉 All Staff and Admin channels successfully themed to Krylo\'s Skybase!');

  } catch (err) {
    console.error('Error theming channels:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
