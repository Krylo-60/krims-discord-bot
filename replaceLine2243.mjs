import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetLine = "await interaction.editReply(`❌ Verification failed: ${result.error || 'Invalid or expired code.'}`);";

const replaceLine = `const errEmbed = new EmbedBuilder()
              .setColor(0xFF4444)
              .setTitle('❌ Invalid or Expired Code')
              .setDescription(
                (result.error || 'The verification code entered was not recognized.') + '\\n\\n' +
                '### 🔑 How to get your code:\\n' +
                '1. Click **Link Account** and enter your Minecraft Username.\\n' +
                '2. Open Minecraft and connect to **\`KryloSmp.play.hosting\`**.\\n' +
                '3. Look at your in-game chat—your 5-digit code will display on join!\\n' +
                '4. Return here and click **Enter Code** again.'
              )
              .setFooter({ text: 'KryloSMP Verification System ⚡' })
              .setTimestamp();
            await interaction.editReply({ embeds: [errEmbed] });`;

content = content.replace(targetLine, replaceLine);
fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 REPLACED LINE 2243 IN INDEX.JS CLEANLY!]');
