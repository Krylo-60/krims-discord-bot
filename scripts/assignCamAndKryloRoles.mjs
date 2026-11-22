import dotenv from 'dotenv';
dotenv.config();
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const GUILD_ID = '1557852594242719775'; // The Light Bearers
const KRYLO_ID = '1414143825538191373';
const CAM_ID = '1283841949945823252';

const ROLE_CO_LEADER = '1557855847500091443'; // ⚔️ Co-Leader
const ROLE_NAMED_COLEADER = '1559250425872519220'; // Team Co-Leader Krylo -> Team Co-Leader Cam
const ROLE_TEAM_ELDER = '1568971698659917946'; // Team Elder
const ROLE_CLAN_VANGUARD = '1557855848607387719'; // 🛡️ Clan Vanguard
const ROLE_CLAN_RECRUIT = '1557855852369813514'; // 🗡️ Clan Recruit

async function updateRoles() {
  console.log('🔄 Updating roles in The Light Bearers (1557852594242719775)...');

  // 1. Rename custom role to Team Co-Leader Cam
  try {
    await rest.patch(Routes.guildRole(GUILD_ID, ROLE_NAMED_COLEADER), {
      body: { name: 'Team Co-Leader Cam' }
    });
    console.log('✅ Renamed role 1559250425872519220 to "Team Co-Leader Cam"');
  } catch (e) {
    console.error('Failed to rename role:', e.message);
  }

  // 2. Promote Cam to Co-Leader
  try {
    // Add ⚔️ Co-Leader
    await rest.put(Routes.guildMemberRole(GUILD_ID, CAM_ID, ROLE_CO_LEADER));
    console.log(`✅ Added ⚔️ Co-Leader to Cam (${CAM_ID})`);

    // Add Team Co-Leader Cam
    await rest.put(Routes.guildMemberRole(GUILD_ID, CAM_ID, ROLE_NAMED_COLEADER));
    console.log(`✅ Added Team Co-Leader Cam to Cam (${CAM_ID})`);
  } catch (e) {
    console.error('Failed to update Cam roles:', e.message);
  }

  // 3. Demote Krylo from Co-Leader to Team Elder & Clan Vanguard
  try {
    // Remove ⚔️ Co-Leader
    await rest.delete(Routes.guildMemberRole(GUILD_ID, KRYLO_ID, ROLE_CO_LEADER));
    console.log(`✅ Removed ⚔️ Co-Leader from Krylo (${KRYLO_ID})`);

    // Remove Team Co-Leader Cam
    await rest.delete(Routes.guildMemberRole(GUILD_ID, KRYLO_ID, ROLE_NAMED_COLEADER));
    console.log(`✅ Removed Team Co-Leader from Krylo (${KRYLO_ID})`);

    // Remove Clan Recruit if present
    await rest.delete(Routes.guildMemberRole(GUILD_ID, KRYLO_ID, ROLE_CLAN_RECRUIT)).catch(() => {});
    console.log(`✅ Removed Clan Recruit from Krylo (${KRYLO_ID})`);

    // Add Team Elder
    await rest.put(Routes.guildMemberRole(GUILD_ID, KRYLO_ID, ROLE_TEAM_ELDER));
    console.log(`✅ Added Team Elder to Krylo (${KRYLO_ID})`);

    // Add Clan Vanguard
    await rest.put(Routes.guildMemberRole(GUILD_ID, KRYLO_ID, ROLE_CLAN_VANGUARD));
    console.log(`✅ Added 🛡️ Clan Vanguard to Krylo (${KRYLO_ID})`);
  } catch (e) {
    console.error('Failed to update Krylo roles:', e.message);
  }

  // 4. Verify updated member roles
  console.log('\n🔍 Verifying final role assignments:');
  const allRoles = await rest.get(Routes.guildRoles(GUILD_ID));
  const roleNameMap = Object.fromEntries(allRoles.map(r => [r.id, r.name]));

  const updatedCam = await rest.get(Routes.guildMember(GUILD_ID, CAM_ID));
  console.log(`Cam (${updatedCam.nick || updatedCam.user.username}) roles:\n` +
    updatedCam.roles.map(id => `  - ${roleNameMap[id] || id}`).join('\n')
  );

  const updatedKrylo = await rest.get(Routes.guildMember(GUILD_ID, KRYLO_ID));
  console.log(`\nKrylo (${updatedKrylo.nick || updatedKrylo.user.username}) roles:\n` +
    updatedKrylo.roles.map(id => `  - ${roleNameMap[id] || id}`).join('\n')
  );
}

updateRoles().catch(console.error);
