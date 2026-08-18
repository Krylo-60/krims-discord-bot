import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;

async function updateApplicationName() {
  console.log('👑 Inspecting & Updating Discord Application Name to "Vesper"...');

  // 1. Fetch current application info
  const appRes = await fetch('https://discord.com/api/v10/applications/@me', {
    headers: { Authorization: `Bot ${token}` }
  });

  if (!appRes.ok) {
    console.error('❌ Failed to fetch application:', await appRes.text());
    return;
  }

  const appData = await appRes.json();
  console.log(`Current Application Name: "${appData.name}" (ID: ${appData.id})`);

  // 2. Fetch current bot user
  const userRes = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bot ${token}` }
  });
  const userData = await userRes.json();
  console.log(`Current Bot User Tag: "${userData.username}#${userData.discriminator}"`);

  // 3. Try to update Bot username via PATCH /users/@me
  const patchUser = await fetch('https://discord.com/api/v10/users/@me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: 'Vesper' })
  });

  if (patchUser.ok) {
    const updated = await patchUser.json();
    console.log(`✅ SUCCESS! Global Bot Username updated to: "${updated.username}"`);
  } else {
    const errText = await patchUser.text();
    console.warn('⚠️ PATCH /users/@me error (likely Discord 2-per-hour rate limit):', errText);
  }

  // 4. Update Guild Member Nicknames and Display Names across all guilds
  const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bot ${token}` }
  });
  const guilds = await guildsRes.json();

  for (const g of guilds) {
    const nickRes = await fetch(`https://discord.com/api/v10/guilds/${g.id}/members/@me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nick: 'Vesper' })
    });
    if (nickRes.ok) {
      console.log(`✅ Set Server Nickname to "Vesper" in ${g.name} (${g.id})`);
    } else {
      console.warn(`⚠️ Failed to set nick in ${g.name}:`, await nickRes.text());
    }
  }
}

updateApplicationName();
