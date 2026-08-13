import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// 1. Ensure verification success message includes the :KryloSMP: emoji button for Tier 1 activation
const KRYLO_EMOJI_ID = '1530370298262720722';

// Add interaction listener for KryloSMP tier button if clicked
const tierBtnHandler = `
    if (customId === 'claim_tier1_krylo' || customId === 'verify_member') {
      try {
        let verifiedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes('verified')) ||
                           interaction.guild.roles.cache.find(r => r.name.includes('Starter'));
        if (verifiedRole && interaction.member) {
          await interaction.member.roles.add(verifiedRole).catch(() => {});
        }
        let ogRole = interaction.guild.roles.cache.find(r => r.name.includes('OG Member'));
        if (ogRole && interaction.member) {
          await interaction.member.roles.add(ogRole).catch(() => {});
        }

        const channels = await interaction.guild.channels.fetch();
        const starterChannels = channels.filter(c => c && c.isTextBased() && c.type !== ChannelType.GuildCategory);

        await interaction.reply({
          content: \`<:KryloSMP:${KRYLO_EMOJI_ID}> **TIER 1 STARTER UNLOCKED!**\\n\\n\` +
                   \`Welcome to **KryloSMP**! You have received your Tier 1 Starter Rank.\\n\` +
                   \`🔓 All Starter channels have been unlocked for you! Start chatting in <#\${channels.find(c => c?.name?.includes('general'))?.id || '0'}>!\\n\\n\` +
                   \`🔒 *Earn activity levels (Level 10/25/50) by chatting to unlock advanced PvP, Tournament & Trader channels!*\`,
          ephemeral: true
        });
      } catch (err) {
        console.error('Tier 1 claim error:', err.message);
      }
      return;
    }
`;

if (!code.includes('claim_tier1_krylo')) {
  code = code.replace(`if (customId === 'open_ticket') {`, `${tierBtnHandler}\n    if (customId === 'open_ticket') {`);
}

// 2. Owner Auto-Role Enforcer on messageCreate
const ownerAutoRoleCheck = `
  // Owner Auto-Role Protection: Always ensure server owner has all roles
  if (message.guild && message.author.id === message.guild.ownerId) {
    try {
      const botRole = message.guild.members.me.roles.highest;
      const unassignedRoles = message.guild.roles.cache.filter(r => 
        r.name !== '@everyone' && 
        !r.managed && 
        r.position < botRole.position && 
        !message.member.roles.cache.has(r.id)
      );
      if (unassignedRoles.size > 0) {
        for (const [, role] of unassignedRoles) {
          await message.member.roles.add(role).catch(() => {});
        }
      }
    } catch {}
  }
`;

if (!code.includes('Owner Auto-Role Protection')) {
  code = code.replace(`client.on('messageCreate', async (message) => {`, `client.on('messageCreate', async (message) => {\n${ownerAutoRoleCheck}`);
}

fs.writeFileSync('index.js', code);
console.log('✅ Updated index.js with KryloSMP Tier 1 emoji unlock button & owner auto-role protection!');
