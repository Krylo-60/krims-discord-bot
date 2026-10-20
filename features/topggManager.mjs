import dotenv from 'dotenv';
dotenv.config();

const BOT_ID = '1523794466740371586';

/**
 * Top.gg Manager
 * Automatically posts live server counts to Top.gg and validates API interactions.
 */
export class TopggManager {
  constructor(client) {
    this.client = client;
    this.token = process.env.TOPGG_TOKEN || null;
    this.lastPostedCount = 0;
    this.timer = null;
  }

  init() {
    if (!this.token) {
      console.log('[Top.gg] No TOPGG_TOKEN provided in environment. Stats auto-posting is idle.');
      return;
    }

    console.log('[Top.gg] Token detected! Initializing Top.gg Auto-Poster & API integration...');
    
    // Post on startup once client is ready
    if (this.client.isReady()) {
      this.postStats();
    } else {
      this.client.once('ready', () => this.postStats());
    }

    // Post whenever the bot joins or leaves a guild
    this.client.on('guildCreate', () => this.postStats());
    this.client.on('guildDelete', () => this.postStats());

    // Recurring 30-minute sync
    this.timer = setInterval(() => {
      this.postStats();
    }, 30 * 60 * 1000);
  }

  async postStats() {
    if (!this.token || !this.client?.guilds) return;

    try {
      const serverCount = this.client.guilds.cache.size;
      const shardCount = this.client.shard?.count || 1;

      console.log(`[Top.gg] Posting live statistics: ${serverCount} servers (shards: ${shardCount})...`);

      // Try v0 standard endpoint
      const res = await fetch(`https://top.gg/api/bots/${BOT_ID}/stats`, {
        method: 'POST',
        headers: {
          'Authorization': this.token.startsWith('Bearer ') ? this.token : this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          server_count: serverCount,
          shard_count: shardCount
        })
      });

      if (res.ok) {
        this.lastPostedCount = serverCount;
        console.log(`[✅ Top.gg] Successfully posted server count (${serverCount}) to Top.gg!`);
      } else {
        const text = await res.text();
        console.warn(`[⚠️ Top.gg] Failed to post stats (HTTP ${res.status}):`, text);
      }
    } catch (err) {
      console.error('[Top.gg] Error posting bot stats:', err.message);
    }
  }

  async checkUserVoted(userId) {
    if (!this.token) return false;
    try {
      const res = await fetch(`https://top.gg/api/bots/${BOT_ID}/check?userId=${userId}`, {
        headers: {
          'Authorization': this.token
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.voted === 1 || data.voted === true;
      }
    } catch (err) {
      console.warn('[Top.gg] Check vote API error:', err.message);
    }
    return false;
  }
}
