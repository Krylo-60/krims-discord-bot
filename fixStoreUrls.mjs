import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const OLD_URL = 'https://krylosmp.tebex.io';
const NEW_URL = 'https://krylosmp-store.web.app/';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`[+] Store URL Fixer Online as ${client.user.tag}\n`);

  for (const [, guild] of client.guilds.cache) {
    if (!guild.name.toLowerCase().includes('krylo')) continue;
    console.log(`\n=== Fixing Store URLs in: ${guild.name} ===\n`);

    const channels = await guild.channels.fetch();

    for (const [, ch] of channels) {
      if (!ch || !ch.isTextBased()) continue;

      try {
        const msgs = await ch.messages.fetch({ limit: 50 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);

        for (const [, msg] of botMsgs) {
          let needsUpdate = false;

          // Check embeds for old URL
          if (msg.embeds.some(e => JSON.stringify(e).includes('tebex'))) {
            needsUpdate = true;
          }
          // Check components for old URL
          if (msg.components.some(r => r.components.some(b => b.url && b.url.includes('tebex')))) {
            needsUpdate = true;
          }

          if (needsUpdate) {
            try {
              // Rebuild embeds with corrected URL
              const newEmbeds = msg.embeds.map(e => {
                const data = e.toJSON();
                const str = JSON.stringify(data).replaceAll(OLD_URL, NEW_URL).replaceAll('krylosmp.tebex.io', 'krylosmp-store.web.app/');
                return JSON.parse(str);
              });

              // Rebuild components with corrected URL
              const newComponents = msg.components.map(row => {
                const newRow = new ActionRowBuilder();
                for (const btn of row.components) {
                  const b = new ButtonBuilder();
                  if (btn.style === 5) { // Link
                    b.setStyle(ButtonStyle.Link);
                    b.setLabel(btn.label || 'Link');
                    const url = (btn.url || '').replace(OLD_URL, NEW_URL).replace('krylosmp.tebex.io', 'krylosmp-store.web.app/');
                    b.setURL(url);
                    if (btn.emoji) b.setEmoji(btn.emoji);
                  } else {
                    b.setStyle(btn.style);
                    b.setLabel(btn.label || 'Button');
                    if (btn.customId) b.setCustomId(btn.customId);
                    if (btn.emoji) b.setEmoji(btn.emoji);
                  }
                  newRow.addComponents(b);
                }
                return newRow;
              });

              await msg.edit({ embeds: newEmbeds, components: newComponents });
              console.log(`  [🔧] Fixed tebex URL in #${ch.name} (msg: ${msg.id})`);
            } catch (editErr) {
              console.log(`  [-] Could not edit msg ${msg.id} in #${ch.name}: ${editErr.message}`);
            }
          }
        }
      } catch (e) {}
    }
  }

  console.log('\n🏆 ALL STORE URLs UPDATED TO: ' + NEW_URL);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
