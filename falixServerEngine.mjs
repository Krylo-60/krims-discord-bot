import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const FALIX_TOKEN = process.env.FALIX_API_KEY || 'flx_live_P3WeTyt4HtgmfYBKf7gmw8PK1bYSVp5yNySZQ4Pa';
const SERVER_ID = process.env.FALIX_SERVER_ID || '3390114';
const BASE_URL = 'https://client.falixnodes.net/api/v2';

const headers = {
  'Authorization': `Bearer ${FALIX_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Get real-time status of the KryloSMP server
 */
export async function getFalixStatus() {
  try {
    const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/status`, { headers });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }
    const json = await res.json();
    return { success: true, data: json.data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Send power signal: 'start', 'restart', 'stop', or 'kill'
 */
export async function sendFalixPowerSignal(signal) {
  try {
    const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/power`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ signal })
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }
    const json = await res.json();
    return { success: true, data: json.data || { status: 'signal_sent' } };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Send console command to Minecraft server
 */
export async function sendFalixCommand(command) {
  try {
    const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/commands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ command })
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }
    const json = await res.json();
    return { success: true, data: json.data || { status: 'command_sent' } };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
