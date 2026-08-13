import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function giveNativeGodKit() {
  console.log('🚀 EXECUTING NATIVE MINECRAFT 26.2 GOD KIT COMMANDS FOR Krylo_MC...');

  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  const tempUserDataDir = path.join(process.cwd(), 'temp-brave-profile-cmd-' + Date.now());

  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: bravePath,
    userDataDir: tempUserDataDir,
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const pages = await browser.pages();
  let page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('[1] Navigating to Server Console at panel.play.hosting...');
  await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const consoleInput = await page.$('input[placeholder*="command"]');
  if (!consoleInput) {
    console.error('[-] Console input element not found. Please log in or check panel layout.');
    await browser.close();
    return;
  }

  const commands = [
    // 1. Owner & OP
    "op Krylo_MC",
    "lp user Krylo_MC parent set owner",
    "sk reload KryloSMP_Mega_Features",
    "godkit Krylo_MC",

    // 2. All 13 Native 26.2 God Items
    `minecraft:give Krylo_MC trident[custom_model_data=1001,item_name='"🔱 God Spear of Krylo"',enchantments={levels:{'minecraft:sharpness':10,'minecraft:impaling':10,'minecraft:loyalty':3,'minecraft:channeling':1,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_sword[custom_model_data=1002,item_name='"🗡️ Blade of Chaos"',enchantments={levels:{'minecraft:sharpness':10,'minecraft:fire_aspect':5,'minecraft:looting':5,'minecraft:sweeping_edge':5,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC shield[custom_model_data=1003,item_name='"🛡️ Aegis of Krylo"',enchantments={levels:{'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC bow[custom_model_data=1004,item_name='"🏹 Apollo\\'s Solar Bow"',enchantments={levels:{'minecraft:power':10,'minecraft:flame':5,'minecraft:punch':3,'minecraft:infinity':1,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_pickaxe[custom_model_data=1005,item_name='"⛏️ Titan Pickaxe"',enchantments={levels:{'minecraft:efficiency':10,'minecraft:fortune':5,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_axe[custom_model_data=1006,item_name='"🪓 World-Breaker Axe"',enchantments={levels:{'minecraft:sharpness':10,'minecraft:efficiency':10,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_helmet[custom_model_data=1007,item_name='"👑 Crown of Krylo"',enchantments={levels:{'minecraft:protection':10,'minecraft:respiration':5,'minecraft:aqua_affinity':1,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_chestplate[custom_model_data=1011,item_name='"🛡️ God Chestplate of Krylo"',enchantments={levels:{'minecraft:protection':10,'minecraft:thorns':5,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_leggings[custom_model_data=1013,item_name='"👖 God Leggings of Krylo"',enchantments={levels:{'minecraft:protection':10,'minecraft:swift_sneak':3,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_boots[custom_model_data=1012,item_name='"👢 Hermes Speed Boots"',enchantments={levels:{'minecraft:protection':10,'minecraft:feather_falling':10,'minecraft:depth_strider':3,'minecraft:soul_speed':3,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC netherite_hoe[custom_model_data=1008,item_name='"🔮 Void Reaper Scythe"',enchantments={levels:{'minecraft:sharpness':10,'minecraft:looting':5,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC mace[custom_model_data=1009,item_name='"⚡ Mjolnir Hammer"',enchantments={levels:{'minecraft:density':5,'minecraft:breach':4,'minecraft:wind_burst':3,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`,
    `minecraft:give Krylo_MC crossbow[custom_model_data=1010,item_name='"🎯 Artemis Crossbow"',enchantments={levels:{'minecraft:quick_charge':5,'minecraft:multishot':1,'minecraft:piercing':4,'minecraft:unbreaking':5,'minecraft:mending':1}}] 1`
  ];

  console.log('[2] Sending commands to console...');
  for (const cmd of commands) {
    await consoleInput.type(cmd);
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 600));
    console.log(`  ✅ Executed: ${cmd.substring(0, 50)}...`);
  }

  const screenshotPath = path.join(process.cwd(), 'native_godkit_given_final.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`\n🏆 ALL NATIVE 13 GOD ITEMS & PANTS EXECUTED IN CONSOLE FOR Krylo_MC!`);
}

giveNativeGodKit().catch(err => console.error('[-] Error:', err.message));
