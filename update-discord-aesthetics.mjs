import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

if (!TOKEN) {
  console.error("DISCORD_TOKEN is missing in .env!");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const EMOJI_MAP = {
  'general': '💬general',
  'media': '📸media',
  'suggestions': '💡suggestions',
  'memes': '🤣memes',
  'bot-commands': '🤖bot-commands',
  'verify': '🔑verify',
  'rules': '📜rules',
  'announcements': '📣announcements',
  'server-info': '🔗server-info',
  'socials': '🔗socials',
  'polls': '📊polls',
  'leaderboards': '👑leaderboards',
  'minecraft-chat': '⛏️minecraft-chat',
  'build-showcase': '🏗️build-showcase',
  'trading': '🔄trading',
  'events': '🎯events',
  'support-tickets': '🎫support-tickets',
  'bug-reports': '🐛bug-reports',
  'staff-chat': '📝staff-chat',
  'mod-logs': '🛡️mod-logs'
};

client.once('ready', async () => {
  console.log(`[+] Bot online as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      console.error('Guild not found!');
      process.exit(1);
    }
    console.log(`[+] Connected to server: ${guild.name}`);

    // 1. Rename channels to add emojis
    console.log('[+] Renaming channels to enforce premium emojis...');
    const channels = await guild.channels.fetch();
    for (const [, ch] of channels) {
      if (ch.type === ChannelType.GuildText) {
        // Strip any existing emoji to check base name
        const baseName = ch.name.replace(/[^\w-]/g, '').toLowerCase();
        const targetName = EMOJI_MAP[baseName];
        if (targetName && ch.name !== targetName) {
          try {
            await ch.setName(targetName);
            console.log(`  [✓] Renamed text channel: #${ch.name} -> #${targetName}`);
          } catch (err) {
            console.warn(`  [-] Failed to rename text channel #${ch.name}:`, err.message);
          }
        }
      }
    }

    // 2. Create/Enforce bot role
    console.log('[+] Ensuring premium bot role exists...');
    let botRole = guild.roles.cache.find(r => r.name === '🤖 Krims AI');
    if (!botRole) {
      try {
        botRole = await guild.roles.create({
          name: '🤖 Krims AI',
          color: '#00F2FF',
          hoist: true,
          reason: 'Premium bot identifier role'
        });
        console.log(`  [✓] Created role "🤖 Krims AI"`);
      } catch (err) {
        console.warn('  [-] Failed to create bot role:', err.message);
      }
    } else {
      console.log('  [=] Bot role already exists.');
    }

    if (botRole) {
      try {
        const botMember = await guild.members.fetch(client.user.id);
        if (botMember && !botMember.roles.cache.has(botRole.id)) {
          await botMember.roles.add(botRole);
          console.log(`  [✓] Assigned role "🤖 Krims AI" to bot member!`);
        } else {
          console.log('  [=] Bot member already has the role.');
        }
      } catch (err) {
        console.warn('  [-] Failed to assign role to bot member:', err.message);
      }
    }

    console.log('[+] Aesthetics update complete!');
    process.exit(0);

  } catch (err) {
    console.error('[-] Process failed:', err.message);
    process.exit(1);
  }
});

client.login(TOKEN);
