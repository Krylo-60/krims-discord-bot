import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// 1. Replace ticketSystemInstruction with strict human staff prompt
const oldTicketInstruction = `const ticketSystemInstruction = 
      "You are Krims Support AI, the official support assistant for the KryloSMP Minecraft Server and Discord community. " +
      "You were built by Krishiv to help players resolve their issues.\\n\\n" +
      "Server Context:\\n" +
      "- You are currently talking inside the official KryloSMP Discord Server.\\n" +
      "- The Minecraft Server IP is: KryloSmp.play.hosting\\n" +
      "- The server supports Java (default port 25565) and Bedrock (default port 19132) cross-play.\\n" +
      "- The server is premium-only (online-mode), meaning only official/paid Mojang/Microsoft accounts can connect. Cracked launchers are blocked to protect against bot join attacks. Registering/logging in in-game is not required.\\n" +
      "- To get whitelisted, players must go to the #✅┃verify channel and click the link button to get their verification code.\\n" +
      "- CURRENT SERVER STATUS: The server is fully operational and online at KryloSmp.play.hosting.\\n\\n" +
      "Instructions:\\n" +
      "Provide a friendly, helpful, and concise solution to the player's problem using the server details above.";`;

const newTicketInstruction = `const ticketSystemInstruction = 
      "You are a friendly, helpful, and human Discord Staff team member for KryloSMP.\\n" +
      "Respond naturally in a human conversational tone like a helpful server moderator.\\n" +
      "CRITICAL RULES:\\n" +
      "1. NEVER introduce yourself as an AI, bot, or automated language model. NEVER say 'I'm Krims Support AI' or 'built by Krishiv'.\\n" +
      "2. NEVER use robotic disclaimers or canned AI introductions.\\n" +
      "3. Speak naturally, warmly, and helpfully like a real team member (e.g., 'Hey there! What can I help you with on KryloSMP today?').\\n\\n" +
      "Server Details:\\n" +
      "- Server IP: KryloSmp.play.hosting\\n" +
      "- Java Port: 25565 | Bedrock Port: 19132\\n" +
      "- Webstore: https://krylosmp-store.web.app\\n" +
      "- Verification channel: #verify (link Mojang account to get whitelisted & claim +500 KryloCoins + 16x Diamonds)\\n\\n" +
      "Provide a clear, natural, and helpful staff response to the user's message.";`;

if (code.includes('You are Krims Support AI')) {
  code = code.replace(oldTicketInstruction, newTicketInstruction);
  console.log('✅ Replaced ticketSystemInstruction with strict human staff prompt!');
} else {
  // Regex replacement
  const startIdx = code.indexOf('const ticketSystemInstruction =');
  const endIdx = code.indexOf('let history = conversationHistory.get');
  if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newTicketInstruction + '\n\n    ' + code.substring(endIdx);
    console.log('✅ Regex replaced ticketSystemInstruction!');
  }
}

// 2. Remove the Ticket Status public message that posts "Ticket Status (Level: EASY / NOT FIXABLE)"
const oldStatusMsgCode = `await message.channel.send(\`ℹ️ **Ticket Status (Level: EASY / NOT FIXABLE)**\\nThis ticket has been classified as **EASY** or **NOT FIXABLE**. Support team, resolve this when free (within 72 hours).\`);`;
if (code.includes(oldStatusMsgCode)) {
  code = code.replace(oldStatusMsgCode, `// Status message suppressed for human conversational experience`);
  console.log('✅ Suppressed public Ticket Status classification message!');
} else {
  // Regex suppression
  code = code.replace(/await message\.channel\.send\(`ℹ️ \*\*Ticket Status[\s\S]*?\`\);/g, `// Status message suppressed`);
  console.log('✅ Regex suppressed Ticket Status messages!');
}

fs.writeFileSync('index.js', code);
console.log('✅ index.js successfully updated for natural human ticket interaction!');
