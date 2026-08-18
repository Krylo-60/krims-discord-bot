import { 
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ChannelType 
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
      if (!guild) continue;

      console.log(`[+] Deploying #⚔️┃ffa-kill-feed to ${guild.name}...`);
      const channels = await guild.channels.fetch();
      
      let ffaChannel = channels.find(c => c && c.name && c.name.includes('ffa-kill-feed'));
      
      if (!ffaChannel) {
        const pvpCat = channels.find(c => c && c.type === ChannelType.GuildCategory && (c.name.includes('PVP') || c.name.includes('COMMUNITY') || c.name.includes('GAMES')));
        
        ffaChannel = await guild.channels.create({
          name: '⚔️┃ffa-kill-feed',
          type: ChannelType.GuildText,
          parent: pvpCat ? pvpCat.id : null,
          topic: '⚔️ Live KryloSMP FFA Arena Kill Feed, Killstreaks, and Combat Leaderboards'
        });
        console.log(`Created #⚔️┃ffa-kill-feed in ${guild.name}`);
      }

      // Purge old messages
      try {
        const fetched = await ffaChannel.messages.fetch({ limit: 10 });
        if (fetched.size > 0) {
          await ffaChannel.bulkDelete(fetched).catch(() => {});
        }
      } catch (e) {}

      // Embed: FFA Arena Guide & Rules
      const embed = new EmbedBuilder()
        .setColor(0xFF4444)
        .setAuthor({ name: '👑 KryloSMP Combat Network • FFA Arena', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
        .setTitle('⚔️ KRYLOSMP FFA COMBAT ARENA & LEADERBOARD')
        .setDescription(
          `Welcome to the **Free-For-All (FFA) Combat Arena**! Jump in, test your PvP skills with custom Netherite kits, and climb the seasonal combat leaderboard.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🎮 **HOW TO JOIN & PLAY**\n` +
          `• Click the **\`⚔️ [FFA ARENA NPC]\`** at spawn or type **\`/ffa join\`** in-game.\n` +
          `• You receive full **Netherite Gear (Prot 4), Sharp 5 Sword, Bow, Gaps & Pearls**.\n` +
          `• **0 Item Loss:** Your survival inventory is saved and restored safely when you leave!\n\n` +
          `💰 **KILL REWARDS & KILLSTREAKS**\n` +
          `• **+100 KryloCoins** deposited to your wallet on every kill.\n` +
          `• **Killstreak Multipliers:** Reach 5, 10, and 20 killstreaks to trigger server-wide broadcasts and bonus rewards!\n` +
          `• **Instant Respawn:** When you die, you respawn immediately with full gear refreshed.`
        )
        .addFields(
          { name: '📍 Join Command', value: '`/ffa join`', inline: true },
          { name: '🏃 Exit Command', value: '`/spawn` or `/ffa leave`', inline: true },
          { name: '💎 Kill Reward', value: '`+100 KryloCoins`', inline: true }
        )
        .setFooter({ text: 'KryloSMP PvP Network • Season 1' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('📊 View Player Database')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app'),
        new ButtonBuilder()
          .setLabel('🛍️ Web Store & Perks')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp-store.web.app')
      );

      await ffaChannel.send({ embeds: [embed], components: [row] });
      console.log(`[+] Posted FFA Guide Embed in ${guild.name} (#${ffaChannel.name})`);
    } catch (err) {
      console.error(`Error deploying FFA channel in guild ${guildId}:`, err.message);
    }
  }

  console.log('🎉 FFA Channel & Embed Deployment Complete!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
