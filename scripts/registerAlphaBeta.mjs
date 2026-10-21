import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { registerAlphaBetaCommands } from '../features/alphaBetaSuite.mjs';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  console.log('[+] Registering exclusive Alpha & Beta command suites in Support Server...');
  await registerAlphaBetaCommands(client);
  console.log('[+] Done! Exiting.');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
