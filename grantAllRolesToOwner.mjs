import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n👑 Granting ALL ROLES to Server Owner in ${guild.name}...`);

    // Fetch owner member
    const ownerMember = await guild.members.fetch(guild.ownerId).catch(() => null);
    
    if (!ownerMember) {
      console.error('Could not fetch server owner member!');
      process.exit(1);
    }

    console.log(`Found Owner: ${ownerMember.user.tag} (${ownerMember.id})`);

    const roles = await guild.roles.fetch();
    const botRole = guild.members.me.roles.highest;

    let rolesAssigned = 0;

    for (const [rId, role] of roles) {
      if (role.name === '@everyone') continue;
      // Managed roles (integration/bot roles) cannot be manually assigned
      if (role.managed) continue;
      // Cannot assign roles equal to or higher than bot's highest role
      if (role.position >= botRole.position) continue;

      if (!ownerMember.roles.cache.has(role.id)) {
        try {
          await ownerMember.roles.add(role);
          rolesAssigned++;
          console.log(`  + Assigned role: ${role.name}`);
        } catch (e) {
          console.warn(`  ⚠️ Could not assign ${role.name}: ${e.message}`);
        }
      } else {
        console.log(`  ✓ Already has: ${role.name}`);
      }
    }

    console.log(`\n🏆 Successfully assigned ${rolesAssigned} new roles to ${ownerMember.user.tag}! Now has ALL server roles!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
