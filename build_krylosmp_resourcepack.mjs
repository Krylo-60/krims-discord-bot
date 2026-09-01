import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const packDir = path.join(rootDir, 'krylosmp-resourcepack');

// Create directories
const dirs = [
  packDir,
  path.join(packDir, 'assets/minecraft/models/item'),
  path.join(packDir, 'assets/krylo/models/item/crates'),
  path.join(packDir, 'assets/krylo/models/item/keys'),
  path.join(packDir, 'assets/krylo/textures/item/crates'),
  path.join(packDir, 'assets/krylo/textures/item/keys')
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// 1. pack.mcmeta
const mcmeta = {
  pack: {
    pack_format: 34,
    description: '§6§lKryloSMP §8- §eCustom 3D Crates & Keys §7(1.21.x)'
  }
};
fs.writeFileSync(path.join(packDir, 'pack.mcmeta'), JSON.stringify(mcmeta, null, 2));

// Copy server icon as pack.png if exists
if (fs.existsSync('server-icon.png')) {
  fs.copyFileSync('server-icon.png', path.join(packDir, 'pack.png'));
}

// 2. chest.json router (Leaves vanilla chests 100% untouched)
const chestRouter = {
  parent: 'builtin/entity',
  display: {
    gui: { rotation: [30, 225, 0], translation: [0, 0, 0], scale: [0.625, 0.625, 0.625] },
    ground: { rotation: [0, 0, 0], translation: [0, 3, 0], scale: [0.25, 0.25, 0.25] },
    fixed: { rotation: [0, 0, 0], translation: [0, 0, 0], scale: [0.5, 0.5, 0.5] },
    thirdperson_righthand: { rotation: [75, 45, 0], translation: [0, 2.5, 0], scale: [0.375, 0.375, 0.375] },
    firstperson_righthand: { rotation: [0, 45, 0], translation: [0, 0, 0], scale: [0.4, 0.4, 0.4] },
    firstperson_lefthand: { rotation: [0, 225, 0], translation: [0, 0, 0], scale: [0.4, 0.4, 0.4] }
  },
  overrides: [
    { predicate: { custom_model_data: 1001 }, model: 'krylo:item/crates/godly_crate' },
    { predicate: { custom_model_data: 1002 }, model: 'krylo:item/crates/mythic_crate' },
    { predicate: { custom_model_data: 1003 }, model: 'krylo:item/crates/legendary_crate' },
    { predicate: { custom_model_data: 1004 }, model: 'krylo:item/crates/epic_crate' },
    { predicate: { custom_model_data: 1005 }, model: 'krylo:item/crates/rare_crate' },
    { predicate: { custom_model_data: 1006 }, model: 'krylo:item/crates/common_crate' }
  ]
};
fs.writeFileSync(path.join(packDir, 'assets/minecraft/models/item/chest.json'), JSON.stringify(chestRouter, null, 2));

// 3. tripwire_hook.json router
const keyRouter = {
  parent: 'minecraft:item/generated',
  textures: { layer0: 'minecraft:item/tripwire_hook' },
  overrides: [
    { predicate: { custom_model_data: 2001 }, model: 'krylo:item/keys/godly_key' },
    { predicate: { custom_model_data: 2002 }, model: 'krylo:item/keys/mythic_key' },
    { predicate: { custom_model_data: 2003 }, model: 'krylo:item/keys/legendary_key' },
    { predicate: { custom_model_data: 2004 }, model: 'krylo:item/keys/epic_key' },
    { predicate: { custom_model_data: 2005 }, model: 'krylo:item/keys/rare_key' },
    { predicate: { custom_model_data: 2006 }, model: 'krylo:item/keys/common_key' }
  ]
};
fs.writeFileSync(path.join(packDir, 'assets/minecraft/models/item/tripwire_hook.json'), JSON.stringify(keyRouter, null, 2));

// 4. Create individual crate models & key models
const crateTiers = ['godly', 'mythic', 'legendary', 'epic', 'rare', 'common'];
crateTiers.forEach(tier => {
  const crateModel = {
    credit: 'KryloSMP Custom 3D Crate',
    parent: 'item/generated',
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
    parent: 'item/generated',
    textures: { layer0: 'krylo:item/keys/' + tier + '_key' },
    display: {
      gui: { rotation: [0, 0, 0], translation: [0, 0, 0], scale: [1, 1, 1] },
      thirdperson_righthand: { rotation: [0, 90, -35], translation: [0, 1.25, -3.5], scale: [0.85, 0.85, 0.85] }
    }
  };
  fs.writeFileSync(path.join(packDir, 'assets/krylo/models/item/keys/' + tier + '_key.json'), JSON.stringify(keyModel, null, 2));
});

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
