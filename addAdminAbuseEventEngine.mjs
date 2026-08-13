import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';
const KRYLO_EMOJI_ID = '1530370298262720722';
const KRYLO_EMOJI = `<:KryloSMP:${KRYLO_EMOJI_ID}>`;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n💥 SETTING UP MONTHLY ADMIN ABUSE EVENT CHANNEL & ENGINE...`);
    const channels = await guild.channels.fetch();

    const eventCat = channels.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('event'));

    let abuseCh = channels.find(c => c && c.name && c.name.includes('admin-abuse'));
    if (!abuseCh) {
      abuseCh = await guild.channels.create({
        name: '💥┃admin-abuse-events',
        type: ChannelType.GuildAnnouncement, // News channel with [SERVER] badge
        parent: eventCat ? eventCat.id : null,
        topic: 'Official Monthly KryloSMP Admin Abuse & Chaos Events! Huge Drop Parties, OP Mobs, and Crate Key Giveaways!'
      });
      console.log(`✅ Created #💥┃admin-abuse-events channel!`);
    }

    // Post Monthly Admin Abuse Event Protocol Embed
    const embed = new EmbedBuilder()
      .setTitle(`${KRYLO_EMOJI} 🔥 OFFICIAL MONTHLY ADMIN ABUSE & CHAOS EVENT`)
      .setDescription(
        `Welcome to **#💥┃admin-abuse-events**!\n\n` +
        `Every single month, Owner **Krylo** (` + `<@1414143825538191373>` + `) and the Admin team unleash the **Monthly Admin Abuse Event** live on KryloSMP!\n\n` +
        `> 🎁 **OP Drop Parties:** Netherite, God Armor, and 64x Notch Apples dropped at Spawn!\n` +
        `> ⚔️ **Boss Mob Battles:** Defeat giant Wither & Ender Dragon raids spawned by Krylo!\n` +
        `> 💰 **Massive KryloCoins Giveaway:** Free +5,000 KC and Crate Keys for all online players using \`/bday\` and \`/daily\`!\n` +
        `> 🎮 **Server Connection IP:** \`\`\`krylosmp.play.hosting\`\`\``
      )
      .addFields(
        { name: '📅 Event Schedule', value: 'Occurs automatically on the **1st of every month** at 6:00 PM EST!' },
        { name: '🔔 Grab Event Pings', value: 'Select `@Giveaways Ping` in <#1526685108311031980> to get pinged 1 hour before the drop party starts!' }
      )
      .setColor(0xFF0055)
      .setFooter({ text: 'KryloSMP Monthly Admin Abuse Event • Unstoppable Chaos', iconURL: guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
      new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
    );

    const msg = await abuseCh.send({ embeds: [embed], components: [row] });
    await msg.crosspost().catch(() => {});
    console.log(`✅ Posted and crossposted Monthly Admin Abuse embed in #${abuseCh.name}!`);

    console.log(`\n🏆 MONTHLY ADMIN ABUSE SETUP COMPLETE!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
