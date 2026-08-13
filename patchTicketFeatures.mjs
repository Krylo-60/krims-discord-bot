import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// 1. Upgrade priority display string
code = code.replace(/value:\s*`\\`\${calculatedPriority}\\``/g, `value: \`\${calculatedPriority === 'No Staff Needed' ? '🟢 Standard / General' : calculatedPriority === 'High' ? '🔴 High Priority' : '🟡 Medium Priority'}\``);

// 2. Add Close Ticket button to profileEmbed sending
const oldEmbedSend = `await channel.send({ content: \`<@\${interaction.user.id}>\`, embeds: [profileEmbed] });`;
const newEmbedSend = `const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🔒 Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );
        await channel.send({ content: \`<@\${interaction.user.id}>\`, embeds: [profileEmbed], components: [closeRow] });`;

if (code.includes(oldEmbedSend)) {
  code = code.replace(oldEmbedSend, newEmbedSend);
}

// 3. Add handler for close_ticket button in interactionCreate
const oldButtonCheck = `if (customId === 'open_ticket') {`;
const newButtonCheck = `if (customId === 'close_ticket') {
      try {
        await interaction.reply({ content: '🔒 **Closing ticket...** This channel will be deleted in 5 seconds.' });
        await closeTicketInGoogleSheet(interaction.channel.id).catch(() => {});
        setTimeout(async () => {
          await interaction.channel.delete().catch(() => {});
        }, 5000);
      } catch (err) {
        console.error('Error closing ticket:', err.message);
      }
      return;
    }

    if (customId === 'open_ticket') {`;

if (code.includes(oldButtonCheck)) {
  code = code.replace(oldButtonCheck, newButtonCheck);
}

fs.writeFileSync('index.js', code);
console.log('✅ index.js updated with Close Ticket button and friendlier priority display!');
