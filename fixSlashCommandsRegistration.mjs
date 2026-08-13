import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// 1. Add genkey to slashCommands array if not present
const genkeySlashDef = `{
      name: 'genkey',
      description: 'Generate a free custom API key with custom prefix (Admin only)',
      options: [
        { name: 'prefix', type: 3, description: 'Custom key prefix (e.g. krylo, krims)', required: false },
        { name: 'env', type: 3, description: 'Environment (live, dev, admin)', required: false }
      ]
    },`;

if (!code.includes("name: 'genkey'")) {
  code = code.replace("const slashCommands = [", `const slashCommands = [\n    ${genkeySlashDef}`);
  console.log('✅ Added /genkey to slashCommands array!');
}

// 2. Filter duplicate slash command names before registering
const oldRegistration = `await client.application.commands.set(slashCommands);`;
const newRegistration = `const uniqueCommands = [];
    const seenNames = new Set();
    for (const cmd of slashCommands) {
      if (cmd && cmd.name && !seenNames.has(cmd.name)) {
        seenNames.add(cmd.name);
        uniqueCommands.push(cmd);
      }
    }
    await client.application.commands.set(uniqueCommands);
    console.log(\`[+] \${uniqueCommands.length} unique slash commands registered globally!\`);`;

if (code.includes(oldRegistration)) {
  code = code.replace(oldRegistration, newRegistration);
  fs.writeFileSync('index.js', code);
  console.log('✅ Updated slash command registration to filter duplicates!');
} else {
  console.error('[-] Could not find oldRegistration in index.js');
}
