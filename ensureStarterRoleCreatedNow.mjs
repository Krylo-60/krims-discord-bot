import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function createStarterRole() {
  console.log('[🚀 CREATING KRYLOSMP STARTER ROLE] Checking guild roles...');

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
      headers: { 'Authorization': `Bot ${token}` }
    });

    if (!res.ok) {
      console.error('[-] Failed to fetch roles:', res.status, await res.text());
      return;
    }

    const roles = await res.json();
    let starterRole = roles.find(r => r.name === 'KryloSMP Starter');

    if (!starterRole) {
      console.log('[+] "KryloSMP Starter" role does not exist. Creating role now...');
      const createRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'KryloSMP Starter',
          color: 0x00F2FF, // Electric Cyan
          hoist: true,     // Display role members separately in sidebar
          mentionable: true,
          reason: 'KryloSMP Starter role created for verified rule-accepting members'
        })
      });

      if (createRes.ok) {
        starterRole = await createRes.json();
        console.log(`[✅ KRYLOSMP STARTER ROLE CREATED SUCCESSFULLY!] ID: ${starterRole.id}`);
      } else {
        console.error('[-] Failed to create role:', createRes.status, await createRes.text());
        return;
      }
    } else {
      console.log(`[+] "KryloSMP Starter" role ALREADY exists. ID: ${starterRole.id}`);
    }

    // Assign 'KryloSMP Starter' role to Krylo (Owner) as a test
    const ownerId = '1414143825538191373';
    console.log(`[+] Assigning KryloSMP Starter role to Krylo (${ownerId})...`);
    await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${ownerId}/roles/${starterRole.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bot ${token}` }
    });
    console.log('[✅ KRYLOSMP STARTER ROLE ASSIGNED TO KRYLO!] Check your profile roles now!');
  } catch (err) {
    console.error('[-] Error creating/assigning role:', err.message);
  }
}

createStarterRole();
