import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🏰 CLEAN CLAN CHANNELS & DEPOSIT 1,000,000,000 KC INTO CLAN VAULT
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Clean Clan Channels & Vault Script Online as ' + client.user.tag + '\n');

  try {
    const guild = client.guilds.cache.find(g => g.name.toLowerCase().includes('krylosmp') || g.name.toLowerCase().includes('krylo'));
    if (!guild) {
      console.error('[-] KryloSMP Guild not found.');
      process.exit(1);
    }

    console.log(`🏰 PROCESSING CLAN CLEANUP FOR GUILD: ${guild.name} (${guild.id})...\n`);

    // 1. Find FACTIONS & CLANS category
    let clanCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && (c.name.includes('FACTIONS') || c.name.includes('CLANS')));

    // 2. Delete duplicate placeholder `#🏰-ksmp-clan-chat`
    const duplicateCh = guild.channels.cache.find(c => c.name === 'ksmp-clan-chat' || c.name.includes('ksmp-clan-chat'));
    if (duplicateCh) {
      try {
        await duplicateCh.delete('Deleting duplicate generic clan placeholder channel');
        console.log(`  🗑️ Deleted duplicate channel: #${duplicateCh.name}`);
      } catch (e) {
        console.warn(`  [-] Could not delete duplicate channel: ${e.message}`);
      }
    }

    // 3. Move `#🏰-krylo-clan-chat` into `FACTIONS & CLANS` category
    const kryloClanCh = guild.channels.cache.find(c => c.name.includes('krylo-clan-chat'));
    if (kryloClanCh && clanCat) {
      try {
        await kryloClanCh.setParent(clanCat.id);
        console.log(`  📂 Moved #${kryloClanCh.name} into Category: ${clanCat.name}`);
      } catch (e) {
        console.warn(`  [-] Could not move channel: ${e.message}`);
      }
    }

    // 4. Update clans.json with 1,000,000,000 KC Vault Balance for [KRYLO]
    let clans = {};
    if (fs.existsSync('clans.json')) {
      try {
        clans = JSON.parse(fs.readFileSync('clans.json', 'utf8'));
      } catch {}
    }

    // Deposit 1 Billion KC into Krylo Army Clan Vault
    for (const tag in clans) {
      if (tag.toUpperCase() === 'KRYLO' || clans[tag].ownerId === '1414143825538191373' || clans[tag].name.toLowerCase().includes('krylo')) {
        clans[tag].vault = 1000000000;
        console.log(`  💰 Updated Clan Vault for [${tag}] ${clans[tag].name} to 1,000,000,000 KC!`);
      }
    }

    fs.writeFileSync('clans.json', JSON.stringify(clans, null, 2), 'utf8');
    console.log('\n✅ clans.json saved with 1,000,000,000 KC Clan Vault Balance!');

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
