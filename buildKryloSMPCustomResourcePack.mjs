import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import Jimp from 'jimp';

console.log("🎨 BUILDING 100% 1.21.4 / 26.2 ITEM COMPONENT RESOURCE PACK...");

const packDir = path.join(process.cwd(), 'KryloSMP_Custom_ResourcePack');
const assetsDir = path.join(packDir, 'assets', 'minecraft');
const modelsItemDir = path.join(assetsDir, 'models', 'item');
const itemsDir = path.join(assetsDir, 'items');
const texturesDir = path.join(assetsDir, 'textures', 'item');

// Ensure clean directories
fs.mkdirSync(modelsItemDir, { recursive: true });
fs.mkdirSync(itemsDir, { recursive: true });
fs.mkdirSync(texturesDir, { recursive: true });

// 1. pack.mcmeta with pack_format 46 (1.21.4 / 26.2)
const mcmeta = {
  pack: {
    pack_format: 46,
    description: "👑 KryloSMP 26.2 Retextured God Relics Pack"
  }
};
fs.writeFileSync(path.join(packDir, 'pack.mcmeta'), JSON.stringify(mcmeta, null, 2));

// 2. pack.png icon
async function generatePackIcon() {
  const iconImg = new Jimp(64, 64, 0x111122FF);
  for (let x = 8; x < 56; x++) {
    for (let y = 8; y < 56; y++) {
      if (x === y || x === 63 - y || x === 32 || y === 32) {
        iconImg.setPixelColor(0xFFD700FF, x, y);
      }
    }
  }
  await iconImg.writeAsync(path.join(packDir, 'pack.png'));
}

// 3. Define the 13 Retextured God Items
const godItems = [
  { name: 'god_spear', base: 'trident', cmd: 1001, color: 0xFFD700FF }, // Gold Spear
  { name: 'blade_of_chaos', base: 'netherite_sword', cmd: 1002, color: 0xFF0055FF }, // Crimson Blade
  { name: 'aegis_shield', base: 'shield', cmd: 1003, color: 0x00F2FFFF }, // Cyan Shield
  { name: 'solar_bow', base: 'bow', cmd: 1004, color: 0xFF9900FF }, // Orange Flame Bow
  { name: 'titan_pickaxe', base: 'netherite_pickaxe', cmd: 1005, color: 0x00FF88FF }, // Emerald Pickaxe
  { name: 'world_breaker_axe', base: 'netherite_axe', cmd: 1006, color: 0x8800FFFF }, // Dark Purple Axe
  { name: 'crown_of_krylo', base: 'netherite_helmet', cmd: 1007, color: 0xFFFF00FF }, // Glowing Gold Crown
  { name: 'void_reaper_scythe', base: 'netherite_hoe', cmd: 1008, color: 0xAA00FFFF }, // Void Scythe
  { name: 'mjolnir_hammer', base: 'mace', cmd: 1009, color: 0x00FFFFFF }, // Thunder Hammer
  { name: 'artemis_crossbow', base: 'crossbow', cmd: 1010, color: 0x00FFDDFF }, // Laser Crossbow
  { name: 'god_chestplate', base: 'netherite_chestplate', cmd: 1011, color: 0xFF0077FF }, // God Armor
  { name: 'hermes_boots', base: 'netherite_boots', cmd: 1012, color: 0x00FF55FF }, // Hermes Boots
  { name: 'god_leggings', base: 'netherite_leggings', cmd: 1013, color: 0xFFD700FF } // God Leggings / Pants
];

// 4. Generate Custom Textures & Models
async function generateTextures() {
  for (const item of godItems) {
    const img = new Jimp(16, 16, 0x00000000);
    for (let x = 1; x < 15; x++) {
      for (let y = 1; y < 15; y++) {
        if (x === y || x === 15 - y || x === 8 || y === 8) {
          img.setPixelColor(item.color, x, y);
        }
      }
    }
    const texPath = path.join(texturesDir, `${item.name}.png`);
    await img.writeAsync(texPath);

    // 1.21.0 Legacy Model JSON
    const itemModel = {
      parent: item.base === 'trident' ? 'minecraft:item/trident' : 'minecraft:item/generated',
      textures: {
        layer0: `minecraft:item/${item.name}`
      }
    };
    fs.writeFileSync(path.join(modelsItemDir, `${item.name}.json`), JSON.stringify(itemModel, null, 2));

    // 1.21.4 Items Definition
    const itemDef = {
      model: {
        type: "minecraft:model",
        model: `minecraft:item/${item.name}`
      }
    };
    fs.writeFileSync(path.join(itemsDir, `${item.name}.json`), JSON.stringify(itemDef, null, 2));
  }
}

// 5. Generate Base Overrides for 1.21.0 AND 1.21.4 (items/*.json)
async function buildOverrides() {
  const baseGroups = {};
  for (const item of godItems) {
    if (!baseGroups[item.base]) baseGroups[item.base] = [];
    baseGroups[item.base].push(item);
  }

  for (const [baseItem, items] of Object.entries(baseGroups)) {
    // 1.21.0 Overrides
    const overrides = items.map(i => ({
      predicate: { custom_model_data: i.cmd },
      model: `item/${i.name}`
    }));

    const baseModelJson = {
      parent: baseItem === 'shield' || baseItem === 'bow' || baseItem === 'crossbow' ? `minecraft:item/${baseItem}` : "minecraft:item/generated",
      textures: {
        layer0: `minecraft:item/${baseItem}`
      },
      overrides: overrides
    };
    fs.writeFileSync(path.join(modelsItemDir, `${baseItem}.json`), JSON.stringify(baseModelJson, null, 2));

    // 1.21.4 Items Definition (minecraft:select with custom_model_data)
    const itemDef1214 = {
      model: {
        type: "minecraft:select",
        property: "minecraft:custom_model_data",
        cases: items.map(i => ({
          when: [i.cmd],
          model: {
            type: "minecraft:model",
            model: `minecraft:item/${i.name}`
          }
        })),
        fallback: {
          type: "minecraft:model",
          model: `minecraft:item/${baseItem}`
        }
      }
    };
    fs.writeFileSync(path.join(itemsDir, `${baseItem}.json`), JSON.stringify(itemDef1214, null, 2));
  }
}

async function main() {
  await generatePackIcon();
  await generateTextures();
  await buildOverrides();

  // Compress into KryloSMP_ResourcePack.zip
  const zipPath = path.join(process.cwd(), 'KryloSMP_ResourcePack.zip');
  const artifactZipPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7\\KryloSMP_ResourcePack.zip';
  
  try {
    execSync(`powershell -Command "Compress-Archive -Path '${packDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'ignore' });
    execSync(`powershell -Command "Copy-Item '${zipPath}' '${artifactZipPath}' -Force"`, { stdio: 'ignore' });
    console.log(`\n🏆 1.21.4 / 26.2 ITEM COMPONENT RESOURCE PACK CREATED SUCCESSFULLY! Saved to: ${zipPath}`);
  } catch (e) {
    console.warn("Zip creation note:", e.message);
  }
}

main().catch(err => console.error(err));
