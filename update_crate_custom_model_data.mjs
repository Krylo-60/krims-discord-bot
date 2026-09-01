import fs from 'fs';
import path from 'path';

const crateConfigs = [
  { name: 'GodlyCrate.yml', cmd: 1001, keyCmd: 2001, displayName: '&6👑 Godly Crate', keyName: '&6👑 Godly Key' },
  { name: 'MythicCrate.yml', cmd: 1002, keyCmd: 2002, displayName: '&d🔮 Mythic Crate', keyName: '&d🔮 Mythic Key' },
  { name: 'LegendaryCrate.yml', cmd: 1003, keyCmd: 2003, displayName: '&e⚔️ Legendary Crate', keyName: '&e⚔️ Legendary Key' },
  { name: 'EpicCrate.yml', cmd: 1004, keyCmd: 2004, displayName: '&b💎 Epic Crate', keyName: '&b💎 Epic Key' },
  { name: 'RareCrate.yml', cmd: 1005, keyCmd: 2005, displayName: '&9🛡️ Rare Crate', keyName: '&9🛡️ Rare Key' },
  { name: 'CommonCrate.yml', cmd: 1006, keyCmd: 2006, displayName: '&f📦 Common Crate', keyName: '&f📦 Common Key' }
];

const targetDirs = [
  path.join(process.cwd(), '..', 'krylosmp-crates'),
  path.join(process.cwd(), 'server_package', 'plugins', 'CrazyCrates', 'crates')
];

targetDirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

crateConfigs.forEach(cfg => {
  const srcPath = path.join(process.cwd(), '..', 'krylosmp-crates', cfg.name);
  if (!fs.existsSync(srcPath)) return;

  let content = fs.readFileSync(srcPath, 'utf8');

  // Inject or update Custom-Model-Data for Crate display item
  if (!content.includes(`Custom-Model-Data: ${cfg.cmd}`)) {
    content = content.replace(/Item:\s*(?:TRIPWIRE_HOOK|CHEST)/, `Item: CHEST\n  Custom-Model-Data: ${cfg.cmd}`);
  }

  // Inject or update Custom-Model-Data for PhysicalKey
  if (!content.includes(`Custom-Model-Data: ${cfg.keyCmd}`)) {
    content = content.replace(/(PhysicalKey:[\s\S]*?Item:\s*TRIPWIRE_HOOK)/, `$1\n    Custom-Model-Data: ${cfg.keyCmd}`);
  }

  // Write back to both locations
  targetDirs.forEach(d => {
    fs.writeFileSync(path.join(d, cfg.name), content, 'utf8');
  });

  console.log(`✅ Updated ${cfg.name} with Crate CMD: ${cfg.cmd} and Key CMD: ${cfg.keyCmd}`);
});
