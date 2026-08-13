import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const guard2Block = `  // Guard 2: Skip automated responses if a staff member/moderator/admin is chatting
  const isStaff = message.member?.permissions.has(PermissionFlagsBits.ManageChannels) || 
                  message.member?.roles.cache.some(r => r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('mod'));
  if (isStaff) {
    return;
  }`;

const fixedGuard2Block = `  // Allow ticket responses for all users (including server owner/staff) in ticket channels!`;

if (code.includes(guard2Block)) {
  code = code.replace(guard2Block, fixedGuard2Block);
  fs.writeFileSync('index.js', code);
  console.log('✅ Successfully removed Guard 2 restriction from handleTicketMessage!');
} else {
  console.error('[-] Could not locate Guard 2 block in index.js');
}
