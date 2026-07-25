import fs from 'fs';

const filePath = 'index.js';
let content = fs.readFileSync(filePath, 'utf8');

// The corrupted block starts at the refer entry and ends at ];
// We need to find and replace from "name: 'refer'" broken entry through "];"
const corruptedPattern = `    {
      name: 'refer',
          required: true
        }
      ]
    }
  ];`;

const replacement = `    {
      name: 'refer',
      description: 'Refer friends to KryloSMP to earn +2,000 KC and Referral Crate Keys!',
      options: [{ name: 'friend', type: 6, description: 'Friend you invited', required: false }]
    },
    { name: 'bump', description: 'Check Disboard bump status and set 2-hour reminder for free server traffic!' },
    { name: 'verify', description: 'Link your Discord and whitelist your Minecraft username!',
      options: [{ name: 'username', type: 3, description: 'Your Minecraft In-Game Username', required: true }]
    },
    { name: 'spin', description: 'Spin the KryloSMP Fortune Wheel for free daily prizes and KryloCoins!' },
    { name: 'chest', description: 'Open your FREE Daily Lucky Chest for random loot and KryloCoins!' },
    { name: 'jackpot', description: 'View the global KryloSMP Jackpot pool and contribute KC to win big!' },
    { name: 'quests', description: 'View your active Season Pass quests and claim XP/KryloCoin rewards!' },
    { name: 'clan', description: 'Manage your KryloSMP faction clan!',
      options: [
        { name: 'action', type: 3, description: 'Clan action', required: true, choices: [
          { name: 'Create', value: 'create' }, { name: 'Info', value: 'info' },
          { name: 'Leaderboard', value: 'leaderboard' }, { name: 'Join', value: 'join' },
          { name: 'Leave', value: 'leave' }, { name: 'Deposit', value: 'deposit' }
        ]},
        { name: 'value', type: 3, description: 'Clan name tag or amount', required: false }
      ]
    },
    { name: 'bounty', description: 'Place or view active bounties on players for KC rewards!',
      options: [
        { name: 'target', type: 6, description: 'Player to bounty', required: false },
        { name: 'amount', type: 4, description: 'KC bounty amount min 100', required: false }
      ]
    },
    { name: 'trade', description: 'Trade items and KryloCoins with another player securely!',
      options: [
        { name: 'player', type: 6, description: 'Player to trade with', required: true },
        { name: 'offer', type: 3, description: 'What you are offering', required: true }
      ]
    },
    { name: 'pet', description: 'View feed or train your KryloSMP virtual companion pet!',
      options: [{ name: 'action', type: 3, description: 'Pet action', required: false, choices: [
        { name: 'View', value: 'view' }, { name: 'Feed', value: 'feed' },
        { name: 'Train', value: 'train' }, { name: 'Adopt', value: 'adopt' }
      ]}]
    },
    { name: 'fish', description: 'Go fishing in KryloSMP waters for rare catches and KC rewards!' },
    { name: 'mine', description: 'Go mining in KryloSMP caves for ores gems and KC rewards!' },
    { name: 'craft', description: 'Craft items from gathered materials for special rewards!' },
    { name: 'enchant', description: 'Enchant your gear with magical abilities for combat bonuses!' },
    { name: 'raid', description: 'Launch or join a server-wide raid boss event for epic loot!',
      options: [{ name: 'action', type: 3, description: 'Raid action', required: false, choices: [
        { name: 'View', value: 'view' }, { name: 'Join', value: 'join' }, { name: 'Leaderboard', value: 'leaderboard' }
      ]}]
    },
    { name: 'profile', description: 'View your full KryloSMP player profile and stats!',
      options: [{ name: 'player', type: 6, description: 'Player to view', required: false }]
    },
    { name: 'inventory', description: 'View your KryloSMP inventory of items keys and collectibles!' },
    { name: 'achievements', description: 'View your unlocked achievements and progress milestones!' },
    { name: 'duel', description: 'Challenge another player to a 1v1 KC wager duel!',
      options: [
        { name: 'opponent', type: 6, description: 'Player to challenge', required: true },
        { name: 'wager', type: 4, description: 'KC wager amount min 50', required: false }
      ]
    },
    { name: 'heist', description: 'Attempt a KC heist on the KryloSMP Bank vault for massive payouts!' },
    { name: 'rob', description: 'Attempt to rob KryloCoins from another player!',
      options: [{ name: 'target', type: 6, description: 'Player to rob', required: true }]
    },
    { name: 'lottery', description: 'Buy a lottery ticket for the weekly KryloSMP mega drawing!',
      options: [{ name: 'tickets', type: 4, description: 'Number of tickets 100 KC each', required: false }]
    },
    { name: 'lootbox', description: 'Open a mystery lootbox for random items and KC rewards!',
      options: [{ name: 'type', type: 3, description: 'Lootbox tier', required: false, choices: [
        { name: 'Common FREE', value: 'common' }, { name: 'Rare 500 KC', value: 'rare' },
        { name: 'Epic 2000 KC', value: 'epic' }, { name: 'Legendary 5000 KC', value: 'legendary' }
      ]}]
    }
  ];`;

// Try both \r\n and \n line endings
const corruptedCRLF = corruptedPattern.replace(/\n/g, '\r\n');

if (content.includes(corruptedCRLF)) {
  content = content.replace(corruptedCRLF, replacement.replace(/\n/g, '\r\n'));
  console.log('[+] Fixed with CRLF line endings!');
} else if (content.includes(corruptedPattern)) {
  content = content.replace(corruptedPattern, replacement);
  console.log('[+] Fixed with LF line endings!');
} else {
  console.log('[-] Could not find the corrupted pattern. Trying fuzzy match...');
  // Try a regex-based approach
  const regex = /\{\s*\n\s*name:\s*'refer',\s*\n\s*required:\s*true\s*\n\s*\}\s*\n\s*\]\s*\n\s*\}\s*\n\s*\];/;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    console.log('[+] Fixed with regex match!');
  } else {
    console.log('[-] FAILED: Cannot find pattern at all.');
    // Show surrounding context
    const idx = content.indexOf("name: 'refer'");
    if (idx !== -1) {
      console.log('[DEBUG] Found refer at index', idx);
      console.log('[DEBUG] Context:', JSON.stringify(content.substring(idx - 20, idx + 100)));
    }
    process.exit(1);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('[+] File written successfully!');

// Verify
const verifyContent = fs.readFileSync(filePath, 'utf8');
const spinIdx = verifyContent.indexOf("name: 'spin'");
const chestIdx = verifyContent.indexOf("name: 'chest'");
const bountyIdx = verifyContent.indexOf("name: 'bounty'");
console.log(`[VERIFY] spin command found: ${spinIdx > -1}`);
console.log(`[VERIFY] chest command found: ${chestIdx > -1}`);
console.log(`[VERIFY] bounty command found: ${bountyIdx > -1}`);

// Count total commands registered
const matches = verifyContent.match(/name: '/g);
console.log(`[VERIFY] Total name: entries in file: ${matches ? matches.length : 0}`);
