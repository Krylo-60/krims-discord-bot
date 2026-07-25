// Move "New-updates" Stage channel into the INFORMATION category
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bot ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, opts);
  if (!res.ok) {
    const err = await res.text();
    console.error(`[-] API Error (${res.status}): ${err}`);
    return null;
  }
  return await res.json();
}

async function main() {
  console.log('[🚀 FETCHING ALL CHANNELS IN KRYLOSMP GUILD]...');
  
  const channels = await api(`/guilds/${GUILD_ID}/channels`);
  if (!channels) return;

  // Find the "New-updates" stage channel
  const stageChannel = channels.find(c => c.name.toLowerCase().includes('new-updates'));
  
  // Find the INFORMATION category
  const infoCategory = channels.find(c => 
    c.type === 4 && c.name.toLowerCase().includes('information')
  );

  console.log('\n[📋 ALL CATEGORIES]:');
  channels.filter(c => c.type === 4).forEach(c => {
    console.log(`  📁 ${c.name} (ID: ${c.id})`);
  });

  console.log('\n[🎙️ STAGE CHANNELS]:');
  channels.filter(c => c.type === 13).forEach(c => {
    console.log(`  🎙️ ${c.name} (ID: ${c.id}, Parent: ${c.parent_id || 'NONE'})`);
  });

  if (!stageChannel) {
    console.log('[-] Could not find "New-updates" stage channel!');
    return;
  }

  console.log(`\n[+] Found "New-updates": ID=${stageChannel.id}, Type=${stageChannel.type}, Current Parent=${stageChannel.parent_id || 'NONE'}`);

  if (!infoCategory) {
    console.log('[-] Could not find INFORMATION category!');
    return;
  }

  console.log(`[+] Found INFORMATION category: ID=${infoCategory.id}`);

  // Move the stage channel into the INFORMATION category
  console.log(`\n[🔄 MOVING "New-updates" into INFORMATION category]...`);
  const result = await api(`/channels/${stageChannel.id}`, 'PATCH', {
    parent_id: infoCategory.id,
    position: 1 // Place it near the top of the category
  });

  if (result) {
    console.log(`[✅ SUCCESS! "New-updates" is now inside the INFORMATION category!]`);
    console.log(`   New Parent: ${result.parent_id}`);
  }
}

main();
