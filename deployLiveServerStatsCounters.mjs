import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const GUILDS = [
  '1524878881918685405', // KryloSMP
  '1420991845546332162', // Krylo's Discord server
  '1532574925356007525'  // Krylo Fan Army 👑
];

async function checkActualServerStatus() {
  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch('https://api.mcsrvstat.us/3/KryloSmp.play.hosting');
    if (res.ok) {
      const data = await res.json();
      const motdClean = (data.motd?.clean || []).join(' ').toLowerCase();
      const isOnline = data.online && !motdClean.includes('offline') && data.version !== 'play.hosting';
      return {
        online: isOnline,
        players: data.players?.online || 0,
        version: isOnline ? (data.version || '1.21.x') : '1.21.x'
      };
    }
  } catch (e) {
    console.warn('Ping error:', e.message);
  }
  return { online: false, players: 0, version: '1.21.x' };
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag} - Updating Server Status Channels accurately...`);

  const serverState = await checkActualServerStatus();
  console.log('Live Server Status Detected:', serverState);

  const statusChannelName = serverState.online 
    ? `🟢 ┃ Status: ONLINE (${serverState.players})` 
    : `🔴 ┃ Status: OFFLINE`;

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      console.log(`\nSetting up Stats for: ${guild.name}`);
      const channels = await guild.channels.fetch();

      let statsCat = channels.find(c => c && c.type === ChannelType.GuildCategory && (c.name.includes('STATS') || c.name.includes('SERVER STATS')));
      if (!statsCat) {
        statsCat = await guild.channels.create({
          name: '📊 ━━━ SERVER STATS ━━━ 📊',
          type: ChannelType.GuildCategory,
          position: 0
        });
      }

      const memberCount = guild.memberCount;
      const statChannels = [
        { name: `👥 ┃ Members: ${memberCount}`, key: 'members' },
        { name: statusChannelName, key: 'status' },
        { name: `🎮 ┃ Minecraft: 1.21.x`, key: 'version' },
        { name: `🌐 ┃ KryloSmp.play.hosting`, key: 'ip' }
      ];

      for (let i = 0; i < statChannels.length; i++) {
        const item = statChannels[i];
        let ch = channels.find(c => c && c.parentId === statsCat.id && c.isVoiceBased() && (c.name.includes('Status') || c.name.includes('Members') || c.name.includes('Minecraft') || c.name.includes('KryloSmp')));

        if (item.key === 'status') {
          ch = channels.find(c => c && c.parentId === statsCat.id && c.isVoiceBased() && c.name.includes('Status'));
        }

        if (!ch) {
          ch = await guild.channels.create({
            name: item.name,
            type: ChannelType.GuildVoice,
            parent: statsCat.id,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.Connect],
                allow: [PermissionsBitField.Flags.ViewChannel]
              }
            ]
          });
          console.log(`   [+] Created stat channel: ${ch.name}`);
        } else {
          await ch.setName(item.name).catch(() => {});
          await ch.permissionOverwrites.edit(guild.roles.everyone, {
            Connect: false,
            ViewChannel: true
          }).catch(() => {});
          console.log(`   [~] Updated stat channel: ${ch.name}`);
        }
      }

      console.log(`✅ Live stats updated for ${guild.name}!`);
    } catch (err) {
      console.warn(`Error setting stats for guild ${guildId}:`, err.message);
    }
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
