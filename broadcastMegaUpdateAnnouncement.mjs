import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const ANNOUNCEMENTS_CHANNEL_ID = '1526685107044356198';

async function broadcastMegaUpdate() {
  console.log('[🚀 BROADCASTING KRYLOSMP 2.0 MEGA UPDATE ANNOUNCEMENT]...');

  const embed = {
    color: 0x00F2FF,
    title: '🚀 KRYLOSMP 2.0 MEGA UPDATE IS OFFICIALLY LIVE! 🎉⚡',
    description:
      '👑 **Welcome to the Biggest Update in KryloSMP History!**\n\n' +
      'We are thrilled to launch **KryloSMP 2.0**, packed with game-changing features, brand-new commands, interactive casino games, season quests, and faction clans!\n\n' +
      '---\n\n' +
      '### 🎡 1. KRYLO-WHEEL OF FORTUNE (`/spin`)\n' +
      '• Spin the wheel every 1 hour for free!\n' +
      '• Win **Ranks, Netherite, Rares, and up to +5,000 KryloCoins**!\n\n' +
      '### 🎁 2. DAILY LUCKY CHEST (`/chest`)\n' +
      '• Claim your Daily Lucky Chest every 24 hours!\n' +
      '• Drops **+1,000 to +2,500 KryloCoins + 16x Free Diamonds** in-game!\n\n' +
      '### 💰 3. GLOBAL KRYLOCOINS JACKPOT POOL (`/jackpot`)\n' +
      '• Server-wide jackpot pool that grows with every casino game played!\n' +
      '• Hit the **DIAMOND JACKPOT** on `/spin` to win the entire pool!\n\n' +
      '### 📜 4. BIRTHDAY SEASON QUESTS (`/quests`)\n' +
      '• 4 Weekly Quests with live progress bars (`[██████░░░░] 60%`)!\n' +
      '• Complete Chatter, PvP, Shop & Recruiter quests for massive rewards!\n\n' +
      '### 🏰 5. FACTION CLAN SYSTEM (`/clan`)\n' +
      '• Create your own SMP Clan (`/clan create name:<Name> tag:<TAG>`)!\n' +
      '• Deposit coins into your **Clan Vault** and climb the `/clan leaderboard`!\n\n' +
      '---\n\n' +
      '🎮 **Join the server right now & try all the new commands:**\n' +
      '• **Java IP:** `KryloSmp.play.hosting` (Port `25565`)\n' +
      '• **Bedrock IP:** `KryloSmp.play.hosting` (Port `19132`)',
    footer: { text: 'KryloSMP 2.0 Mega Update • Powered by Krims Code AI ⚡' },
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${ANNOUNCEMENTS_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: '🎉 @everyone **THE KRYLOSMP 2.0 MEGA UPDATE IS LIVE!** 🚀🔥',
        embeds: [embed]
      })
    });

    if (res.ok) {
      console.log('[✅ KRYLOSMP 2.0 MEGA UPDATE ANNOUNCEMENT BROADCASTED SUCCESSFULLY!]');
    } else {
      console.error('[-] Failed to broadcast:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[-] Broadcast error:', err.message);
  }
}

broadcastMegaUpdate();
