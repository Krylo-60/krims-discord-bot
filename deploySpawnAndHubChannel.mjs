import { 
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_IDS = ['1524878881918685405', '1538225337048236082'];

client.once('ready', async () => {
  console.log(`[Discord] Logged in as ${client.user.tag}`);

  for (const guildId of GUILD_IDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) {
        console.warn(`Guild ${guildId} not found`);
        continue;
      }

      console.log(`[+] Deploying #🏛️┃spawn-and-hub to ${guild.name} (${guildId})...`);
      const channels = await guild.channels.fetch();
      
      let spawnChannel = channels.find(c => c && c.name && c.name.includes('spawn-and-hub'));
      
      if (!spawnChannel) {
        // Find INFORMATION category if exists
        const infoCat = channels.find(c => c && c.type === ChannelType.GuildCategory && (c.name.includes('INFORMATION') || c.name.includes('START HERE')));
        
        spawnChannel = await guild.channels.create({
          name: '🏛️┃spawn-and-hub',
          type: ChannelType.GuildText,
          parent: infoCat ? infoCat.id : null,
          topic: '🏛️ Official KryloSMP Spawn Hub, Interactive NPC Directory, and Server Warps'
        });
        console.log(`Created #🏛️┃spawn-and-hub in ${guild.name}`);
      }

      // Purge old bot messages in channel
      try {
        const fetched = await spawnChannel.messages.fetch({ limit: 10 });
        if (fetched.size > 0) {
          await spawnChannel.bulkDelete(fetched).catch(() => {});
        }
      } catch (e) {}

      // Embed 1: Master Spawn Hub Overview
      const embed1 = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setAuthor({ name: '👑 KryloSMP Master Network • Spawn & Hub System', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
        .setTitle('🏛️ OFFICIAL KRYLOSMP SPAWN HUB & NPC DIRECTORY')
        .setDescription(
          `Welcome to the heart of **KryloSMP**! The Spawn Hub is the central gathering place where all players can navigate between worlds, trade with interactive NPCs, and access quick features.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📍 **FAST TELEPORTATION COMMANDS**\n` +
          `• \`/spawn\` — Teleports back to the Spawn Hub safezone (3s timer).\n` +
          `• \`/sethome [name]\` & \`/home [name]\` — Save your base coordinates.\n` +
          `• \`/tpa [player]\` — Request teleportation to a friend.\n` +
          `• \`/rtp\` — Teleport randomly into the wilderness survival world.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🤖 **INTERACTIVE SPAWN NPCS & LOCATIONS**\n` +
          `Walk up to any NPC at spawn and **Right-Click** to interact:\n\n` +
          `👑 **\`[KRYLO SHOP NPC]\`** *(North Pedestal)*\n` +
          `• Opens the in-game GUI store (\`/shop\`) and web store link for ranks, keys, and cosmetics.\n\n` +
          `⚔️ **\`[FFA ARENA NPC]\`** *(East Pedestal)*\n` +
          `• Warps you into the instant PvP Arena with Netherite kits and **+100 KC** per kill.\n\n` +
          `🏝️ **\`[SKYBLOCK NPC]\`** *(South Pedestal)*\n` +
          `• Launches your private floating island (\`/is\`), minion upgrades, and co-op teams.\n\n` +
          `🌐 **\`[DISCORD & RULES NPC]\`** *(West Pedestal)*\n` +
          `• Sends server connection info, discord invites, and safety guidelines in chat.`
        )
        .addFields(
          { name: '☕ Java Server IP', value: '`KryloSmp.play.hosting:25565`', inline: true },
          { name: '🪨 Bedrock Port', value: '`19132`', inline: true },
          { name: '🎮 Supported Versions', value: '`1.20.x - 1.21.x`', inline: true }
        )
        .setFooter({ text: 'KryloSMP Season 1 • Designed by Krylo & Krishiv' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('🛍️ Web Store')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp-store.web.app'),
        new ButtonBuilder()
          .setLabel('📊 Player Portal')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app'),
        new ButtonBuilder()
          .setLabel('💬 Discord Invite')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.gg/xYmyPxSx7u')
      );

      await spawnChannel.send({ embeds: [embed1], components: [row] });
      console.log(`[+] Posted Master Spawn Hub Embed in ${guild.name} (#${spawnChannel.name})`);
    } catch (err) {
      console.error(`Error in guild ${guildId}:`, err);
    }
  }

  console.log('🎉 Discord Spawn Channel Deployment Complete!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
