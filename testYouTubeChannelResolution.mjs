import fetch from 'node-fetch';

async function testFetchKryloYT() {
  const handles = ['@Krylo-60', '@aCookieGod', 'Krylo-60', 'Krylo'];

  for (const handle of handles) {
    try {
      const url = `https://www.youtube.com/${handle}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      
      const channelIdMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
      if (channelIdMatch) {
        console.log(`✅ Found Channel ID for ${handle}: ${channelIdMatch[1]}`);
        
        // Test RSS
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
        const rssRes = await fetch(rssUrl);
        const xml = await rssRes.text();

        const videoMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g);
        if (videoMatches && videoMatches.length > 0) {
          const latestEntry = videoMatches[0];
          const title = (latestEntry.match(/<title>(.*?)<\/title>/) || [])[1];
          const link = (latestEntry.match(/<link rel="alternate" href="(.*?)"\/>/) || [])[1];
          const videoId = (latestEntry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];

          console.log(`   📹 Latest Video: "${title}"`);
          console.log(`   🔗 Link: ${link}`);
          console.log(`   🆔 Video ID: ${videoId}`);
        } else {
          console.log(`   No videos found in RSS.`);
        }
      } else {
        console.log(`❌ Could not resolve Channel ID for ${handle}`);
      }
    } catch (err) {
      console.error(`Error for ${handle}:`, err.message);
    }
  }
}

testFetchKryloYT();
