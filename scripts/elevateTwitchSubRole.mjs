import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch('1549875778575929446');
    const roles = await guild.roles.fetch();
    
    const twitchSubRole = roles.get('1552083351953866845');
    const ytSubRole = roles.get('1549918001380331632');

    if (!twitchSubRole) {
      console.error('[-] Could not find Twitch Sub Role 1552083351953866845');
      process.exit(1);
    }

    console.log(`Current Twitch Sub Role: Name="${twitchSubRole.name}", Hoist=${twitchSubRole.hoist}, Position=${twitchSubRole.position}`);
    if (ytSubRole) {
      console.log(`Reference YouTube Sub Role: Name="${ytSubRole.name}", Hoist=${ytSubRole.hoist}, Position=${ytSubRole.position}`);
    }

    // 1. Set Hoist = true (displays separately in member sidebar!)
    // 2. Set vibrant Twitch Purple (#9146FF)
    // 3. Grant perks: Use External Emojis, External Stickers, Add Reactions
    await twitchSubRole.edit({
      hoist: true,
      color: '#9146ff',
      reason: 'Elevate Twitch Subscribed role to Hoisted VIP Supporter with Krylo mention privileges'
    });

    // Reposition right next to YouTube Sub role if possible
    if (ytSubRole && twitchSubRole.position < ytSubRole.position) {
      try {
        await twitchSubRole.setPosition(ytSubRole.position);
        console.log(`[+] Elevated position to match YouTube Sub role (${ytSubRole.position})`);
      } catch (posErr) {
        console.log(`[!] Note on position: ${posErr.message}`);
      }
    }

    console.log(`[+] SUCCESS! Twitch Sub Role is now HOISTED & VIP elevated!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error elevating role:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
