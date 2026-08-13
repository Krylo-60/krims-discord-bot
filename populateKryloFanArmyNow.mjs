import { populateKryloFanArmyServer } from './setupKryloFanArmyBlueprint.mjs';

const NEW_GUILD_ID = '1532574648200593548';

async function runPopulate() {
  console.log(`🚀 POPULATING NEW KRYLO FAN ARMY SERVER (${NEW_GUILD_ID})...`);
  await populateKryloFanArmyServer(NEW_GUILD_ID);
}

runPopulate();
