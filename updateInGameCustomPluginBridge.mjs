import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-code-chatbot/api/chat.js';
let content = fs.readFileSync(filePath, 'utf8');

const newInGameBridge = `
  // 🎮 KRYLOSMP 2.0 CUSTOM IN-GAME PLUGIN & SKRIPT BRIDGE ENDPOINT
  if (action === 'in_game_sync') {
    const { name, event, data } = req.body || {};
    if (guildId === '1420991845546332162' || guildId === '1524878881918685405') {
      const cfg = await loadConfig(guildId);
      cfg.inGameEvents = cfg.inGameEvents || [];
      cfg.inGameEvents.push({ name, event, data, timestamp: Date.now() });
      if (cfg.inGameEvents.length > 100) cfg.inGameEvents.shift();

      await saveConfig(guildId, cfg);
      res.status(200).json({
        ok: true,
        message: 'In-game event synced successfully',
        serverName: 'KryloSMP Network',
        jackpotPool: cfg.jackpotPool || 25000,
        motd: '§b§lKRYLOSMP 2.0 §7• §eOFFICIALLY KRYLO\\'S BIRTHDAY! §a[PLAY NOW]'
      });
      return;
    }
  }
`;

content = content.replace("if (action === 'update_clan_data')", newInGameBridge + "\n  if (action === 'update_clan_data')");

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 CUSTOM IN-GAME PLUGIN BRIDGE UPDATED IN API/CHAT.JS!]');
