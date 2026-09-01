import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { db } from './databaseEngine.mjs';

dotenv.config();

const FALIX_TOKEN = process.env.FALIX_API_KEY || 'flx_live_P3WeTyt4HtgmfYBKf7gmw8PK1bYSVp5yNySZQ4Pa';
const SERVER_ID = process.env.FALIX_SERVER_ID || '3390114';
const BASE_URL = 'https://client.falixnodes.net/api/v2';
const GROQ_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_FALLBACK;

const headers = {
  'Authorization': `Bearer ${FALIX_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export class AIConsoleOperator {
  constructor(client = null) {
    this.client = client;
    this.isRunning = false;
    this.timer = null;
    this.lastSaveTime = Date.now();
  }

  async sendCommand(command) {
    try {
      const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/commands`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command })
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async getStatus() {
    try {
      const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/status`, { headers });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  }

  /**
   * Log action to Discord #admin-logs if bot is connected
   */
  async logToDiscord(title, description, color = 0x00D8F6) {
    if (!this.client) return;
    try {
      const adminCh = this.client.channels.cache.find(c => c && c.name && c.name.includes('admin-logs') && c.isTextBased());
      if (adminCh) {
        await adminCh.send({
          embeds: [{
            title: `🤖 AI Console Operator: ${title}`,
            description,
            color,
            footer: { text: 'KryloSMP 24/7 Autonomous AI Engine' },
            timestamp: new Date().toISOString()
          }]
        });
      }
    } catch {}
  }

  /**
   * Core Autonomous Loop: Runs every 60 seconds
   */
  async runCycle() {
    try {
      const status = await this.getStatus();
      if (!status || status.state !== 'running') {
        return; // Server is sleeping/offline, wait for wake
      }

      const res = status.resources || {};
      const cpu = res.cpu_percent || 0;
      const memBytes = res.memory_bytes || 0;
      const memMB = Math.round(memBytes / (1024 * 1024));

      // 1. High Memory Auto-Healer (>2200 MB)
      if (memMB > 2200) {
        console.log(`[AI Operator] Memory high (${memMB} MB), executing smart cleanup...`);
        await this.sendCommand('minecraft:kill @e[type=item]');
        await this.logToDiscord('Memory Optimization Triggered', `Server memory reached **${memMB} MB**. AI cleared dropped ground items to maintain 20.0 TPS.`, 0xF59E0B);
      }

      // 2. Periodic World Auto-Save (Every 15 minutes)
      if (Date.now() - this.lastSaveTime > 15 * 60 * 1000) {
        await this.sendCommand('save-all');
        this.lastSaveTime = Date.now();
        console.log('[AI Operator] Periodic world save-all dispatched.');
      }

      // 3. Process any pending offline store purchases
      try {
        const pending = db.prepare("SELECT * FROM purchases WHERE status = 'queued' LIMIT 5").all();
        if (pending && pending.length > 0) {
          for (const item of pending) {
            console.log(`[AI Operator] Processing queued store purchase for '${item.player_ign}'...`);
            await this.sendCommand(`crazycrates give physical GodlyCrate 5 ${item.player_ign}`);
            await this.sendCommand(`eco give ${item.player_ign} ${item.price || 10000}`);
            db.prepare("UPDATE purchases SET status = 'delivered' WHERE id = ?").run(item.id);
            await this.logToDiscord('Queued Purchase Fulfilled', `Fulfilled pending order **${item.item_name}** for player **${item.player_ign}**!`, 0x00FF66);
          }
        }
      } catch {}

    } catch (err) {
      console.error('[AI Operator Error]', err.message);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[AI Console Operator] 🚀 Autonomous 24/7 Engine Started!');
    this.timer = setInterval(() => this.runCycle(), 60000);
    this.runCycle(); // Initial cycle
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);
    console.log('[AI Console Operator] 🛑 Autonomous Engine Stopped.');
  }
}

export const aiOperator = new AIConsoleOperator();
