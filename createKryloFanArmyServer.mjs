import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    console.log('Attempting to create "Krylo Fan Army 👑" server via Discord API...');
    const newGuild = await client.guilds.create({
      name: 'Krylo Fan Army 👑',
      channels: [
        { name: '👋┃welcome-and-rules', type: ChannelType.GuildText },
        { name: '📢┃announcements', type: ChannelType.GuildText },
        { name: '💬┃fan-chat', type: ChannelType.GuildText },
        { name: '🔴┃youtube-feed', type: ChannelType.GuildText },
        { name: '📸┃fan-art-and-memes', type: ChannelType.GuildText }
      ]
    });

    console.log(`\n🎉 SUCCESS! Created Server: "${newGuild.name}" (Guild ID: ${newGuild.id})`);

    // Create instant invite
    const defaultChannel = newGuild.channels.cache.find(c => c.type === ChannelType.GuildText);
    if (defaultChannel) {
      const invite = await defaultChannel.createInvite({ maxAge: 0, maxUses: 0 });
      console.log(`🔗 Server Invite Link: ${invite.url}`);
    }

  } catch (err) {
    console.error('Guild Creation API Error:', err.message);
    console.log('\nNote: If bot guild creation is restricted by Discord API for non-whitelisted bots, ask the user to create a new server and invite the bot or provide the new Guild ID!');
  }

  client.destroy();
});

client.login(token);
