import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const miniToken = process.env.MINI_X_TOKEN || Buffer.from('TVRVMk5UZzBPREV3TlRJM056QTJOelF4TkEuR210NDJyLk5TdTBON3hsY3ZnSlhKQVFrS0FzZEV4ZmlvNG5nQTZCcUFuWjNJ', 'base64').toString('utf-8');
const mainToken = process.env.DISCORD_TOKEN;

async function formatMiniServer() {
  console.log('\n--- FORMATTING ROLES IN MINI\'S SERVER ---');
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(miniToken);
  const guild = await client.guilds.fetch('1568083131624460371');
  const roles = await guild.roles.fetch();

  const updates = [
    { id: '1572776005444178010', name: '🛡️・Administrator' }, // was 𝐀𝐝𝐦𝐢𝐧
    { id: '1573384798150467694', name: '🛡️・Support Staff' },  // was Support Staff
    { id: '1572788704509038692', name: '🎯・Fortnite' },       // was fortnite
    { id: '1568409798087811103', name: '📢・𝑨𝒏𝒏𝒐𝒖𝒏𝒄𝒆𝒎𝒆𝒏𝒕𝒔 𝐓𝐞𝒂𝒎' }, // was 亗・𝑨𝒏𝒏𝒐𝒖𝒏𝒄𝒆𝒎𝒆𝒏𝒕𝒔 𝐓𝐞𝒂𝒎
  ];

  for (const u of updates) {
    const r = roles.get(u.id);
    if (r && r.editable && r.name !== u.name) {
      console.log(`Mini Server: "${r.name}" -> "${u.name}"`);
      await r.setName(u.name);
    }
  }

  await client.destroy();
}

async function formatEveryone2() {
  console.log('\n--- FORMATTING ROLES IN EVERYONE 2 ---');
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(mainToken);
  const guild = await client.guilds.fetch('1571029700761878548');
  const roles = await guild.roles.fetch();

  const updates = [
    { id: '1572062932005687377', name: '👑・Custom Creator (Dylan)' }, // was 👑CUSTON CREATOR (DYLAN)
    { id: '1571610129709801513', name: '👮・Moderator' },             // was MODERATOR👮
    { id: '1571611235655614564', name: '🔰・Trial Moderator' },       // was TRIAL MODERATOR🔰
    { id: '1571654599750848653', name: '🧪・Server Update Tester' },  // was SERVER UPDATE TESTER
    { id: '1571613187655208980', name: '🤖・Server Helper' },         // was SERVER HELPER/BOT
    { id: '1571610412867391508', name: '👥・Members' },               // was MEMBERS👥
    { id: '1572038741873401926', name: '⛓️・Jailed' },                // was jailed
    { id: '1572038748693209098', name: '🖼️・Image Muted' },          // was imute
    { id: '1572038750341435432', name: '🔇・Reaction Muted' }         // was rmute
  ];

  for (const u of updates) {
    const r = roles.get(u.id);
    if (r && r.editable && r.name !== u.name) {
      console.log(`Everyone 2: "${r.name}" -> "${u.name}"`);
      await r.setName(u.name);
    }
  }

  await client.destroy();
}

async function formatKryloSmp() {
  console.log('\n--- FORMATTING ROLES IN KRYLOSMP ---');
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(mainToken);
  const guild = await client.guilds.fetch('1538225337048236082');
  const roles = await guild.roles.fetch();

  const mutedRole = roles.get('1539417565816684715'); // muted
  if (mutedRole && mutedRole.editable && mutedRole.name === 'muted') {
    console.log(`KryloSMP: "${mutedRole.name}" -> "🔇・Muted"`);
    await mutedRole.setName('🔇・Muted');
  }

  await client.destroy();
}

async function main() {
  await formatMiniServer();
  await formatEveryone2();
  await formatKryloSmp();
  console.log('\nAll role names successfully modernized and formatted across all servers! 🎉');
}

main().catch(console.error);
