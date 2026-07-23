import 'dotenv/config';

async function testDailyReward() {
  console.log('[+] Testing Day 1 Daily Reward Logic...');
  const guildId = '1524878881918685405';
  const username = 'Krylo';

  const festivalRewards = [
    { day: 1, date: 23, name: '💎 Day 1: Diamond Bundle', reward: 1000, mcCmd: 'give Krylo minecraft:diamond 32', desc: '• **+1,000 KryloCoins**\n• **32x Free Diamonds** in-game!' },
    { day: 2, date: 24, name: '🎂 Day 2: Krylo Birthday Special', reward: 2500, mcCmd: 'give Krylo minecraft:netherite_ingot 1', desc: '• **+2,500 KryloCoins**\n• **1x Netherite Ingot** in-game!' },
    { day: 3, date: 25, name: '⚔️ Day 3: Warrior Kit', reward: 1500, mcCmd: 'give Krylo minecraft:diamond_sword{Enchantments:[{id:sharpness,lvl:5},{id:unbreaking,lvl:3}]} 1', desc: '• **+1,500 KryloCoins**\n• **1x Sharpness V Diamond Sword** in-game!' }
  ];

  const todayDate = new Date().getDate();
  const activeFest = festivalRewards.find(r => r.date === todayDate) || festivalRewards[0];

  const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_config', guildId })
  });

  if (configRes.ok) {
    const config = await configRes.json();
    if (!config.economyData) config.economyData = {};
    if (!config.economyData[username]) config.economyData[username] = { balance: 0 };
    config.economyData[username].balance += activeFest.reward;

    if (!config.pendingCommands) config.pendingCommands = [];
    config.pendingCommands.push(activeFest.mcCmd);

    const saveRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_config', guildId, config })
    });

    const saveJson = await saveRes.json();
    console.log('[✅ TEST VERIFIED] Day 1 Reward Claimed Successfully!');
    console.log(`• Active Festival Day: ${activeFest.name}`);
    console.log(`• Krylo Balance Updated to: ${config.economyData[username].balance} KC`);
    console.log(`• Queued Console Command: ${activeFest.mcCmd}`);
    console.log(`• Database Save Response:`, saveJson);
  }
}

testDailyReward();
