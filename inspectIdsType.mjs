import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const targetIds = ['1536504715913855007', '1536502967950114917'];

client.once('ready', async () => {
  console.log('[+] ID Inspector Online as ' + client.user.tag + '\n');

  try {
    for (const id of targetIds) {
      const channel = client.channels.cache.get(id);
      if (channel) {
        console.log(`[+] ID ${id} is a CHANNEL: #${channel.name} (Type: ${channel.type} | Guild: ${channel.guild.name})`);
        try {
          const msgs = await channel.messages.fetch({ limit: 50 }).catch(() => null);
          if (msgs && msgs.size > 0) {
            console.log(`    Deleting ${msgs.size} messages from channel #${channel.name}...`);
            await channel.bulkDelete(msgs).catch(async () => {
              for (const [, m] of msgs) {
                await m.delete().catch(() => {});
              }
            });
            console.log(`    ✅ Successfully cleared all messages from #${channel.name}!`);
          } else {
            console.log(`    (Channel #${channel.name} is already empty)`);
          }
        } catch (e) {
          console.warn(`    [-] Error clearing channel #${channel.name}: ${e.message}`);
        }
      } else {
        console.log(`[-] ID ${id} is NOT a channel in cache. Searching as message ID across all channels...`);
        let msgFound = false;
        for (const g of client.guilds.cache.values()) {
          for (const ch of g.channels.cache.values()) {
            if (ch.isTextBased()) {
              const msg = await ch.messages.fetch(id).catch(() => null);
              if (msg) {
                msgFound = true;
                await msg.delete();
                console.log(`    ✅ Successfully deleted message ${id} from #${ch.name} in "${g.name}"!`);
                break;
              }
            }
          }
          if (msgFound) break;
        }
        if (!msgFound) {
          console.log(`    [-] ID ${id} not found as message or channel.`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
