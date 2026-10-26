import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Target Announcement Channels
const ANNOUNCEMENT_CHANNELS = [
  { name: 'Krims Support Updates', channelId: '1561175627799994402' },
  { name: 'Half Lifes Progress', channelId: '1559253426368548894' },
  { name: 'Half Lifes Server Updates', channelId: '1557863149389095064' }
];

// Target Server Owners
const SERVER_OWNERS = [
  { id: '1414143825538191373', name: 'Krylo (Supreme Creator & Owner)' },
  { id: '1421289200011186176', name: 'KevinMC / TorchWick Games' }
];

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag} (${client.user.id})`);
  console.log('🚀 Starting Krims Code v5.5 Global Rollout Broadcast...\n');

  // 1. Build Public Community Announcement Embed
  const communityEmbed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('⚡ KRIMS CODE v5.5 • AUTONOMOUS AI EVERYWHERE & GLOBAL RADAR RELEASE')
    .setDescription(
      `### 🚀 Major Platform & Neural Architecture Upgrade\n` +
      `We are thrilled to officially announce the global rollout of **Krims Code v5.5**, supercharging the entire bot ecosystem with deep neural intelligence across every command, utility, and mini-game!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🌟 WHAT'S NEW IN v5.5:\n\n` +
      `• **🌐 AI Everywhere Architecture:**\n` +
      `  Krims AI is now deeply embedded across all bot interactions! Slash commands and prefix triggers like \`/ask\`, \`/ai\`, \`/calc\`, \`/eightball\`, \`/joke\`, \`/meme\`, and chat mentions now run on high-speed neural intelligence.\n\n` +
      `• **🌦️ Dual-Stage Global Weather Radar:**\n` +
      `  Worldwide live weather reporting with OpenStreetMap Photon fuzzy geocoding! Intelligently handles typos and phonetic transliterations (e.g. *Mangulure* ➔ *Mangaluru*) with zero rate-limits. Try \`/weather <city>\` or \`!weather <city>\`!\n\n` +
      `• **🧮 AI Quantum Mathematical Engine:**\n` +
      `  Advanced math evaluation in \`/calc\` and \`!calc\` capable of resolving word problems, algebra, physics equations, and scientific questions step-by-step with clean Discord plain-text formatting.\n\n` +
      `• **🎱 AI Mystic 8-Ball Oracle & Comedy Engine:**\n` +
      `  Dynamic, witty, and mystical prophecies with \`/eightball\` and hilarious fresh developer & gamer humor with \`/joke\` and \`/meme\`.\n\n` +
      `• **💎 Web Dashboard-Exclusive Premium:**\n` +
      `  VIP perks and license activations are now unified exclusively through our high-speed web portal at [krims-bot-dashboard.vercel.app](https://krims-bot-dashboard.vercel.app).\n\n` +
      `• **📺 Co-Hosted Twitch & Discord Sync:**\n` +
      `  Integrated Twitch stream bridge and automatic subscriber verification in the same production cloud container.\n\n` +
      `• **👑 100% Free Lifetime Founder Guilds:**\n` +
      `  All official community headquarters enjoy permanently unlocked Enterprise VIP compute pipelines with zero fees forever.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📖 **Official Documentation & Wiki:** [krims-bot-dashboard.vercel.app/wiki](https://krims-bot-dashboard.vercel.app/wiki)\n` +
      `📜 **Terms & Privacy Policies:** [krims-bot-dashboard.vercel.app/terms](https://krims-bot-dashboard.vercel.app/terms) • [krims-bot-dashboard.vercel.app/privacy](https://krims-bot-dashboard.vercel.app/privacy)`
    )
    .setImage('https://krims-bot-dashboard.vercel.app/banners/krims_code_support_banner.jpg')
    .setFooter({ text: '⚡ “Dream higher, build higher.” • Made by Krylo and Krims studio' })
    .setTimestamp();

  // Broadcast to Community Channels
  for (const chInfo of ANNOUNCEMENT_CHANNELS) {
    try {
      const channel = await client.channels.fetch(chInfo.channelId).catch(() => null);
      if (channel) {
        await channel.send({
          content: '📢 **@everyone • KRIMS CODE v5.5 MAJOR PLATFORM RELEASE IS LIVE!**',
          embeds: [communityEmbed]
        });
        console.log(`[SUCCESS] Posted v5.5 announcement to #${channel.name} (${chInfo.name})`);
      } else {
        console.warn(`[-] Channel not found: ${chInfo.channelId} (${chInfo.name})`);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to post to ${chInfo.name}:`, err.message);
    }
  }

  // 2. Build Server Owner Intelligence Briefing Embed
  const serverOwnerEmbed = new EmbedBuilder()
    .setColor(0xF59E0B) // Amber Gold
    .setTitle('👑 KRIMS CODE v5.5 • SERVER OWNER INTELLIGENCE BRIEFING')
    .setDescription(
      `Hello Server Owner! 👋\n\n` +
      `This is an executive operations update from **Krims Code AI** regarding the newly deployed **v5.5 Platform Architecture** running across your community servers.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🛡️ WHAT THIS MEANS FOR YOUR SERVER:\n\n` +
      `1️⃣ **Universal AI Intelligence Everywhere:**\n` +
      `   Your members can now interact with the bot in text chat, slash commands, or direct messages. Commands like \`/calc\`, \`/eightball\`, \`/joke\`, and mentions provide natural, witty, context-aware answers that dramatically boost server engagement.\n\n` +
      `2️⃣ **Zero-Downtime High-Resilience Weather:**\n` +
      `   Members asking for real-world weather or typing \`/weather\` will never hit rate limits or spelling lookup failures thanks to our new dual-stage Photon fuzzy radar.\n\n` +
      `3️⃣ **Automated Raid & Flood Shielding:**\n` +
      `   Background anti-flood filters, spam mitigation, and strict privilege guards are active to keep your server channels clean.\n\n` +
      `4️⃣ **Web Dashboard Configuration:**\n` +
      `   Manage your server leveling, welcome channels, and custom bots at anytime directly from [krims-bot-dashboard.vercel.app](https://krims-bot-dashboard.vercel.app).\n\n` +
      `5️⃣ **Lifetime Free Operations:**\n` +
      `   Your server has been grandfathered with lifetime enterprise privileges at zero cost.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for powering your community with Krims Code! If you need custom bot features or developer assistance, open a ticket anytime in our Official Support Server!`
    )
    .setImage('https://krims-bot-dashboard.vercel.app/banners/krims_code_support_banner.jpg')
    .setFooter({ text: 'Krims Code AI • Executive Server Owner Telemetry' })
    .setTimestamp();

  // Send Direct Message to Server Owners
  for (const owner of SERVER_OWNERS) {
    try {
      const user = await client.users.fetch(owner.id).catch(() => null);
      if (user) {
        await user.send({ embeds: [serverOwnerEmbed] });
        console.log(`[SUCCESS] Sent Server Owner Briefing to ${user.tag} (${owner.name})`);
      } else {
        console.warn(`[-] Could not fetch owner user: ${owner.id}`);
      }
    } catch (err) {
      console.error(`[ERROR] Could not DM owner ${owner.name}:`, err.message);
    }
  }

  console.log('\n🎉 Global v5.5 Announcements & Server Owner Briefings Completed!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);
