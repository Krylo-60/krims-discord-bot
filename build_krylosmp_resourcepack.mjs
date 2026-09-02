import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const packDir = path.join(rootDir, 'krylosmp-resourcepack');

// Clean and recreate directory structure
fs.rmSync(packDir, { recursive: true, force: true });

const dirs = [
  packDir,
  path.join(packDir, 'assets/minecraft/items'),
  path.join(packDir, 'assets/minecraft/models/item'),
  path.join(packDir, 'assets/krylo/models/item/crates'),
  path.join(packDir, 'assets/krylo/models/item/keys'),
  path.join(packDir, 'assets/krylo/textures/item/crates'),
  path.join(packDir, 'assets/krylo/textures/item/keys')
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// 1. pack.mcmeta with pack_format 46 and universal range
const mcmeta = {
  pack: {
    pack_format: 46,
    supported_formats: {
      min_inclusive: 15,
      max_inclusive: 99
    },
    description: '§6§lKryloSMP §8- §eCustom 3D Crates & Keys'
  }
};
fs.writeFileSync(path.join(packDir, 'pack.mcmeta'), JSON.stringify(mcmeta, null, 2));

// 2. New 1.21.4+ item definition for tripwire_hook
const tripwireHookItem = {
  model: {
    type: 'minecraft:select',
    property: 'minecraft:custom_model_data',
    cases: [
      { when: '2001', model: { type: 'minecraft:model', model: 'krylo:item/keys/godly_key' } },
      { when: '2002', model: { type: 'minecraft:model', model: 'krylo:item/keys/mythic_key' } },
      { when: '2003', model: { type: 'minecraft:model', model: 'krylo:item/keys/legendary_key' } },
      { when: '2004', model: { type: 'minecraft:model', model: 'krylo:item/keys/epic_key' } },
      { when: '2005', model: { type: 'minecraft:model', model: 'krylo:item/keys/rare_key' } },
      { when: '2006', model: { type: 'minecraft:model', model: 'krylo:item/keys/common_key' } },
      { when: 2001, model: { type: 'minecraft:model', model: 'krylo:item/keys/godly_key' } },
      { when: 2002, model: { type: 'minecraft:model', model: 'krylo:item/keys/mythic_key' } },
      { when: 2003, model: { type: 'minecraft:model', model: 'krylo:item/keys/legendary_key' } },
      { when: 2004, model: { type: 'minecraft:model', model: 'krylo:item/keys/epic_key' } },
      { when: 2005, model: { type: 'minecraft:model', model: 'krylo:item/keys/rare_key' } },
      { when: 2006, model: { type: 'minecraft:model', model: 'krylo:item/keys/common_key' } }
    ],
    fallback: {
      type: 'minecraft:model',
      model: 'minecraft:item/tripwire_hook'
    }
  }
};
fs.writeFileSync(path.join(packDir, 'assets/minecraft/items/tripwire_hook.json'), JSON.stringify(tripwireHookItem, null, 2));

// 3. New 1.21.4+ item definition for chest
const chestItem = {
  model: {
    type: 'minecraft:select',
    property: 'minecraft:custom_model_data',
    cases: [
      { when: '1001', model: { type: 'minecraft:model', model: 'krylo:item/crates/godly_crate' } },
      { when: '1002', model: { type: 'minecraft:model', model: 'krylo:item/crates/mythic_crate' } },
      { when: '1003', model: { type: 'minecraft:model', model: 'krylo:item/crates/legendary_crate' } },
      { when: '1004', model: { type: 'minecraft:model', model: 'krylo:item/crates/epic_crate' } },
      { when: '1005', model: { type: 'minecraft:model', model: 'krylo:item/crates/rare_crate' } },
      { when: '1006', model: { type: 'minecraft:model', model: 'krylo:item/crates/common_crate' } },
      { when: 1001, model: { type: 'minecraft:model', model: 'krylo:item/crates/godly_crate' } },
      { when: 1002, model: { type: 'minecraft:model', model: 'krylo:item/crates/mythic_crate' } },
      { when: 1003, model: { type: 'minecraft:model', model: 'krylo:item/crates/legendary_crate' } },
      { when: 1004, model: { type: 'minecraft:model', model: 'krylo:item/crates/epic_crate' } },
      { when: 1005, model: { type: 'minecraft:model', model: 'krylo:item/crates/rare_crate' } },
      { when: 1006, model: { type: 'minecraft:model', model: 'krylo:item/crates/common_crate' } }
    ],
    fallback: {
      type: 'minecraft:special',
      model: {
        type: 'minecraft:chest',
        texture: 'minecraft:entity/chest/normal'
      }
    }
  }
};
fs.writeFileSync(path.join(packDir, 'assets/minecraft/items/chest.json'), JSON.stringify(chestItem, null, 2));

// 4. Create individual crate models & key models
const crateTiers = ['godly', 'mythic', 'legendary', 'epic', 'rare', 'common'];
crateTiers.forEach(tier => {
  const crateModel = {
    credit: 'KryloSMP Custom 3D Crate',
    parent: 'minecraft:item/generated',
    textures: { layer0: 'krylo:item/crates/' + tier + '_crate' },
    display: {
      gui: { rotation: [30, 45, 0], translation: [0, 0, 0], scale: [0.7, 0.7, 0.7] },
      head: { rotation: [0, 180, 0], translation: [0, -4, 0], scale: [1.6, 1.6, 1.6] },
      ground: { rotation: [0, 0, 0], translation: [0, 2, 0], scale: [0.5, 0.5, 0.5] },
      fixed: { rotation: [0, 180, 0], translation: [0, 0, 0], scale: [1, 1, 1] }
    }
  };
  fs.writeFileSync(path.join(packDir, 'assets/krylo/models/item/crates/' + tier + '_crate.json'), JSON.stringify(crateModel, null, 2));

  const keyModel = {
    credit: 'KryloSMP Custom 3D Key',
    parent: 'minecraft:item/generated',
    textures: { layer0: 'krylo:item/keys/' + tier + '_key' },
    display: {
      gui: { rotation: [0, 0, 0], translation: [0, 0, 0], scale: [1, 1, 1] },
      thirdperson_righthand: { rotation: [0, 90, -35], translation: [0, 1.25, -3.5], scale: [0.85, 0.85, 0.85] }
    }
  };
  fs.writeFileSync(path.join(packDir, 'assets/krylo/models/item/keys/' + tier + '_key.json'), JSON.stringify(keyModel, null, 2));
});

import Jimp from 'jimp';

function hex(str) { return Jimp.cssColorToHex(str); }

async function makeCrate(name, c1, c2, c3, c4) {
  const img = new Jimp(64, 64, hex(c1));
  const border = hex(c4);
  const inner = hex(c2);
  const lock = hex(c3);
  const glow = hex('#ffffff');

  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 64; y++) {
      if (x < 4 || x >= 60 || y < 4 || y >= 60) img.setPixelColor(border, x, y);
      else if (x < 8 || x >= 56 || y < 8 || y >= 56) img.setPixelColor(inner, x, y);
    }
  }

  for (let i = 8; i < 56; i++) {
    img.setPixelColor(border, i, 31);
    img.setPixelColor(border, i, 32);
    img.setPixelColor(border, 31, i);
    img.setPixelColor(border, 32, i);
  }

  for (let x = 24; x <= 39; x++) {
    for (let y = 24; y <= 39; y++) {
      img.setPixelColor(lock, x, y);
    }
  }
  for (let x = 28; x <= 35; x++) {
    for (let y = 28; y <= 35; y++) {
      img.setPixelColor(glow, x, y);
    }
  }

  const p = path.join(packDir, 'assets/krylo/textures/item/crates/' + name + '.png');
  await img.writeAsync(p);
  console.log('✅ Created crate texture:', p);
}

