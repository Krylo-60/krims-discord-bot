import fs from 'fs';

const indexPath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');

const target = `    // --- Self-Assign Notification and Community Roles ---
    if (customId.startsWith('selfrole_')) {
      const selfRoleMap = {
        selfrole_bot_dev: { id: '1561181304115044424', name: '💻 Bot Developer', free: true },
        selfrole_admin: { id: '1561181303078916166', name: '🤖 Community Admin' },
        selfrole_smp: { id: '1561181301292277791', name: '🎮 SMP / Minecraft Owner' },
        selfrole_updates: { id: '1561181297899081758', name: '📢 Bot Updates & Drops', ping: true },
        selfrole_announcement: { id: '1561181297899081758', name: '📢 Bot Updates & Drops', ping: true },
        selfrole_beta: { id: '1561181299010568194', name: '🚀 Beta Announcements', ping: true },
        selfrole_uptime: { id: '1561181300109484052', name: '🌐 Uptime & Maintenance Alerts', ping: true },
        selfrole_giveaway: { name: '🎁 Giveaways', ping: true },
        selfrole_event: { name: '🎪 Events', ping: true },
        selfrole_builder: { name: '🏰 Builder', ping: false },
        selfrole_pvp: { name: '⚔️ PvP Warrior', ping: false }
      };
      const roleInfo = selfRoleMap[customId];
      if (roleInfo) {
        let role = null;
        if (roleInfo.id) {
          role = interaction.guild.roles.cache.get(roleInfo.id);
        }
        if (!role) {
          role = interaction.guild.roles.cache.find(r => 
            r.name.toLowerCase() === roleInfo.name.toLowerCase() ||
            r.name.toLowerCase().includes(roleInfo.name.toLowerCase().replace(/[^a-z]/gi, '')) ||
            (roleInfo.free && r.name.toLowerCase().includes('bot developer'))
          );
        }
        if (!role && !roleInfo.id) {
          role = await interaction.guild.roles.create({ name: roleInfo.name, mentionable: !!roleInfo.ping }).catch(() => null);
        }
        if (role) {
          if (interaction.member.roles.cache.has(role.id)) {
            await interaction.member.roles.remove(role).catch(() => {});
            return interaction.reply({ content: \`➖ **Role Removed!** You no longer have the **\${role.name}** role.\`, flags: 64 });
          } else {
            await interaction.member.roles.add(role).catch(() => {});
            const welcomeExtra = roleInfo.free ? \`\\n💻 *You now have developer & bot integrator access across the Krims ecosystem for 100% free!*\` : '';
            return interaction.reply({ content: \`🎉 **Role Claimed!** You now have the **\${role.name}** role!\${welcomeExtra}\`, flags: 64 });
          }
        }
      }
    }`;

const replacement = `    // --- Self-Assign Notification and Community Roles ---
    if (customId === 'selfrole_bot_dev') {
      return interaction.reply({
        content: '🔒 **Application Required:** The **💻 Bot Developer** role is NOT a free handout. It is strictly earned by verified developers and bot contributors. Please submit an application in <#1561390592997593129> or open a Developer Application ticket in <#1561175631067226232>!',
        flags: 64
      });
    }

    if (customId.startsWith('selfrole_')) {
      const selfRoleMap = {
        selfrole_updates: { id: '1561181297899081758', name: '📢 Bot Updates & Drops', ping: true },
        selfrole_announcement: { id: '1561181297899081758', name: '📢 Bot Updates & Drops', ping: true },
        selfrole_giveaway: { id: '1569122005213642814', name: '🎉 Giveaway Alerts', ping: true },
        selfrole_event: { id: '1569122006304161893', name: '🎪 Community Events', ping: true },
        selfrole_uptime: { id: '1561181300109484052', name: '🌐 Uptime & Maintenance Alerts', ping: true },
        selfrole_beta: { id: '1561181299010568194', name: '🚀 Beta Announcements', ping: true },
        selfrole_chat_reviver: { id: '1569122007432298687', name: '💬 Chat Reviver', ping: false },
        selfrole_creator: { id: '1569122009512939640', name: '🎨 Creator & Media', ping: false },
        selfrole_admin: { id: '1561181303078916166', name: '🤖 Community Admin', ping: false },
        selfrole_smp: { id: '1561181301292277791', name: '🎮 SMP / Minecraft Owner', ping: false },
        selfrole_pvp: { id: '1569122010209058876', name: '⚔️ PvP / Gamer', ping: false },
        selfrole_builder: { id: '1569122010909515776', name: '🔨 Builder', ping: false },
        selfrole_java: { id: '1569122011652034590', name: '☕ Java Player', ping: false },
        selfrole_bedrock: { id: '1569122012746748006', name: '📱 Bedrock Player', ping: false }
      };
      const roleInfo = selfRoleMap[customId];
      if (roleInfo) {
        let role = null;
        if (roleInfo.id) {
          role = interaction.guild.roles.cache.get(roleInfo.id);
        }
        if (!role) {
          role = interaction.guild.roles.cache.find(r => 
            r.name.toLowerCase() === roleInfo.name.toLowerCase() ||
            r.name.toLowerCase().includes(roleInfo.name.toLowerCase().replace(/[^a-z]/gi, ''))
          );
        }
        if (!role && !roleInfo.id) {
          role = await interaction.guild.roles.create({ name: roleInfo.name, mentionable: !!roleInfo.ping }).catch(() => null);
        }
        if (role) {
          if (interaction.member.roles.cache.has(role.id)) {
            await interaction.member.roles.remove(role).catch(() => {});
            return interaction.reply({ content: \`➖ **Role Removed!** You no longer have the **\${role.name}** role.\`, flags: 64 });
          } else {
            await interaction.member.roles.add(role).catch(() => {});
            return interaction.reply({ content: \`🎉 **Role Added!** You now have the **\${role.name}** role!\`, flags: 64 });
          }
        }
      }
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('SUCCESS: Patched selfrole block in index.js');
} else {
  console.error('Target not found in index.js');
}
