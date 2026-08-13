import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once('ready', async () => {
  console.log('[+] Category Consolidator Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      if (!guild.name.toLowerCase().includes('krylo')) continue;
      console.log(`=======================================================`);
      console.log(`CONSOLIDATING CATEGORIES IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = await guild.channels.fetch();
      const categories = channels.filter(c => c.type === 4);

      // Find duplicate categories with identical names
      const categoryMap = new Map();

      for (const [, cat] of categories) {
        if (!categoryMap.has(cat.name)) {
          categoryMap.set(cat.name, []);
        }
        categoryMap.get(cat.name).push(cat);
      }

      for (const [catName, catList] of categoryMap.entries()) {
        if (catList.length > 1) {
          // Sort categories by number of children (keep the one with most children)
          catList.sort((a, b) => {
            const countA = channels.filter(c => c.parentId === a.id).size;
            const countB = channels.filter(c => c.parentId === b.id).size;
            return countB - countA;
          });

          const primaryCategory = catList[0];
          console.log(`Primary Category for "${catName}": ${primaryCategory.id}`);

          for (let i = 1; i < catList.length; i++) {
            const extraCat = catList[i];
            const extraChildren = channels.filter(c => c.parentId === extraCat.id);

            for (const [, child] of extraChildren) {
              try {
                await child.setParent(primaryCategory.id);
                console.log(`  [➡️ MOVED]: #${child.name} -> ${primaryCategory.name}`);
              } catch (e) {
                console.warn(`  [-] Could not move #${child.name}: ${e.message}`);
              }
            }

            try {
              await extraCat.delete();
              console.log(`  [🗑️ DELETED DUPLICATE CATEGORY]: "${extraCat.name}" (${extraCat.id})`);
            } catch (e) {
              console.warn(`  [-] Could not delete category "${extraCat.name}": ${e.message}`);
            }
          }
        }
      }

      // Delete specific legacy channels in KryloSMP
      const legacySpecific = channels.filter(c => c.name === '🏰・ksmp-clan-chat' || c.name === '🏆┃tournament-august-2026');
      for (const [, leg] of legacySpecific) {
        try {
          await leg.delete();
          console.log(`  [🗑️ DELETED LEGACY SPECIFIC]: #${leg.name}`);
        } catch (e) {
          console.warn(`  [-] Could not delete #${leg.name}: ${e.message}`);
        }
      }
    }

    console.log('\n🏆 Category Consolidation Complete!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
