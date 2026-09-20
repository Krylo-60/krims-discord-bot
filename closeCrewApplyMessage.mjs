import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const CREW_APPLY_CHANNEL_ID = '1550902305568718948';
const CREW_APPLY_MSG_ID = '1550902307053502537';

client.once('clientReady', async () => {
  console.log(`[Logged In] ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CREW_APPLY_CHANNEL_ID);
    const msg = await channel.messages.fetch(CREW_APPLY_MSG_ID);

    const closedEmbed = new EmbedBuilder()
      .setColor(0xEF4444) // Red for closed
      .setTitle('📋 Skybase Studios — Applications')
      .setDescription(
        `### 🔴 Application Status: **CURRENTLY CLOSED**\n\n` +
        `Thank you for your interest in joining the official **[Krylo MC](https://www.youtube.com/@krylomcyt?sub_confirmation=1)** Team & Video Production Crew!\n` +
        `Our team roster is currently full at this time, and official applications are **NOT** being accepted right now.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `### 🎬 Team Roles (When Applications Reopen):\n` +
        `• 🛡️ **Staff & Moderators:** Chat moderation, ticket support, and server order.\n` +
        `• 🎭 **Actors & Participants:** Playing roles in video challenges, manhunts, and scripted scenarios.\n` +
        `• 🔨 **Master Builders:** Constructing video arenas, traps, and custom SMP set pieces.\n` +
        `• 🎥 **Replay Mod & Camera:** Capturing cinematic drone shots and angles.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `### 📣 Want to star in a video right now?\n` +
        `Krylo regularly recruits community members for one-off video sessions, challenges, and battles in **<#1550901948910141620>**!\n` +
        `• Keep an eye on <#1550901948910141620> and turn on channel notifications.\n` +
        `• When a recruitment call is announced, follow the instructions to jump into the recording!\n\n` +
        `🔔 *An announcement will be posted in <#1549882277209571329> as soon as applications reopen!*`
      )
      .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
      .setFooter({
        text: 'Krylo\'s Skybase • Applications Managed by Krims Code AI',
        iconURL: 'https://krims-code-chatbot.vercel.app/app_logo.jpg'
      })
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_app_closed_notice')
        .setLabel('🔒 Applications Currently Closed')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await msg.edit({
      embeds: [closedEmbed],
      components: [disabledRow]
    });

    console.log('✅ Successfully updated #📋・𝖢rew-apply message to CLOSED!');
  } catch (err) {
    console.error('Error closing applications:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
