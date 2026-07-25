import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-code-chatbot/api/chat.js';
let content = fs.readFileSync(filePath, 'utf8');

const newApiActions = `
  // 🚀 KRYLOSMP 2.0 MEGA UPDATE API ACTIONS
  if (action === 'update_clan_data') {
    const { clanData } = req.body || {};
    if (guildId === '1420991845546332162' || guildId === '1524878881918685405') {
      const cfg = await loadConfig(guildId);
      cfg.clanData = clanData || {};
      await saveConfig(guildId, cfg);
      res.status(200).json({ ok: true, message: 'Clan data updated' });
      return;
    }
  }

  if (action === 'update_jackpot_pool') {
    const { pool } = req.body || {};
    if (guildId === '1420991845546332162' || guildId === '1524878881918685405') {
      const cfg = await loadConfig(guildId);
      cfg.jackpotPool = pool || 25000;
      await saveConfig(guildId, cfg);
      res.status(200).json({ ok: true, pool: cfg.jackpotPool });
      return;
    }
  }
`;

content = content.replace("if (action === 'get_config')", newApiActions + "\n  if (action === 'get_config')");

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 VERCEL CHATBOT API MEGA UPDATE ACTIONS INTEGRATED SUCCESSFULLY!]');
