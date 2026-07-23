import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    const generalCh = channels.find(c => c && c.name && c.name.includes('general-chat') && c.type === ChannelType.GuildText);

    if (!generalCh) {
      console.error("[-] General chat channel not found!");
      process.exit(1);
    }

    console.log(`[+] Fetching messages from #${generalCh.name}...`);
    const fetched = await generalCh.messages.fetch({ limit: 100 });
    console.log(`[+] Fetched ${fetched.size} messages.`);

    const spamMessages = fetched.filter(m => {
      if (m.author.id !== client.user.id) return false;
      const text = m.content || '';
      const embedTitle = m.embeds && m.embeds[0] && m.embeds[0].title ? m.embeds[0].title : '';
      const embedDesc = m.embeds && m.embeds[0] && m.embeds[0].description ? m.embeds[0].description : '';

      return text.includes('PaperMC Server Auto-Upgrade') || 
             embedTitle.includes('Server Update Warning') || 
             embedTitle.includes('Server Upgrade Complete') ||
             embedDesc.includes('PaperMC Server Auto-Upgrade Alert');
    });

    console.log(`[+] Found ${spamMessages.size} PaperMC warning spam messages to delete.`);

    if (spamMessages.size > 0) {
      const deleted = await generalCh.bulkDelete(spamMessages, true);
      console.log(`[✅] Successfully purged ${deleted.size} spam warning messages from #${generalCh.name}!`);
    } else {
      console.log('[!] No spam messages found to delete.');
    }

    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error purging messages:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
