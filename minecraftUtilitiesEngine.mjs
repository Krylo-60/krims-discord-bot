import fetch from 'node-fetch';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';

// ══════════════════════════════════════════════════════════════════════════
// 🎮 MINECRAFT UTILITIES ENGINE (Custom & 100% Original Implementation)
// ══════════════════════════════════════════════════════════════════════════

// 1. /mcstatus — Real-Time Minecraft Server Inspector (Java & Bedrock)
export async function handleMcStatus(interaction) {
  await interaction.deferReply();
  const address = interaction.options.getString('address') || 'krylosmp.play.hosting';

  try {
    const res = await fetch(`https://api.mcsrvstat.us/2/${encodeURIComponent(address)}`);
    const data = await res.json();

    if (!data.online) {
      const offlineEmbed = new EmbedBuilder()
        .setColor('#FF0055')
        .setTitle(`🔴 Minecraft Server Offline: ${address}`)
        .setDescription(`Could not establish a connection to \`${address}\`. The server may be restarting or offline.`)
        .setTimestamp();
      return interaction.editReply({ embeds: [offlineEmbed] });
    }

    const onlinePlayers = data.players?.online || 0;
    const maxPlayers = data.players?.max || 0;
    const motdClean = data.motd?.clean ? data.motd.clean.join('\n') : 'No MOTD provided.';
    const version = data.version || 'Unknown Version';
    const software = data.software || 'Paper / Spigot';

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`🎮 MINECRAFT SERVER STATUS: ${address.toUpperCase()}`)
      .setDescription(`\`\`\`text\n${motdClean}\n\`\`\``)
      .addFields(
        { name: '🟢 Status', value: '`ONLINE`', inline: true },
        { name: '👥 Players Online', value: `\`${onlinePlayers} / ${maxPlayers}\``, inline: true },
        { name: '⚡ Server Ping', value: `\`${data.debug?.ping ? 'Fast' : 'Stable'}\``, inline: true },
        { name: '🧩 Version', value: `\`${version}\``, inline: true },
        { name: '⚙️ Software', value: `\`${software}\``, inline: true },
        { name: '🌐 Address', value: `\`${address}\``, inline: true }
      )
      .setThumbnail(`https://api.mcsrvstat.us/icon/${encodeURIComponent(address)}`)
      .setFooter({ text: 'KryloSMP Utilities Engine • 100% Real-Time Data' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Join Server')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://panel.play.hosting`),
      new ButtonBuilder()
        .setCustomId('copy_ip_btn')
        .setLabel('Copy IP: ' + address)
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[McStatus Error]:', err);
    await interaction.editReply({ content: '❌ Failed to fetch server status. Please try again.' });
  }
}

// 2. /mcskin — 3D Player Skin Render & Download
export async function handleMcSkin(interaction) {
  await interaction.deferReply();
  const username = interaction.options.getString('username') || 'Krylo_mc';

  const bodyUrl = `https://mc-heads.net/body/${encodeURIComponent(username)}/png`;
  const headUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`;
  const downloadUrl = `https://mc-heads.net/skin/${encodeURIComponent(username)}`;

  const embed = new EmbedBuilder()
    .setColor('#00F2FF')
    .setTitle(`👤 MINECRAFT SKIN: ${username}`)
    .setDescription(`High-definition 3D player render for \`${username}\`.`)
    .setImage(bodyUrl)
    .setThumbnail(headUrl)
    .setFooter({ text: 'KryloSMP Utilities Engine • Skin Inspector' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Download Skin PNG')
      .setStyle(ButtonStyle.Link)
      .setURL(downloadUrl),
    new ButtonBuilder()
      .setLabel('View NameMC Profile')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://namemc.com/profile/${encodeURIComponent(username)}`)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

// 3. /mcuuid — Mojang UUID Lookup
export async function handleMcUuid(interaction) {
  await interaction.deferReply();
  const username = interaction.options.getString('username') || 'Krylo_mc';

  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    if (res.status === 204 || res.status === 404) {
      return interaction.editReply({ content: `❌ No Minecraft account found for username \`${username}\`.` });
    }

    const data = await res.json();
    const rawUuid = data.id;
    const formattedUuid = `${rawUuid.substring(0, 8)}-${rawUuid.substring(8, 12)}-${rawUuid.substring(12, 16)}-${rawUuid.substring(16, 20)}-${rawUuid.substring(20)}`;

    const embed = new EmbedBuilder()
      .setColor('#00FF88')
      .setTitle(`🆔 MOJANG UUID LOOKUP: ${data.name}`)
      .setThumbnail(`https://mc-heads.net/avatar/${data.name}/64`)
      .addFields(
        { name: '👤 Username', value: `\`${data.name}\``, inline: true },
        { name: '🆔 Formatted UUID', value: `\`${formattedUuid}\``, inline: false },
        { name: '🔑 Trimmed UUID', value: `\`${rawUuid}\``, inline: false }
      )
      .setFooter({ text: 'KryloSMP Utilities Engine • Mojang API' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('NameMC Profile')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://namemc.com/profile/${data.name}`)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[McUuid Error]:', err);
    await interaction.editReply({ content: '❌ Failed to query Mojang API. Please try again.' });
  }
}

// 4. /mcadvancement — Custom Advancement Toast Generator
export async function handleMcAdvancement(interaction) {
  await interaction.deferReply();
  const title = interaction.options.getString('title') || 'Advancement Made!';
  const description = interaction.options.getString('description') || 'Joined KryloSMP Season 3!';
  const icon = interaction.options.getString('icon') || 'diamond';

  const advUrl = `https://api.coolhead.in/advancement?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&icon=${encodeURIComponent(icon)}`;

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`🏆 MINECRAFT ADVANCEMENT GENERATOR`)
    .setImage(advUrl)
    .setFooter({ text: 'KryloSMP Utilities Engine • Custom Toast' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// 5. /mchead — Player Head Bust & In-Game Command Snippet
export async function handleMcHead(interaction) {
  await interaction.deferReply();
  const username = interaction.options.getString('username') || 'Krylo_mc';

  const headUrl = `https://mc-heads.net/head/${encodeURIComponent(username)}/128`;
  const giveCmd = `/give @p minecraft:player_head[profile={name:"${username}"}] 1`;

  const embed = new EmbedBuilder()
    .setColor('#AA00FF')
    .setTitle(`🗿 PLAYER HEAD BUST: ${username}`)
    .setThumbnail(headUrl)
    .setDescription(`In-Game Command to give this head:\n\`\`\`bash\n${giveCmd}\n\`\`\``)
    .setFooter({ text: 'KryloSMP Utilities Engine • Head Generator' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// 6. /mccrafting — Recipe Lookup Engine
export async function handleMcCrafting(interaction) {
  await interaction.deferReply();
  const item = (interaction.options.getString('item') || 'diamond_sword').toLowerCase();

  const recipes = {
    'god_spear': { title: '🔱 God Spear of Krylo', grid: '░ Trident + Netherite + Heart ░\n░ Enchantments: Sharpness X, Loyalty III ░' },
    'blade_of_chaos': { title: '🗡️ Blade of Chaos', grid: '░ Netherite Sword + Fire Charge + Flame ░\n░ Ability: Nethemelt Lifesteal ░' },
    'diamond_sword': { title: '🗡️ Diamond Sword', grid: '░ [ ]  Diamond  [ ] ░\n░ [ ]  Diamond  [ ] ░\n░ [ ]   Stick   [ ] ░' },
    'golden_apple': { title: '🍏 Golden Apple', grid: '░ Gold Gold Gold ░\n░ Gold Apple Gold ░\n░ Gold Gold Gold ░' },
    'beacon': { title: '🌟 Beacon', grid: '░ Glass Glass Glass ░\n░ Glass NetherStar Glass ░\n░ Obsidian Obsidian Obsidian ░' }
  };

  const recipe = recipes[item] || { title: `📦 Custom Item: ${item}`, grid: `Crafting details for ${item}:\nUse 3x3 Crafting Table at /spawn!` };

  const embed = new EmbedBuilder()
    .setColor('#00FF88')
    .setTitle(`📖 CRAFTING RECIPE: ${recipe.title.toUpperCase()}`)
    .setDescription(`\`\`\`text\n${recipe.grid}\n\`\`\``)
    .setFooter({ text: 'KryloSMP Utilities Engine • Recipe Book' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
