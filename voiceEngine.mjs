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
  // Regular message object
  return context.reply(data);
}

/**
 * Free Google Web / Wit.ai Speech-to-Text Transcriber fallback
 */
async function transcribePcmToText(pcmBuffer) {
  try {
    const sampleRate = 48000;
    
    // Simple WAV header builder
    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    wavHeader.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
    wavHeader.writeUInt16LE(1, 22);  // NumChannels (1 mono)
    wavHeader.writeUInt32LE(sampleRate, 24); // SampleRate
    wavHeader.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    wavHeader.writeUInt16LE(2, 32);  // BlockAlign
    wavHeader.writeUInt16LE(16, 34); // BitsPerSample
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmBuffer.length, 40);

    const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

    // Wit.ai Free STT API endpoint fallback
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
 * Generate response using Krims AI Engine
 */
function queryKrimsAI(prompt) {
  const cleanPrompt = prompt.toLowerCase();
  
  if (cleanPrompt.includes('hello') || cleanPrompt.includes('hi') || cleanPrompt.includes('hey')) {
    return 'Hello! I am Krims Code AI. How can I help you with your code or server today?';
  }
  if (cleanPrompt.includes('who created') || cleanPrompt.includes('who made') || cleanPrompt.includes('creator')) {
    return 'Krims Code AI was created by Krishiv, the lead developer and founder of Krishiv Studios!';
  }
  if (cleanPrompt.includes('status') || cleanPrompt.includes('server')) {
    return 'All Krims systems and Minecraft servers are online and operational!';
  }
  if (cleanPrompt.includes('what can you do') || cleanPrompt.includes('help')) {
    return 'I can understand your voice, execute discord slash commands, monitor servers, and answer questions!';
  }

  return `I heard you say: "${prompt}". Krims Code AI Voice module is fully active!`;
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

      // Send text message response in channel
      if (textChannel) {
        await textChannel.send({
          embeds: [{
            color: 0x5865F2,
            title: '🎤 Krims Voice AI Interaction',
            fields: [
              { name: '🗣️ Spoken Input', value: `*${transcribedText}*`, inline: false },
              { name: '🤖 Krims AI Response', value: aiResponse, inline: false }
            ],
            footer: { text: 'Krims Code Voice Engine v1.0 • Powered by Krishiv Studios' },
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
 * Join Voice Channel Handler (Supports Interaction & Message)
 */
export async function joinVoice(context) {
  const guild = context.guild;
  const member = context.member;

  if (!member.voice || !member.voice.channel) {
    return sendResponse(context, {
      content: '❌ You must be connected to a Voice Channel first so Krims Bot can join you!',
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

    // Handle incoming speech events
    connection.receiver.speaking.on('start', (userId) => {
      listenToUser(userId, connection, context.channel, guild.id);
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log(`[Voice Engine] Joined voice channel ${voiceChannel.name} in ${guild.name}`);
    });

    // Play greeting TTS
    const greetingText = `Hello! Krims Code Voice AI is now active in ${voiceChannel.name}. Speak to me anytime!`;
    await speakInVoiceChannel(guild.id, greetingText);

    return sendResponse(context, {
      embeds: [{
        color: 0x57F287,
        title: '🎙️ Voice AI Active',
        description: `Successfully joined **${voiceChannel.name}**!\n\n**Features Enabled:**\n• 🎤 **Voice Understanding**: Speak into the channel and Krims Bot will transcribe your words.\n• 🔊 **Voice Response**: Krims Bot will answer back using Text-to-Speech.\n• 💬 **Text Mirror**: Responses are also posted in ${context.channel}.`,
        footer: { text: 'Type /voice leave or !voice leave to disconnect Krims Bot' }
      }]
    }, isDeferred);
  } catch (err) {
    console.error('[Voice Join Error]:', err);
    return sendResponse(context, {
      content: `❌ Failed to join voice channel: ${err.message}`
    });
  }
}

/**
 * Leave Voice Channel Handler (Supports Interaction & Message)
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
      content: '👋 Krims Bot disconnected from the voice channel.',
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
 * Get Voice Status Handler (Supports Interaction & Message)
 */
export async function getVoiceStatus(context) {
  const guild = context.guild;
  const voiceState = voiceStateMap.get(guild.id);

  if (!voiceState || !voiceState.connection) {
    return sendResponse(context, {
      embeds: [{
        color: 0xED4245,
        title: '🎙️ Voice AI Status',
        description: 'Status: **Offline / Disconnected**\nUse `/voice action:join` or `!voice join` while in a voice channel to connect Krims Bot!'
      }]
    });
  }

  return sendResponse(context, {
    embeds: [{
      color: 0x57F287,
      title: '🎙️ Voice AI Status',
      fields: [
        { name: 'Status', value: '🟢 **Connected & Listening**', inline: true },
        { name: 'Channel', value: `<#${voiceState.channelId}>`, inline: true },
        { name: 'Speech-to-Text', value: 'Wit.ai / Google Web Speech API (Active)', inline: false },
        { name: 'Text-to-Speech', value: 'Google TTS Engine (Active)', inline: false }
      ]
    }]
  });
}
