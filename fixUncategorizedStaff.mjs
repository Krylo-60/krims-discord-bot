import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  try {
    const krishivGuild = await client.guilds.fetch('1531792924055048292').catch(() => null);
    if (krishivGuild) {
      const channels = await krishivGuild.channels.fetch();
      const modCh = channels.get('1531794373862227998');
      
      let staffCat = channels.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('staff'));
      if (!staffCat) {
        staffCat = await krishivGuild.channels.create({
          name: '🛡️ STAFF ONLY',
          type: ChannelType.GuildCategory
        });
      }
      
      if (modCh && staffCat) {
        await modCh.setParent(staffCat.id);
        console.log(`✅ Moved #moderator-only into "${staffCat.name}" category!`);
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
