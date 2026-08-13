import fetch from 'node-fetch';

async function testYouTubeRSS(channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw') {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const res = await fetch(url);
    const xmlText = await res.text();
    
    console.log(`Fetched RSS status: ${res.status}`);
    console.log(`XML snippet:`, xmlText.substring(0, 500));
  } catch (err) {
    console.error('Error fetching RSS:', err.message);
  }
}

testYouTubeRSS();
