import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_IDS = ['1524878881918685405', '1420991845546332162', '1532574925356007525'];

client.once('ready', async () => {
  console.log(`[+] Cleaning and verifying all channels across all guilds...`);

  for (const guildId of GUILD_IDS) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;
    console.log(`\n========================================\n👑 Auditing & Polishing Guild: ${guild.name}\n========================================`);

    const channels = await guild.channels.fetch();

    for (const [, ch] of channels) {
      if (!ch || ch.type !== ChannelType.GuildText) continue;

      // Channels that should only contain 1 single message:
      const singleEmbedChannels = [
        'welcome', 'verify', 'rules', 'socials', 'levels-and-rewards', 
        'partnerships', 'store', 'support-tickets', 'clan-leaderboard', 
        'faq-how-to-play', 'monthly-tournament', 'bounty-board', 
        'jackpot-vault', 'pvp-chat'
      ];

      const isSingle = singleEmbedChannels.some(name => ch.name.includes(name));

      if (isSingle) {
        const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
        if (msgs && msgs.size > 1) {
          // Sort ascending (oldest first)
          const sorted = Array.from(msgs.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          // Keep the newest message, delete all previous older ones
          const toDelete = sorted.slice(0, sorted.length - 1);
          for (const m of toDelete) {
            await m.delete().catch(() => {});
            console.log(`   [🗑️] Deleted old duplicate in #${ch.name} (ID: ${m.id})`);
          }
        }
      }

      // In suggestions channel, remove any old user messages/test messages, keep only guide
      if (ch.name.includes('suggestion')) {
        const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
        if (msgs && msgs.size > 1) {
          const sorted = Array.from(msgs.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          for (const m of sorted) {
            const isGuide = m.embeds.some(e => e.title?.includes('SUGGESTION BOX'));
            if (!isGuide && (m.content?.includes('Ban all') || m.embeds.some(e => e.description?.includes('Ban all')))) {
              await m.delete().catch(() => {});
              console.log(`   [🗑️] Cleaned test suggestion in #${ch.name}`);
            }
          }
        }
      }

      // In announcements channel, ensure only the official Season 1 Reboot Announcement exists
      if (ch.name.includes('server-announcement') || ch.name.includes('announcements')) {
        const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
        if (msgs && msgs.size > 1) {
          const sorted = Array.from(msgs.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          const toDelete = sorted.slice(0, sorted.length - 1);
          for (const m of toDelete) {
            await m.delete().catch(() => {});
            console.log(`   [🗑️] Cleaned old announcement in #${ch.name} (ID: ${m.id})`);
          }
        }
      }

      // In clan-recruitment, clean duplicate guide
      if (ch.name.includes('clan-recruitment')) {
        const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
        if (msgs && msgs.size > 1) {
          const sorted = Array.from(msgs.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          const toDelete = sorted.slice(0, sorted.length - 1);
          for (const m of toDelete) {
            await m.delete().catch(() => {});
            console.log(`   [🗑️] Cleaned duplicate in #${ch.name}`);
          }
        }
      }
    }
  }

  console.log('\n🎉 ALL OLD & DUPLICATE MESSAGES PURGED ACROSS ALL CHANNELS!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
