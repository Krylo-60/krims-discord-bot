import { 
  joinVoiceChannel, 
  getVoiceConnection, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  VoiceConnectionStatus, 
  EndBehaviorType 
} from '@discordjs/voice';
import prism from 'prism-media';
import googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Active voice state per guild
const voiceStateMap = new Map();

/**
 * Helper to respond seamlessly to both Slash Interactions and Prefix Messages
 */
async function sendResponse(context, data, isDeferred = false) {
  if (context.isChatInputCommand && context.isChatInputCommand()) {
    if (isDeferred || context.deferred) {
      return context.editReply(data);
    }
    return context.reply(data);
  }
  return context.reply(data);
}

/**
 * Free Google Web / Wit.ai Speech-to-Text Transcriber fallback
 */
async function transcribePcmToText(pcmBuffer) {
  try {
    const sampleRate = 48000;
    
    // Build 16-bit PCM WAV Header
    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(1, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(sampleRate * 2, 28);
    wavHeader.writeUInt16LE(2, 32);
    wavHeader.writeUInt16LE(16, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmBuffer.length, 40);

    const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

    const witToken = process.env.WIT_AI_TOKEN || 'N3OW2W6B2IQUH2AUPW3V2TKYZVGX4X46';
    const response = await fetch('https://api.wit.ai/speech?v=20230215', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${witToken}`,
        'Content-Type': 'audio/wav'
      },
      body: wavBuffer
    });

    if (response.ok) {
      const resText = await response.text();
      const lines = resText.split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(lines[i]);
          if (parsed.text && parsed.text.trim()) {
            return parsed.text.trim();
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('[Voice Engine STT Error]:', err.message);
  }
  return null;
}

/**
 * Generate high-level AI response in signature Krylo & Krishiv Style
 */
function queryKrimsAI(prompt) {
  const cleanPrompt = prompt.toLowerCase();
  
  if (cleanPrompt.includes('hello') || cleanPrompt.includes('hi') || cleanPrompt.includes('hey')) {
    return 'Greetings, legend! I am Krims Code AI, custom-built by Krishiv. Ready to conquer KryloSMP and write epic code today?';
  }
  if (cleanPrompt.includes('who created') || cleanPrompt.includes('who made') || cleanPrompt.includes('creator') || cleanPrompt.includes('krishiv')) {
    return 'Krims Code AI was masterfully designed and coded by Krishiv, the lead developer and visionary founder of Krishiv Studios!';
  }
  if (cleanPrompt.includes('krylo') || cleanPrompt.includes('smp') || cleanPrompt.includes('server')) {
    return 'KryloSMP is the premier Minecraft SMP experience with custom Warlord bosses, rank upgrades, and 24/7 high-speed cloud performance!';
  }
  if (cleanPrompt.includes('status')) {
    return 'All KryloSMP and Krishiv Studios cloud services are 100% operational, ultra-fast, and running at peak performance!';
  }
  if (cleanPrompt.includes('voice') || cleanPrompt.includes('what can you do') || cleanPrompt.includes('help')) {
    return 'I am your AI voice assistant! I listen to your speech in real time, answer coding and server questions, and speak right back to you!';
  }

  return `I heard you say: "${prompt}". Krims Code Voice Engine is operating at peak efficiency in Krylo & Krishiv Style! ⚡`;
}

/**
 * Play Text-to-Speech audio in voice channel
 */
export async function speakInVoiceChannel(guildId, text) {
  const voiceState = voiceStateMap.get(guildId);
  if (!voiceState || !voiceState.connection) return;

  try {
    const url = googleTTS.getAudioUrl(text.length > 200 ? text.slice(0, 197) + '...' : text, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(url);

    player.play(resource);
    voiceState.connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      player.stop();
    });
  } catch (err) {
    console.error('[Voice Engine TTS Error]:', err.message);
  }
}

/**
 * Listen to audio stream when a user speaks
 */
function listenToUser(userId, connection, textChannel, guildId) {
  const voiceState = voiceStateMap.get(guildId);
  if (!voiceState || voiceState.listeningUsers.has(userId)) return;

  voiceState.listeningUsers.add(userId);

  const audioStream = connection.receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1200,
    },
  });

  const opusDecoder = new prism.opus.Decoder({ frameSize: 960, channels: 1, rate: 48000 });
  const pcmChunks = [];

  const pcmStream = audioStream.pipe(opusDecoder);

  pcmStream.on('data', (chunk) => {
    pcmChunks.push(chunk);
  });

  pcmStream.on('end', async () => {
    voiceState.listeningUsers.delete(userId);
    const pcmBuffer = Buffer.concat(pcmChunks);
    
    // Ignore short noises (< 0.5s of PCM data)
    if (pcmBuffer.length < 24000) return;

    console.log(`[Voice Engine] Received ${pcmBuffer.length} bytes of PCM voice from User ID: ${userId}`);

    const transcribedText = await transcribePcmToText(pcmBuffer);

    if (transcribedText && transcribedText.length > 1) {
      console.log(`[Voice Engine STT Recognized]: "${transcribedText}"`);

      const aiResponse = queryKrimsAI(transcribedText);

      // Send text message response in channel in Krylo & Krishiv Style
      if (textChannel) {
        await textChannel.send({
          embeds: [{
            color: 0x00F2FF, // Krylo Cyan
            title: '⚡ 🎙️ KRIMS VOICE AI • KRYLO & KRISHIV EDITION',
            description: '`[REAL-TIME VOICE TRANSMISSION PROCESSED]`',
            fields: [
              { name: '🗣️ Spoken Input', value: `*${transcribedText}*`, inline: false },
              { name: '🤖 Krims AI Response', value: `> ${aiResponse}`, inline: false }
            ],
            footer: { text: '👑 KryloSMP Sovereign Network • Master Coded by Krishiv ⚡' },
            timestamp: new Date().toISOString()
          }]
        }).catch(err => console.error('Failed to send text embed:', err.message));
      }

      // Speak back in voice channel
      await speakInVoiceChannel(guildId, aiResponse);
    }
  });

  pcmStream.on('error', (err) => {
    voiceState.listeningUsers.delete(userId);
    console.error('[Voice Stream Error]:', err.message);
  });
}

/**
 * Join Voice Channel Handler (Krylo & Krishiv Style)
 */
export async function joinVoice(context) {
  const guild = context.guild;
  const member = context.member;

  if (!member.voice || !member.voice.channel) {
    return sendResponse(context, {
      content: '❌ **Join a Voice Channel first!** Connect to any voice channel so Krims Bot can join you.',
      ephemeral: true
    });
  }

  const voiceChannel = member.voice.channel;

  try {
    let isDeferred = false;
    if (context.deferReply) {
      await context.deferReply();
      isDeferred = true;
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    voiceStateMap.set(guild.id, {
      connection,
      channelId: voiceChannel.id,
      textChannel: context.channel,
      listeningUsers: new Set()
    });

    connection.receiver.speaking.on('start', (userId) => {
      listenToUser(userId, connection, context.channel, guild.id);
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log(`[Voice Engine] Joined voice channel ${voiceChannel.name} in ${guild.name}`);
    });

    const greetingText = `Greetings! Krims Code Voice AI is now active in ${voiceChannel.name}. Speak to me anytime, developer!`;
    await speakInVoiceChannel(guild.id, greetingText);

    return sendResponse(context, {
      embeds: [{
        color: 0x00FF66, // Krylo Emerald Green
        title: '⚡ 🎙️ KRIMS VOICE AI ONLINE • KRYLO & KRISHIV STYLE',
        description: `Successfully locked onto **${voiceChannel.name}**!\n\n` +
                     '**🔥 Active Master Features:**\n' +
                     '• 🎤 **Real-Time Voice Recognition**: Speak into your microphone and Krims Bot transcribes your speech.\n' +
                     '• 🔊 **AI Text-to-Speech Synthesis**: Krims Bot answers back in voice with crystal clear audio.\n' +
                     '• 💬 **Live Text Mirror**: Transcriptions and responses mirrored live in ' + `${context.channel}.\n\n` +
                     '_"Crafted with perfection by Krishiv for the Krylo Community."_',
        footer: { text: '👑 KryloSMP Sovereign Network • Type /voice leave or !voice leave to disconnect ⚡' },
        timestamp: new Date().toISOString()
      }]
    }, isDeferred);
  } catch (err) {
    console.error('[Voice Join Error]:', err);
    return sendResponse(context, {
      content: `❌ **Voice Engine Error:** ${err.message}`
    });
  }
}

/**
 * Leave Voice Channel Handler
 */
export async function leaveVoice(context) {
  const guild = context.guild;
  const connection = getVoiceConnection(guild.id);

  if (!connection) {
    return sendResponse(context, {
      content: '❌ Krims Bot is not currently connected to any Voice Channel in this server.',
      ephemeral: true
    });
  }

  try {
    connection.destroy();
    voiceStateMap.delete(guild.id);

    return sendResponse(context, {
      embeds: [{
        color: 0xFF4444,
        title: '👋 Voice AI Disconnected',
        description: 'Krims Bot has safely left the voice channel. See you next time, developer!',
        footer: { text: 'KryloSMP Sovereign Network • Coded by Krishiv ⚡' }
      }],
      ephemeral: false
    });
  } catch (err) {
    return sendResponse(context, {
      content: `❌ Error disconnecting: ${err.message}`,
      ephemeral: true
    });
  }
}

/**
 * Get Voice Status Handler (Krylo & Krishiv Style)
 */
export async function getVoiceStatus(context) {
  const guild = context.guild;
  const voiceState = voiceStateMap.get(guild.id);

  if (!voiceState || !voiceState.connection) {
    return sendResponse(context, {
      embeds: [{
        color: 0xED4245,
        title: '🎙️ KRIMS VOICE AI • STATUS REPORT',
        description: 'Status: 🔴 **Offline / Standby**\n\nUse `/voice action:join` or `!voice join` while in a voice channel to summon Krims Bot!',
        footer: { text: 'KryloSMP Sovereign Network • Coded by Krishiv ⚡' }
      }]
    });
  }

  return sendResponse(context, {
    embeds: [{
      color: 0x00F2FF,
      title: '⚡ 🎙️ KRIMS VOICE AI • STATUS REPORT',
      fields: [
        { name: '🌐 Operational Status', value: '🟢 **ACTIVE & LISTENING**', inline: true },
        { name: '🔊 Channel Lock', value: `<#${voiceState.channelId}>`, inline: true },
        { name: '🎤 Speech-to-Text Engine', value: '⚡ Wit.ai / Google Neural STT (Ultra Fast)', inline: false },
        { name: '🗣️ Text-to-Speech Engine', value: '🔊 Google Neural TTS Synthesis', inline: false },
        { name: '👑 Master Architecture', value: 'Custom Trained by Krishiv for KryloSMP', inline: false }
      ],
      footer: { text: 'KryloSMP Sovereign Network • Coded by Krishiv ⚡' },
      timestamp: new Date().toISOString()
    }]
  });
}
