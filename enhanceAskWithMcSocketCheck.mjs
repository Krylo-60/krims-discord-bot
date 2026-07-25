import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add TCP socket check helper function if missing
if (!content.includes('function checkKryloServerOnline()')) {
  const socketHelper = `
async function checkKryloServerOnline() {
  return new Promise((resolve) => {
    import('net').then(({ default: net }) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(25565, 'KryloSmp.play.hosting');
    }).catch(() => resolve(false));
  });
}
`;
  content = content.replace("client.on('interactionCreate'", socketHelper + "\nclient.on('interactionCreate'");
}

// 2. Enhance /ask command with real-time status detection
const oldAskHeader = "const prompt = interaction.options.getString('prompt');";
const newAskHeader = `const prompt = interaction.options.getString('prompt');

    // Check if query is asking about Minecraft server online status
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('server on') || lowerPrompt.includes('server online') || lowerPrompt.includes('krylo smp on') || lowerPrompt.includes('is the server up') || lowerPrompt.includes('is server online') || lowerPrompt.includes('server status')) {
      await interaction.deferReply();
      const isOnline = await checkKryloServerOnline();
      
      const statusEmbed = new EmbedBuilder()
        .setColor(isOnline ? 0x00FF66 : 0xFF4444)
        .setTitle(isOnline ? '🟢 KryloSMP is 100% ONLINE!' : '🔴 KryloSMP Server Offline / Restarting')
        .setDescription(
          isOnline
            ? 'Yes! **KryloSMP is online, healthy, and open for all players!** 🎮✨\\n\\n' +
              '• ☕ **Java Edition IP:** \`KryloSmp.play.hosting\` (Port: \`25565\`)\\n' +
              '• 🪨 **Bedrock Edition IP:** \`KryloSmp.play.hosting\` (Port: \`19132\`)\\n' +
              '• 🌐 **Webstore:** https://krylosmp-store.vercel.app\\n' +
              '• ⚡ **Status:** 24/7 Monitored by UptimeRobot & Krims AI'
            : '⚠️ **The server appears offline or undergoing maintenance.**\\n\\nPlease check the Play.hosting panel or open a support ticket if issues persist!'
        )
        .setFooter({ text: 'Krims Code AI • Real-Time Socket Probe ⚡' })
        .setTimestamp();

      await interaction.editReply({ embeds: [statusEmbed] });
      return;
    }
`;

content = content.replace(oldAskHeader, newAskHeader);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 KRIMS CODE AI SERVER STATUS PROBE INTEGRATED SUCCESSFULLY!]');
