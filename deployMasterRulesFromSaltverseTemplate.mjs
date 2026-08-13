import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 KRYLOSMP MASTER RULEBOOK DEPLOYER (.MJS)
 * Posts the comprehensive rulebook adapted from user specifications into #📌┃rules!
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log('[+] Master Rulebook Deployer Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      if (!guild.name.toLowerCase().includes('krylo')) continue;

      console.log(`=======================================================`);
      console.log(`🚀 DEPLOYING MASTER RULEBOOK IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = await guild.channels.fetch();
      const rulesChannels = channels.filter(c => c && c.isTextBased() && c.name.includes('rules'));

      for (const [, ch] of rulesChannels) {
        try {
          // Bulk delete existing messages
          const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
          if (msgs && msgs.size > 0) {
            await ch.bulkDelete(msgs).catch(async () => {
              for (const [, m] of msgs) {
                await m.delete().catch(() => {});
              }
            });
          }

          const embed = new EmbedBuilder()
            .setAuthor({ name: 'KryloSMP Executive Network Code of Conduct', iconURL: guild.iconURL() })
            .setTitle('🌟 KRYLOSMP OFFICIAL SERVER RULES & CODE OF CONDUCT')
            .setDescription(
              `Welcome to the community! By joining **KryloSMP**, you agree to follow these rules and Discord’s Terms of Service & Community Guidelines.\n\n` +
              `🤝 **1. Be Respectful**\n` +
              `• Treat everyone with kindness.\n` +
              `• No harassment, bullying, hate speech, discrimination, or personal attacks.\n` +
              `• Respect different opinions and interests.\n\n` +
              `🎬 **2. Keep It Family-Friendly**\n` +
              `• This is a Minecraft community for all ages.\n` +
              `• No sexual, inappropriate, or extremely disturbing content.\n` +
              `• Keep usernames, profiles, and messages appropriate.\n` +
              `• Refrain from swearing please!\n\n` +
              `📜 **3. Follow Discord Rules**\n` +
              `• Follow all Discord Terms of Service and Community Guidelines.\n` +
              `• No illegal content, harmful content, or attempts to bypass moderation.\n\n` +
              `🚫 **4. No Spam or Unapproved Ads**\n` +
              `• No spam, excessive pings, or message flooding.\n` +
              `• Do not advertise servers, channels, or products without permission.\n` +
              `• No spam pinging moderators, and no mentioning Krylo inappropriately.\n\n` +
              `⛏️ **5. Minecraft & Gameplay Rules**\n` +
              `• Keep content related to KryloSMP, Minecraft, gaming, and the community.\n` +
              `• No hacking, X-Ray, cheating, scams, malicious files, or exploits.\n` +
              `• Keep builds and creations family-friendly.\n\n` +
              `🔒 **6. Protect Privacy**\n` +
              `• Never share personal information (doxxing).\n` +
              `• Do not ask for passwords, addresses, school details, or private accounts.\n` +
              `• No impersonation of others without permission, including staff and/or creators.\n\n` +
              `🎥 **7. Respect Creators**\n` +
              `• Give credit for builds, art, videos, and ideas.\n` +
              `• Do not steal or claim others’ work as your own.\n` +
              `• No plagiarism (including AI-generated content).\n\n` +
              `📌 **8. Use Channels Correctly**\n` +
              `• Post in the appropriate channels.\n` +
              `• Avoid disrupting conversations.\n` +
              `• Spoiling video / YouTube content is punishable.\n\n` +
              `🛡️ **9. Respect Staff**\n` +
              `• Follow staff instructions.\n` +
              `• Contact us privately in <#🎫┃support-tickets> if you have concerns.\n` +
              `• Do NOT ask about staff applications in public chat.\n\n` +
              `⚖️ **10. Enforcement & Sanctions**\n` +
              `• Breaking rules will result in: **Warnings ➔ Message removal ➔ Timeouts ➔ Temp Bans ➔ Permanent Removal**.\n` +
              `• Listen to our warnings or instructions when given and don’t make excuses. Don't ignore staff just because something isn't explicitly stated in the rules.\n\n` +
              `🎰 **11. Gambling Policy**\n` +
              `• On the KryloSMP Discord server, we do NOT support, condone or encourage real-money gambling, betting or anything relating to that. We will take action against anyone attempting to bypass this in any way.\n\n` +
              `🌎 *Help us keep this a fun, safe, and welcoming Minecraft community!*`
            )
            .setColor(0xFFD700) // Gold
            .setThumbnail(guild.iconURL())
            .setFooter({ text: 'KryloSMP Executive Network • Rules Enforcement', iconURL: guild.iconURL() })
            .setTimestamp();

          await ch.send({ embeds: [embed] });
          console.log(`  [+] Successfully posted Master Rulebook in #${ch.name}!`);
        } catch (e) {
          console.warn(`  [-] Could not process #${ch.name}: ${e.message}`);
        }
      }

      console.log(`\n🏆 MASTER RULEBOOK DEPLOYED IN [${guild.name}]!\n\n`);
    }

    console.log('🏆 ALL RULE CHANNELS UPDATED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
