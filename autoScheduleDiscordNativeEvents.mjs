import { Client, GatewayIntentBits, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildScheduledEvents]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n📅 SCHEDULING DISCORD NATIVE MONTHLY ADMIN ABUSE EVENT...`);
    const existingEvents = await guild.scheduledEvents.fetch();

    const hasAbuseEvent = existingEvents.some(e => e.name.toLowerCase().includes('admin abuse'));

    if (!hasAbuseEvent) {
      // Calculate next 1st of month at 18:00
      const now = new Date();
      let eventYear = now.getFullYear();
      let eventMonth = now.getMonth();

      // If today is past the 1st of August at 18:00, schedule for Sept 1st
      if (now.getDate() > 1 || (now.getDate() === 1 && now.getHours() >= 18)) {
        eventMonth += 1;
        if (eventMonth > 11) {
          eventMonth = 0;
          eventYear += 1;
        }
      }

      const scheduledTime = new Date(eventYear, eventMonth, 1, 18, 0, 0);

      const createdEvent = await guild.scheduledEvents.create({
        name: '🔥 Monthly Admin Abuse & New Features Event',
        scheduledStartTime: scheduledTime,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        entityMetadata: { location: 'krylosmp.play.hosting' },
        description: 'Official Monthly Admin Abuse Event, OP Drop Parties, Boss Mobs, and KryloSMP New Feature Releases!',
        image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80'
      });

      console.log(`✅ Successfully created native Discord Scheduled Event: "${createdEvent.name}" for ${scheduledTime.toISOString()}`);
    } else {
      console.log(`ℹ️ Native Discord Scheduled Event for Admin Abuse already exists.`);
    }

  } catch (err) {
    console.error('Error creating scheduled event:', err.message);
  }

  client.destroy();
});

client.login(token);
