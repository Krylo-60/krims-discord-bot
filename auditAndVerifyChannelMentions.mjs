import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
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
  console.log(`[+] Logged in as ${client.user.tag} - Running exhaustive channel mention audit...`);

  let totalBrokenFound = 0;
  let totalFixed = 0;

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      console.log(`\n========================================`);
      console.log(`Auditing: ${guild.name} (${guild.id})`);
      console.log(`========================================`);

      const channels = await guild.channels.fetch();
      const channelMap = new Map();
      channels.forEach(c => {
        if (c) channelMap.set(c.id, c);
      });

      for (const [, ch] of channels) {
        if (!ch || ch.type !== ChannelType.GuildText) continue;

        try {
          const messages = await ch.messages.fetch({ limit: 50 }).catch(() => null);
          if (!messages) continue;

          for (const [, msg] of messages) {
            let fullText = msg.content || '';
            if (msg.embeds && msg.embeds.length > 0) {
              for (const e of msg.embeds) {
                fullText += ' ' + (e.title || '') + ' ' + (e.description || '');
                if (e.fields) {
                  for (const f of e.fields) {
                    fullText += ' ' + (f.name || '') + ' ' + (f.value || '');
                  }
                }
              }
            }

            // Look for <#...>
            const matches = fullText.match(/<#[^>]+>/g);
            if (matches) {
              for (const m of matches) {
                const idMatch = m.match(/<#(\d+)>/);
                if (!idMatch) {
                  // Non-numeric ID like <#🤖┃bot-commands>
                  totalBrokenFound++;
                  console.log(`[❌ BROKEN NON-NUMERIC MENTION] in #${ch.name} by ${msg.author.tag}: ${m}`);
                  if (msg.author.id === client.user.id) {
                    await msg.delete().catch(() => {});
                    totalFixed++;
                    console.log(`   -> Deleted broken bot message.`);
                  }
                } else {
                  const targetId = idMatch[1];
                  if (!channelMap.has(targetId)) {
                    // Numeric ID but channel doesn't exist in this guild (old deleted channel ID)
                    totalBrokenFound++;
                    console.log(`[⚠️ DELETED CHANNEL ID MENTION] in #${ch.name}: <#${targetId}> (Channel no longer exists)`);
                    if (msg.author.id === client.user.id) {
                      await msg.delete().catch(() => {});
                      totalFixed++;
                      console.log(`   -> Deleted message with nonexistent channel ID.`);
                    }
                  } else {
                    const targetCh = channelMap.get(targetId);
                    console.log(`[✅ VALID CLICKABLE MENTION] in #${ch.name} -> #${targetCh.name}`);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn(`Error reading #${ch.name}:`, e.message);
        }
      }
    } catch (err) {
      console.warn(`Guild error:`, err.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`🎉 AUDIT COMPLETE:`);
  console.log(`   Total Broken / Ghost Mentions Found: ${totalBrokenFound}`);
  console.log(`   Total Broken Bot Messages Removed: ${totalFixed}`);
  console.log(`========================================`);

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
