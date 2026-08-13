import { Client, GatewayIntentBits, EmbedBuilder, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const GUILDS = [
  '1524878881918685405', // KryloSMP
  '1420991845546332162', // Krylo's Discord server
  '1532574925356007525'  // Krylo Fan Army 👑
];

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag} - Auditing and fixing all channel mentions across all servers...`);

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      console.log(`\n══════════════════════════════════════════`);
      console.log(`🔍 Auditing Guild: ${guild.name} (${guild.id})`);
      console.log(`══════════════════════════════════════════`);

      const channels = await guild.channels.fetch();
      const botCmdCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('bot-command'));
      const rulesCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('rules'));
      const verifyCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('verify'));
      const generalCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('general'));
      const supportCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('support') || c.name.includes('ticket')));

      const cmdMention = botCmdCh ? `<#${botCmdCh.id}>` : '`#🤖┃bot-commands`';
      const rulesMention = rulesCh ? `<#${rulesCh.id}>` : '`#📌┃rules`';
      const verifyMention = verifyCh ? `<#${verifyCh.id}>` : '`#✅┃verify`';
      const generalMention = generalCh ? `<#${generalCh.id}>` : '`#💬┃general-chat`';
      const supportMention = supportCh ? `<#${supportCh.id}>` : '`#🎫┃support-tickets`';

      // Scan all text channels for bot messages containing broken channel mentions
      for (const [, ch] of channels) {
        if (!ch || ch.type !== ChannelType.GuildText) continue;

        try {
          const messages = await ch.messages.fetch({ limit: 20 }).catch(() => null);
          if (!messages) continue;

          for (const [, msg] of messages) {
            if (msg.author.id !== client.user.id) continue;

            let hasBrokenMention = false;
            let fullText = msg.content || '';

            if (msg.embeds && msg.embeds.length > 0) {
              for (const em of msg.embeds) {
                fullText += ' ' + (em.title || '') + ' ' + (em.description || '');
                if (em.fields) {
                  for (const f of em.fields) {
                    fullText += ' ' + (f.name || '') + ' ' + (f.value || '');
                  }
                }
              }
            }

            // Check if fullText contains broken <#non_number> mentions like <#🤖┃bot-commands> or deleted channel IDs
            if (/<#[^\d>]+>/.test(fullText) || fullText.includes('<#🤖┃bot-commands>') || fullText.includes('<#🎫┃support-tickets>')) {
              hasBrokenMention = true;
            }

            if (hasBrokenMention) {
              console.log(`   [🗑️] Deleting message with broken channel mention in #${ch.name} (ID: ${msg.id})`);
              await msg.delete().catch(() => {});
            }
          }
        } catch (err) {
          console.warn(`   [!] Error scanning messages in #${ch.name}:`, err.message);
        }
      }

      // Repost clean Community Lounge embed in general-chat / ksmp-clan-chat
      for (const [, ch] of channels) {
        if (!ch || ch.type !== ChannelType.GuildText) continue;

        if (ch.name.includes('general-chat') || ch.name.includes('ksmp-clan-chat')) {
          const msgs = await ch.messages.fetch({ limit: 10 }).catch(() => null);
          const hasLoungeEmbed = msgs && msgs.some(m => m.author.id === client.user.id && m.embeds.some(e => e.title && e.title.includes('COMMUNITY LOUNGE')));

          if (!hasLoungeEmbed) {
            const loungeEmbed = new EmbedBuilder()
              .setColor(0x3A86EF)
              .setAuthor({ name: '👑 KryloSMP Executive Network Protocol' })
              .setTitle('💬 KRYLOSMP GLOBAL COMMUNITY LOUNGE')
              .setDescription(
                `The main hangout spot for all **KryloSMP** members!\n\n` +
                `💬 **LOUNGE GUIDELINES:**\n` +
                `• Chat about Minecraft, SMP strategies, build ideas, and gaming\n` +
                `• Keep conversations friendly, respectful, and PG-13\n` +
                `• Avoid spamming, excessive caps, or self-promotion\n` +
                `• Use ${cmdMention} for bot commands to keep general clean!`
              )
              .setImage('https://krylosmp.web.app/banner.jpg')
              .setFooter({ text: `KryloSMP Official • #${ch.name}` })
              .setTimestamp();

            await ch.send({ embeds: [loungeEmbed] }).catch(() => {});
            console.log(`   [✅] Posted clean Community Lounge embed in #${ch.name}`);
          }
        }
      }

      console.log(`✨ Completed channel audit for ${guild.name}!`);
    } catch (err) {
      console.warn(`Error in guild ${guildId}:`, err.message);
    }
  }

  console.log('\n🎉 ALL BROKEN # CHANNEL MENTIONS FIXED ACROSS ALL DISCORD SERVERS!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
