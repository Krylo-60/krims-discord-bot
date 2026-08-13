import { populateKryloFanArmyServer } from './setupKryloFanArmyBlueprint.mjs';

const FAN_ARMY_GUILD_ID = '1532574925356007525';

async function runPopulate() {
  console.log(`🚀 POPULATING KRYLO FAN ARMY SERVER (${FAN_ARMY_GUILD_ID})...`);
  await populateKryloFanArmyServer(FAN_ARMY_GUILD_ID);
}

runPopulate();
