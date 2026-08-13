import fs from 'fs';

const code = fs.readFileSync('index.js', 'utf-8');

// Extract top-level command registrations (name + description pattern)
const matches = [...code.matchAll(/\{\s*name:\s*'([a-z0-9_-]+)'\s*,\s*description:/g)];
const cmds = [...new Set(matches.map(x => x[1]))];

console.log(`=== SLASH COMMAND AUDIT: ${cmds.length} Registered Commands ===\n`);

let ok = 0, fail = 0;
const missing = [];

for (const cmd of cmds) {
  const regex = new RegExp(`commandName\\s*===\\s*['"\`]${cmd}['"\`]`);
  if (regex.test(code)) {
    console.log(`  [✅] /${cmd}`);
    ok++;
  } else {
    console.log(`  [❌] /${cmd} — NO HANDLER`);
    missing.push(cmd);
    fail++;
  }
}

console.log(`\n=== RESULTS: ${ok}/${cmds.length} commands have handlers ===`);
if (missing.length > 0) {
  console.log(`⚠️  Missing handlers: ${missing.join(', ')}`);
} else {
  console.log(`🏆 ALL COMMANDS HAVE HANDLERS!`);
}
