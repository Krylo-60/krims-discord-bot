import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';
const USER_ID = '1414143825538191373'; // Krylo's Discord User ID

async function grantVerifiedRole() {
  const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
    headers: { 'Authorization': `Bot ${TOKEN}` }
  });
  const roles = await rolesRes.json();
  const verifiedRole = roles.find(r => r.name.toLowerCase().includes('verify') || r.name.toLowerCase().includes('member'));

  if (verifiedRole) {
    console.log(`[+] Found Verified role: "${verifiedRole.name}" (ID: ${verifiedRole.id})`);
    const addRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${USER_ID}/roles/${verifiedRole.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bot ${TOKEN}` }
    });
    if (addRes.ok || addRes.status === 204) {
      console.log(`[✅ ASSIGNED "${verifiedRole.name}" ROLE TO DISCORD USER ${USER_ID}!]`);
    } else {
      console.log(`[-] API Status ${addRes.status}: ${await addRes.text()}`);
    }
  } else {
    console.log('[-] Verified role not found on server.');
  }
}

grantVerifiedRole();
