import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildWebhooks
  ]
});

const GUILDS = [
  '1524878881918685405', // KryloSMP
  '1420991845546332162', // Krylo's Discord server
  '1532574925356007525'  // Krylo Fan Army 👑
];

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag} - Creating Discord Webhooks...`);

  const createdWebhooks = [];

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      console.log(`\n========================================`);
      console.log(`🌐 Creating Webhooks for: ${guild.name} (${guild.id})`);
      console.log(`========================================`);

      const channels = await guild.channels.fetch();
      
      // Target Channels for Webhooks
      const announceCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('announcement') || c.name.includes('updates')));
      const generalCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('general'));
      const modLogCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('mod-log') || c.name.includes('moderator')));

      const targets = [
        { ch: announceCh, name: '👑 KryloSMP Announcements Relay', avatar: 'https://krylosmp.web.app/banner.jpg' },
        { ch: generalCh, name: '🎮 KryloSMP Minecraft Chat Relay', avatar: 'https://mc-heads.net/avatar/Krylo_MC/128' },
        { ch: modLogCh, name: '🛡️ KryloSMP Executive Security Webhook', avatar: 'https://krylosmp.web.app/banner.jpg' }
      ];

      for (const target of targets) {
        if (!target.ch) continue;

        try {
          // Check existing webhooks in channel
          const existingWebhooks = await target.ch.fetchWebhooks().catch(() => null);
          let webhook = existingWebhooks ? existingWebhooks.find(w => w.name === target.name) : null;

          if (!webhook) {
            webhook = await target.ch.createWebhook({
              name: target.name,
              avatar: target.avatar,
              reason: 'KryloSMP Automated Relay & Event Integration'
            });
            console.log(`   [+] Created Webhook '${webhook.name}' in #${target.ch.name}`);
          } else {
            console.log(`   [~] Found Existing Webhook '${webhook.name}' in #${target.ch.name}`);
          }

          createdWebhooks.push({
            guildName: guild.name,
            guildId: guild.id,
            channelName: target.ch.name,
            channelId: target.ch.id,
            webhookName: webhook.name,
            webhookId: webhook.id,
            webhookUrl: webhook.url
          });

          // Send a test broadcast from the webhook
          const testEmbed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setAuthor({ name: '👑 KryloSMP Executive Webhook Relay', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
            .setTitle('⚡ Webhook Successfully Linked & Active!')
            .setDescription(
              `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `🌐 **Channel:** <#${target.ch.id}>\n` +
              `📡 **Status:** Connected to KryloSMP Automated Network Engine\n` +
              `⚡ **Engineered by Krylo & Krishiv**\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `This high-speed webhook is active for real-time Minecraft chat relays, server announcements, and external integration events!`
            )
            .setFooter({ text: 'KryloSMP High-Speed Webhook Protocol' })
            .setTimestamp();

          await webhook.send({
            username: target.name,
            avatarURL: target.avatar,
            embeds: [testEmbed]
          }).catch(e => console.warn('Webhook send warning:', e.message));

          console.log(`   [🚀] Sent verified test message via Webhook in #${target.ch.name}`);

        } catch (err) {
          console.warn(`   [!] Could not create webhook in #${target.ch.name}:`, err.message);
        }
      }

    } catch (guildErr) {
      console.warn(`Guild webhook error:`, guildErr.message);
    }
  }

  // Save webhooks securely to local configuration
  fs.writeFileSync('webhooks.json', JSON.stringify(createdWebhooks, null, 2));
  console.log(`\n💾 Saved ${createdWebhooks.length} webhooks to webhooks.json!`);

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
