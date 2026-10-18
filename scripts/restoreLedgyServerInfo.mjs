import dotenv from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import db from '../databaseEngine.mjs';

dotenv.config();

const HALF_LIFES_GUILD_ID = '1557852594242719775';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch(HALF_LIFES_GUILD_ID);
    console.log(`[Restore] Restoring Ledgy's Elite SMP server details in "${guild.name}"...`);

    // 1. Restore #🌐・𝖲mp-info (1557858903927169034)
    try {
      const smpCh = await guild.channels.fetch('1557858903927169034');
      const targetMsg = await smpCh.messages.fetch('1557858904958963913').catch(() => null);
      if (targetMsg) {
        const ledgyEmbed = new EmbedBuilder()
          .setColor(0x00FFFF)
          .setTitle('🌐 ELITE SMP — OFFICIAL SERVER CONNECTION')
          .setDescription(
            `**The Half Lifes** is an elite team competing on the **Elite SMP by Ledgy**! Use the connection addresses below to join us on the server.\n\n` +
            `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
          )
          .addFields([
            {
              name: '☕ Java Edition Connection',
              value: '```yaml\nServer IP: EliteSmp.gg\nVersion:   1.21+\n```',
              inline: false
            },
            {
              name: '📱 Bedrock Edition Connection (Mobile / Console / Windows)',
              value: '```yaml\nServer IP: Mc.eliteSmp.gg\nPort:      19132 (Default)\n```',
              inline: false
            },
            {
              name: '💬 Official Elite SMP Discord (by Ledgy)',
              value: '👉 [Join the Elite SMP Discord Community](https://discord.gg/XBgjQxbWpb)\n*Host Server Owner: Ledgy*',
              inline: false
            },
            {
              name: '⚔️ Team Roster & Whitelist Check',
              value: 'Drop your in-game name in <#1557858900806738050> so the Team Leaders can register you on the clan roster and invite you to team groups!',
              inline: false
            }
          ])
          .setFooter({ text: 'The Half Lifes • Elite SMP Team HQ • Ledgy Server' })
          .setTimestamp();

        await targetMsg.edit({ embeds: [ledgyEmbed] });
        console.log('[Restore] ✅ Restored Ledgy Elite SMP server info in #🌐・𝖲mp-info!');
      }
    } catch (e) {
      console.warn('[Restore] Error on #smp-info:', e.message);
    }

    // 2. Restore in #📢・𝖠nnouncements (1557855863430058135)
    try {
      const annCh = await guild.channels.fetch('1557855863430058135');
      const annMsg = await annCh.messages.fetch('1557855883005001819').catch(() => null);
      if (annMsg && annMsg.embeds.length > 0) {
        const emb = EmbedBuilder.from(annMsg.embeds[0]);
        emb.setTitle('🛡️ THE HALF LIFE\'S • ELITE SMP OPERATIONS');
        emb.setDescription(
          `Welcome to the official squad headquarters for **The Half Life's** on **Elite SMP by Ledgy**!\n\n` +
          `📌 **Clan Quick Links:**\n` +
          `• **Team Rules & Code:** <#1557855862146465922>\n` +
          `• **Clan Creed:** <#1557863770792136774>\n` +
          `• **Drop your IGN:** <#1557858900806738050>\n` +
          `• **Server IP & Info:** <#1557858903927169034>\n` +
          `• **Chat & Comms:** <#1557855867897127054>`
        );
        emb.setFooter({ text: 'The Half Lifes • Elite SMP Clan HQ • Est. 2026' });
        await annMsg.edit({ embeds: [emb] });
        console.log('[Restore] ✅ Restored Ledgy Elite SMP footer and intro in #📢・𝖠nnouncements!');
      }
    } catch (e) {
      console.warn('[Restore] Error on #announcements:', e.message);
    }

    // 3. Re-insert server fact in SQLite
    try {
      db.prepare(`
        INSERT OR REPLACE INTO server_ai_facts (guild_id, fact_key, fact_value, added_by)
        VALUES (?, 'minecraft_server', ?, 'System')
      `).run(
        HALF_LIFES_GUILD_ID,
        'Elite SMP by Ledgy. Java IP: EliteSmp.gg | Bedrock IP: Mc.eliteSmp.gg (Port 19132) | Discord: https://discord.gg/XBgjQxbWpb'
      );
      console.log('[Restore] ✅ Re-seeded minecraft_server fact in database');
    } catch (dbErr) {
      console.warn('[Restore] DB notice:', dbErr.message);
    }

  } catch (err) {
    console.error('Fatal:', err);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
