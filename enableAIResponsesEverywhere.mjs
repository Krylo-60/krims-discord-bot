import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// 1. Remove single-guild restriction in handleTicketMessage so it works on Krishiv Studios too
code = code.replace(
  `if (!message.guild || message.guild.id !== '1524878881918685405') {\n    return;\n  }`,
  `if (!message.guild) {\n    return;\n  }`
);

// 2. Add @bot mention trigger for AI chat in messageCreate
const oldMessageCreateStart = `client.on('messageCreate', async (message) => {
  if (message.author.bot) return;`;

const newMessageCreateStart = `client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Auto-respond if bot is mentioned directly (@Krims Code AI)
  if (message.mentions.has(client.user) && !message.mentions.everyone && !message.content.includes('@here')) {
    const cleanContent = message.content.replace(new RegExp('<@!?' + client.user.id + '>', 'g'), '').trim();
    if (cleanContent.length > 0) {
      try {
        await message.channel.sendTyping();
        const aiPrompt = cleanContent;
        const sysInstruction = message.guild?.id === '1524878881918685405'
          ? "You are Krims AI, the official assistant for KryloSMP Minecraft Server (IP: KryloSmp.play.hosting). Answer questions clearly, accurately, and politely."
          : "You are Krims Code AI, built by developer Krishiv PB. Answer coding, bot development, and technical queries with clear instructions and a friendly, confident tone.";
        
        let history = conversationHistory.get(message.channel.id) || [];
        const result = await sdk.ask(aiPrompt, {
          model: 'gemini',
          systemInstruction: sysInstruction,
          history: history
        });

        if (result && result.ok && result.response) {
          history.push({ role: 'user', content: aiPrompt });
          history.push({ role: 'model', content: result.response });
          if (history.length > 10) history = history.slice(history.length - 10);
          conversationHistory.set(message.channel.id, history);

          await message.reply("🤖 **Krims AI:**\\n" + result.response);
        } else {
          await message.reply("🤖 **Krims AI:** I'm here! How can I help you today?");
        }
      } catch (err) {
        console.error('[Mention AI Error]', err.message);
        await message.reply("🤖 **Krims AI:** I'm here! Ask me anything with \`!ask <your question>\` or in a support ticket.");
      }
      return;
    }
  }`;

if (code.includes(oldMessageCreateStart)) {
  code = code.replace(oldMessageCreateStart, newMessageCreateStart);
}

fs.writeFileSync('index.js', code);
console.log('✅ Updated index.js so bot answers on @mentions, in all tickets, with !ask, and in DMs!');
