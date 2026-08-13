import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const startIdx = code.indexOf('async function startLiveStatusUpdate(guild, channel) {');
const endIdx = code.indexOf('function handleAIFailover(result, guild) {');

if (startIdx !== -1 && endIdx !== -1) {
  const newFunctionContent = `async function startLiveStatusUpdate(guild, channel) {
  const updateStatus = async () => {
    try {
      const res = await fetch('https://api.mcsrvstat.us/2/KryloSmp.play.hosting');
      if (!res.ok) throw new Error("mcsrvstat status " + res.status);
      const data = await res.json();

      const unixTime = Math.floor(Date.now() / 1000);
      const embed = new EmbedBuilder();

      const onlineCount = (data.players && data.players.online !== undefined) ? data.players.online : 0;
      const maxCount = (data.players && data.players.max !== undefined) ? data.players.max : 0;
      const playerList = (data.players && data.players.list && data.players.list.length > 0) ? data.players.list.map(p => "• \`" + p + "\`").join("\\n") : 'No players currently online.';
      const motd = (data.motd && data.motd.clean) ? data.motd.clean.join("\\n") : 'KryloSMP Minecraft Server';

      const isOffline = !data.online || maxCount === 0 || motd.toLowerCase().includes('currently offline') || motd.toLowerCase().includes('server is offline');

      if (!isOffline) {
        embed
          .setColor(0x00FF66)
          .setTitle('🟢 KryloSMP Server is ONLINE')
          .setDescription("🤖 **Live Server Tracking**\\n\\n**IP:** \`KryloSmp.play.hosting\`\\n**Version:** \`v5.0.0\`\\n\\n**MOTD:**\\n\`\`\`\\n" + motd + "\\n\`\`\`")
          .addFields(
            { name: "👥 Players Online (" + onlineCount + "/" + maxCount + ")", value: playerList, inline: false },
            { name: '🕒 Last Updated', value: "<t:" + unixTime + ":R>", inline: true }
          )
          .setFooter({ text: 'Auto-updating every 20 seconds' })
          .setTimestamp();

        client.user.setActivity("KryloSMP: " + onlineCount + "/" + maxCount, { type: 0 });
      } else {
        embed
          .setColor(0xFF3333)
          .setTitle('🔴 KryloSMP Server is OFFLINE')
          .setDescription('The Minecraft server is currently stopped or restarting.')
          .addFields(
            { name: '📡 Connection IP', value: "\`KryloSmp.play.hosting\`", inline: false },
            { name: '🕒 Last Updated', value: "<t:" + unixTime + ":R>", inline: true }
          )
          .setFooter({ text: 'Auto-updating every 20 seconds' })
          .setTimestamp();

        client.user.setActivity('KryloSMP (Offline)', { type: 0 });
      }

      try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        for (const [, msg] of botMessages) {
          await msg.delete().catch(() => {});
        }
      } catch (err) {}

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.warn('[Live Status] Error updating status:', err.message);
    }
  };

  await updateStatus();
  setInterval(updateStatus, 20000);
}\n\n`;

  code = code.substring(0, startIdx) + newFunctionContent + code.substring(endIdx);
  fs.writeFileSync('index.js', code);
  console.log('✅ Replaced startLiveStatusUpdate function without template string issues!');
}
