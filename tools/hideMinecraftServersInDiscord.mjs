import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;

const WELCOME_CHAN_ID = '1549882279273308190';
const WELCOME_MSG_ID = '1550899188542341162';

const EARLY_ACCESS_CHAN_ID = '1550901949853863942';
const EARLY_ACCESS_MSG_ID = '1550901956493443269';

async function updateWelcome() {
  console.log('1. Updating #welcome to remove all KSMP and MC server mentions...');
  
  const embed = {
    color: 0x00E5FF,
    title: "👋 Welcome to Krylo's Skybase!",
    description: 
      "Welcome to the official video production studio and community hub for **[Krylo MC](https://www.youtube.com/@krylomcyt?sub_confirmation=1)**!\n" +
      "Whether you're here to audition for video film shoots, catch early video previews, or hang out in the community lounge, here is everything you need to know:\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    fields: [
      {
        name: "🎬 Skybase Production Studios & Film Crew",
        value: 
          "• We actively produce scripted Minecraft YouTube videos, challenges, and machinimas!\n" +
          "• Interested in acting or building for videos? Apply in <#1550902305568718948> when auditions are open!\n" +
          "• Successful applicants earn the **@🎬 Skybase Video Crew** role and private studio access.",
        inline: false
      },
      {
        name: "🍿 Early Video Access & Production Lounge",
        value: 
          "• Members of our video team and valued supporters get first looks at upcoming video releases in <#1550901949853863942>!\n" +
          "• Discuss new video ideas, vote on thumbnails, and participate in community production projects.",
        inline: false
      },
      {
        name: "🔴 Unlock Subscriber Perks & Higher Reply Chance",
        value: 
          "• Head over to <#1549918052513095682> to verify your subscription to **[Krylo MC](https://www.youtube.com/@krylomcyt?sub_confirmation=1)**!\n" +
          "• Subscribers unlock hoisted roles and a much higher chance of Krylo replying in chat!",
        inline: false
      },
      {
        name: "🧭 Quick Navigation",
        value: 
          "• <#1549882276278435841> ➔ Server Rules & Code of Conduct\n" +
          "• <#1549882278245564546> ➔ Roles Directory & Badges\n" +
          "• <#1550878832758751357> ➔ YouTube Video Broadcasts (Click Follow!)\n" +
          "• <#1550878788467040266> ➔ Community Suggestions\n" +
          "• <#1550878971527176222> ➔ Bug & Issue Reports",
        inline: false
      }
    ],
    image: {
      url: "https://krims-code-chatbot.vercel.app/skybase_banner.png"
    },
    footer: {
      text: "Krylo's Skybase • Official Production Studio & Community",
      icon_url: "https://krims-code-chatbot.vercel.app/skybase_logo.png"
    },
    timestamp: new Date().toISOString()
  };

  const res = await fetch(`https://discord.com/api/v10/channels/${WELCOME_CHAN_ID}/messages/${WELCOME_MSG_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ embeds: [embed] })
  });
  console.log('Patch #welcome status:', res.status);
}

async function updateEarlyAccess() {
  console.log('2. Updating #early-access to remove KSMP mentions...');
  
  const embed = {
    color: 0xFFA502,
    title: "🍿 Skybase Early Access — VIP Video Lounge",
    description: 
      "Welcome to the exclusive **Skybase Early Access Lounge**!\n\n" +
      "✨ **What You Get Here:**\n" +
      "• 🎥 **Early Video Links:** Watch upcoming YouTube videos before they go public!\n" +
      "• 🎬 **Behind-The-Scenes:** Outtakes, bloopers, and unedited recording moments.\n" +
      "• 🎨 **Thumbnail & Title Voting:** Help Krylo pick the best thumbnails and titles for new releases!\n" +
      "• 🤫 **Exclusive Teasers:** First looks at upcoming video series and film projects.\n\n" +
      "⚠️ *Please do not leak unlisted links or spoilers outside this channel! Enjoy the early view!*",
    footer: {
      text: "Krylo's Skybase • Early Access Club",
      icon_url: "https://krims-code-chatbot.vercel.app/skybase_logo.png"
    }
  };

  const res = await fetch(`https://discord.com/api/v10/channels/${EARLY_ACCESS_CHAN_ID}/messages/${EARLY_ACCESS_MSG_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ embeds: [embed] })
  });
  console.log('Patch #early-access status:', res.status);
}

async function main() {
  await updateWelcome();
  await updateEarlyAccess();
  console.log('\nAll Minecraft server references have been completely hidden from Krylo\'s Skybase!');
}

main().catch(console.error);
