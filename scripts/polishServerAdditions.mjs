import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

c.once('clientReady', async () => {
  try {
    const g = await c.guilds.fetch('1557852594242719775');

    // 1. Polish scripture channel
    const scripCh = await g.channels.fetch('1559664953705893898').catch(() => null);
    if (scripCh) {
      await scripCh.setName('📖・𝗌𝖼𝗋𝗂𝗉𝗍𝗎𝗋𝖾-𝗏𝖾𝗋𝗌𝖾');
      await scripCh.setTopic('📖 Daily Scripture & Fellowship • Faith, brotherhood, and daily reflections for The Half Life\'s.');
      console.log('✅ Scripture channel polished');
    }

    // 2. Polish stage channel
    const stageCh = await g.channels.fetch('1559252343969550336').catch(() => null);
    if (stageCh) {
      await stageCh.setName('🎮・𝖬𝖺𝗂𝗇-𝖲𝗍𝖺𝗀𝖾');
      console.log('✅ Main stage polished');
    }

    // 3. Polish raid planner topic
    const raidCh = await g.channels.fetch('1558114547460608060').catch(() => null);
    if (raidCh) {
      await raidCh.setTopic('💣 Clan Raids & Warfare Headquarters • Coordinate raid timers, vault penetrations, and loot extraction.');
      console.log('✅ Raids planner topic set');
    }

    // 4. Polish base coords topic
    const coordsCh = await g.channels.fetch('1557855864549806150').catch(() => null);
    if (coordsCh) {
      await coordsCh.setTopic('🔒 TOP SECRET COORDINATES • Strictly classified to verified clan members. Sharing or leaking results in immediate clan ban.');
      console.log('✅ Base coordinates topic set');
    }

    // 5. Post high-tech Bounty Board embed in #🎯・𝖶anted-and-bounties
    const bountyCh = await g.channels.fetch('1558113541729558578').catch(() => null);
    if (bountyCh) {
      const bountyEmbed = new EmbedBuilder()
        .setTitle('🎯 THE HALF LIFE\'S • OFFICIAL BOUNTY BOARD & HIT LIST')
        .setDescription(
          'Below is the high-priority syndicate bounty ledger posted by Clan Command (<@1533703991882416373> & <@1414143825538191373>).\n\n' +
          'Operatives who locate, neutralize, and confirm eliminations of these high-value targets will receive direct vault payout rewards upon submitting proof to Clan Command.'
        )
        .addFields([
          {
            name: '🔴 TARGET 1: `Wedarcher5867` — $1,000,000 BOUNTY',
            value: 
              '**• Affiliation:** Void Walkers *(Suspected Rival Faction)*\n' +
              '**• Crime / Offense:** Base griefing & hostile assassination of a clan teammate\n' +
              '**• Intelligence / Proof:** Confirmed by Operative Cam\n' +
              '**• Bounty Payout:** 💰 **$1,000,000** in-game currency\n' +
              '**• Status:** 🔴 **ACTIVE CONTRACT • ELIMINATE ON SIGHT**',
            inline: false
          },
          {
            name: '🔴 TARGET 2: `flaggermus2015` — $1,000,000 BOUNTY',
            value: 
              '**• Affiliation:** Rogue / Freelance Hostile\n' +
              '**• Crime / Offense:** Malicious TPA trapping & cold-blooded kill on clan teammate\n' +
              '**• Intelligence / Proof:** Confirmed by Operative Cam\n' +
              '**• Bounty Payout:** 💰 **$1,000,000** in-game currency\n' +
              '**• Status:** 🔴 **ACTIVE CONTRACT • ELIMINATE ON SIGHT**',
            inline: false
          },
          {
            name: '📜 Rules of Engagement & Payout Verification',
            value: 
              '1. Capture an in-game screenshot or video of the kill / death message showing target IGN.\n' +
              '2. Open a ticket in <#1561109170428842147> or submit proof directly to <@1533703991882416373> or <@1414143825538191373>.\n' +
              '3. The $1,000,000 reward will be wired immediately from clan reserves upon confirmation.',
            inline: false
          }
        ])
        .setColor(0xFF1E27)
        .setFooter({ text: 'The Half Life\'s Clan Warfare • High-Value Targets Ledger' })
        .setTimestamp();

      const bountyMsg = await bountyCh.send({ embeds: [bountyEmbed] });
      await bountyMsg.pin().catch(() => {});
      console.log('✅ Bounty board embed posted & pinned');
    }

  } catch(err) {
    console.error('Error:', err);
  }
  process.exit(0);
});

c.login(process.env.DISCORD_TOKEN);
