import fetch from 'node-fetch';

async function resolveBothChannels() {
  const handles = ['@Krylo-60', '@KryloBlox60'];
  const channelMap = {};

  for (const handle of handles) {
    try {
      const url = `https://www.youtube.com/${handle}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();

      const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
      if (channelIdMatch) {
        channelMap[handle] = channelIdMatch[1];
        console.log(`✅ Resolved ${handle} -> Channel ID: ${channelIdMatch[1]}`);
        
        // Fetch RSS feed to get latest video details if any
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
        const rssRes = await fetch(rssUrl);
        const xml = await rssRes.text();

        const videoMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g);
        if (videoMatches && videoMatches.length > 0) {
          const latestEntry = videoMatches[0];
          const title = (latestEntry.match(/<title>(.*?)<\/title>/) || [])[1];
          const link = (latestEntry.match(/<link rel="alternate" href="(.*?)"\/>/) || [])[1];
          const videoId = (latestEntry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
          console.log(`   📹 Latest Video for ${handle}: "${title}" (${link})`);
        } else {
          console.log(`   No videos uploaded yet on ${handle}. Ready for future uploads!`);
        }
      } else {
        console.error(`❌ Could not resolve Channel ID for ${handle}`);
      }
    } catch (err) {
      console.error(`Error resolving ${handle}:`, err.message);
    }
  }

  console.log(`\nFinal Channel Map:`, JSON.stringify(channelMap, null, 2));
}

resolveBothChannels();