async function makeKey(name, c1, c2, c3) {
  const img = new Jimp(32, 32, 0x00000000);
  const metal = hex(c1);
  const glow = hex(c2);
  const jewel = hex(c3);
  const outline = hex('#090d16');

  for (let x = 5; x <= 13; x++) {
    for (let y = 5; y <= 13; y++) {
      const d = Math.sqrt((x-9)**2 + (y-9)**2);
      if (d <= 4.5 && d >= 2.0) img.setPixelColor(metal, x, y);
      else if (d < 2.0) img.setPixelColor(jewel, x, y);
    }
  }
  for (let i = 11; i <= 24; i++) {
    img.setPixelColor(metal, i, i);
    img.setPixelColor(glow, i, i-1);
    img.setPixelColor(metal, i, i+1);
  }
  for (let t = 0; t < 4; t++) {
    img.setPixelColor(metal, 21 + t, 21 - t);
    img.setPixelColor(jewel, 23 + t, 25 - t);
  }

  const p = path.join(packDir, 'assets/krylo/textures/item/keys/' + name + '.png');
  await img.writeAsync(p);
  console.log('✅ Created key texture:', p);
}

async function main() {
  console.log('🎨 Generating all 12 HD Minecraft PNG textures...');
  await makeCrate('godly_crate', '#f59e0b', '#d97706', '#fbbf24', '#78350f');
  await makeCrate('mythic_crate', '#a855f7', '#7e22ce', '#c084fc', '#3b0764');
  await makeCrate('legendary_crate', '#ef4444', '#b91c1c', '#f87171', '#450a0a');
  await makeCrate('epic_crate', '#06b6d4', '#0891b2', '#22d3ee', '#164e63');
  await makeCrate('rare_crate', '#3b82f6', '#1d4ed8', '#60a5fa', '#172554');
  await makeCrate('common_crate', '#854d0e', '#713f12', '#a16207', '#451a03');

  await makeKey('godly_key', '#fbbf24', '#fef08a', '#f59e0b');
  await makeKey('mythic_key', '#c084fc', '#e9d5ff', '#a855f7');
  await makeKey('legendary_key', '#f87171', '#fecaca', '#ef4444');
  await makeKey('epic_key', '#22d3ee', '#cffafe', '#06b6d4');
  await makeKey('rare_key', '#60a5fa', '#dbeafe', '#3b82f6');
  await makeKey('common_key', '#ca8a04', '#fef08a', '#854d0e');

  // 5. Zip using native Windows tar command
  const zipOutput = path.join(rootDir, 'krylosmp-resourcepack.zip');
  if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);

  execSync(`tar -a -c -f "${zipOutput}" -C "${packDir}" .`);

  // 6. Calculate SHA-1
  const fileBuffer = fs.readFileSync(zipOutput);
  const hashSum = crypto.createHash('sha1');
  hashSum.update(fileBuffer);
  const hexSha1 = hashSum.digest('hex');

  console.log('✅ Resource pack zipped successfully: ' + zipOutput);
  console.log('📦 Size: ' + fileBuffer.length + ' bytes');
  console.log('🔑 SHA-1 Hash: ' + hexSha1);

  // Copy to web store and main site hosting folders
  const storePublic = path.join(rootDir, '..', 'krylosmp-store-website', 'store-site', 'krylosmp-resourcepack.zip');
  fs.copyFileSync(zipOutput, storePublic);
  const mainPublic = path.join(rootDir, '..', 'krylosmp-store-website', 'main-site', 'krylosmp-resourcepack.zip');
  fs.copyFileSync(zipOutput, mainPublic);
  console.log('🌐 Copied to Web Store & Main Site for CDN hosting!');

  // Update server.properties
  const propPath = path.join(rootDir, 'server_package', 'server.properties');
  let props = fs.readFileSync(propPath, 'utf8');
  props = props.replace(/resource-pack-sha1=.*/g, 'resource-pack-sha1=' + hexSha1);
  fs.writeFileSync(propPath, props);
  console.log('✅ Updated server.properties with new SHA-1');
}

main().catch(console.error);
