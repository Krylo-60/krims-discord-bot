import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once('ready', async () => {
  console.log('[+] Guild Channel Hierarchy Auditor Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      console.log(`=======================================================`);
      console.log(`🏰 SERVER: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = await guild.channels.fetch();
      const categories = channels.filter(c => c.type === 4).sort((a, b) => a.position - b.position);

      for (const [, cat] of categories) {
        console.log(`📁 ${cat.name}`);
        const childChannels = channels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
        for (const [, ch] of childChannels) {
          const typeIcon = ch.type === 2 ? '🔊' : '💬';
          console.log(`   ├── ${typeIcon} #${ch.name}`);
        }
      }

      const uncategorized = channels.filter(c => !c.parentId && c.type !== 4).sort((a, b) => a.position - b.position);
      if (uncategorized.size > 0) {
        console.log(`📁 (Uncategorized)`);
        for (const [, ch] of uncategorized) {
          const typeIcon = ch.type === 2 ? '🔊' : '💬';
          console.log(`   ├── ${typeIcon} #${ch.name}`);
        }
      }
      console.log('\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error printing channel tree:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
