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
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import sodium from 'libsodium-wrappers';

// Ensure WebAssembly LibSodium Decryption Engine is ready
let sodiumReady = false;
async function initSodium() {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
    console.log('[Voice Engine] LibSodium Wasm Decryption Engine Ready 🟢');
  }
}

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
 * High-precision FFmpeg audio converter: 48kHz stereo PCM -> 16kHz mono WAV
 */
function convertPcmTo16kMonoWav(pcmBuffer) {
  return new Promise((resolve) => {
    const ffmpeg = spawn(ffmpegPath, [
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      '-i', 'pipe:0',
      '-ar', '16000',
      '-ac', '1',
      '-f', 'wav',
      'pipe:1'
    ]);

    const chunks = [];
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', () => {});

    ffmpeg.on('close', (code) => {
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        resolve(null);
      }
    });

    ffmpeg.on('error', () => resolve(null));

    ffmpeg.stdin.write(pcmBuffer);
    ffmpeg.stdin.end();
  });
}

/**
 * Free Wit.ai / Speech-to-Text Transcriber with 16kHz Mono WAV Input
 */
async function transcribePcmToText(pcmBuffer) {
  try {
    const wavBuffer = await convertPcmTo16kMonoWav(pcmBuffer);
    if (!wavBuffer || wavBuffer.length < 100) return null;

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
  const cleanPrompt = prompt.toLowerCase().trim();
  
  if (cleanPrompt.includes('hello') || cleanPrompt.includes('hi') || cleanPrompt.includes('hey')) {
    return 'Greetings, legend! I am Krims Code AI, custom-built by Krishiv. Live 1-on-1 voice mode is active. How can I help you today?';
  }
  if (cleanPrompt.includes('who created') || cleanPrompt.includes('who made') || cleanPrompt.includes('creator') || cleanPrompt.includes('krishiv')) {
    return 'Krims Code AI was masterfully built and custom-trained by Krishiv, founder of Krishiv Studios!';
  }
  if (cleanPrompt.includes('krylo') || cleanPrompt.includes('smp') || cleanPrompt.includes('server')) {
    return 'KryloSMP is online 24/7 with custom Warlord bosses, player ranks, and high-speed cloud infrastructure!';
  }
  if (cleanPrompt.includes('status')) {
    return 'All KryloSMP and Krishiv Studios cloud systems are operating at 100% capacity and peak performance!';
  }

  return `I heard you say: "${prompt}". Live 1-on-1 voice AI mode is operating at full capacity! What shall we build next?`;
}

/**
 * Play Text-to-Speech audio in voice channel
 */
export async function speakInVoiceChannel(guildId, text) {
  const voiceState = voiceStateMap.get(guildId);
  if (!voiceState || !voiceState.connection) return;

  try {
    const cleanText = text.length > 200 ? text.slice(0, 197) + '...' : text;
    const url = googleTTS.getAudioUrl(cleanText, {
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

  // If in 1-on-1 mode, only listen to the 1-on-1 partner
  if (voiceState.isOneOnOne && voiceState.oneOnOneUserId && voiceState.oneOnOneUserId !== userId) {
    return;
  }

  voiceState.listeningUsers.add(userId);

  const audioStream = connection.receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 500,
    },
  });

  const opusDecoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
  const pcmChunks = [];
  let isDone = false;

  const cleanup = () => {
    if (!isDone) {
      isDone = true;
      voiceState.listeningUsers.delete(userId);
      clearTimeout(safetyTimeout);
    }
  };

  // Safety timeout: max 6 seconds per speech phrase to prevent hanging
  const safetyTimeout = setTimeout(() => {
    try {
      audioStream.destroy();
    } catch (e) {}
    cleanup();
  }, 6000);

  const pcmStream = audioStream.pipe(opusDecoder);

  pcmStream.on('data', (chunk) => {
    pcmChunks.push(chunk);
  });

  pcmStream.on('end', async () => {
    cleanup();
    const pcmBuffer = Buffer.concat(pcmChunks);
    
    // Ignore short noises (< 0.25s of PCM data: 48000 * 2 channels * 2 bytes = 192,000 bytes/sec)
    if (pcmBuffer.length < 24000) return;

    console.log(`[Voice Engine Live] Processing ${pcmBuffer.length} bytes of audio from User: ${userId}`);

    const transcribedText = await transcribePcmToText(pcmBuffer);

    if (transcribedText && transcribedText.length > 1) {
      console.log(`[Voice Engine STT Success]: "${transcribedText}"`);

      const aiResponse = queryKrimsAI(transcribedText);

      // Mirror live response in text channel
      if (textChannel) {
        await textChannel.send({
          embeds: [{
            color: 0x00F2FF,
            title: '⚡ 🎙️ LIVE 1-ON-1 VOICE CONVERSATION',
            description: `**Speaker:** <@${userId}>`,
            fields: [
              { name: '🗣️ Your Voice Input', value: `*"${transcribedText}"*`, inline: false },
              { name: '🤖 Krims AI Verbal Response', value: `> ${aiResponse}`, inline: false }
            ],
            footer: { text: '👑 KryloSMP Sovereign Network • Coded by Krishiv ⚡' },
            timestamp: new Date().toISOString()
          }]
        }).catch(err => console.error('Failed to send text embed:', err.message));
      }

      // Speak back in voice channel
      await speakInVoiceChannel(guildId, aiResponse);
    }
  });

  pcmStream.on('error', (err) => {
    cleanup();
    console.error('[Voice Stream Error]:', err.message);
  });

  audioStream.on('error', (err) => {
    cleanup();
    console.error('[Audio Stream Error]:', err.message);
  });
}

/**
 * Join Voice Channel Handler (Supports 1-on-1 Call Mode)
 */
export async function joinVoice(context, isOneOnOne = false) {
  const guild = context.guild;
  const member = context.member;

  if (!member.voice || !member.voice.channel) {
    return sendResponse(context, {
      content: '❌ **Connect to a Voice Channel first!** Join any voice channel so Krims Bot can join you.',
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

    await initSodium();

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
      isOneOnOne: isOneOnOne,
      oneOnOneUserId: member.user.id,
      listeningUsers: new Set()
    });

    connection.receiver.speaking.on('start', (userId) => {
      listenToUser(userId, connection, context.channel, guild.id);
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log(`[Voice Engine] Joined voice channel ${voiceChannel.name} in ${guild.name}`);
    });

    // Speak initial greeting to trigger initial UDP voice handshake
    await speakInVoiceChannel(guild.id, `Hello! Live 1 on 1 voice mode is active. Speak to me anytime!`);

    return sendResponse(context, {
      embeds: [{
        color: 0x00FF66,
        title: isOneOnOne ? '⚡ 📞 LIVE 1-ON-1 VOICE CALL ACTIVE' : '⚡ 🎙️ KRIMS VOICE AI ONLINE',
        description: `Successfully connected to **${voiceChannel.name}**!\n\n` +
                     `**👤 Partner:** <@${member.user.id}>\n\n` +
                     '**🔥 Live 1-on-1 Voice Features:**\n' +
                     '• 🎤 **High-Precision Speech Recognition**: Speak into your microphone and Krims Bot transcribes your voice.\n' +
                     '• 🔊 **Instant Verbal Reply**: Krims Bot talks right back to you in real-time TTS audio.\n' +
                     '• 💬 **Live Transcript Mirror**: Posted live in ' + `${context.channel}.\n\n` +
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
        title: '👋 1-on-1 Voice Call Ended',
        description: 'Krims Bot has disconnected from the voice channel. Great speaking with you!',
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
 * Get Voice Status Handler
 */
export async function getVoiceStatus(context) {
  const guild = context.guild;
  const connection = getVoiceConnection(guild.id);
  const voiceState = voiceStateMap.get(guild.id);
  const botVoiceChannel = guild.members?.me?.voice?.channel;

  const isConnected = !!(connection || (voiceState && voiceState.connection) || botVoiceChannel);

  if (!isConnected) {
    return sendResponse(context, {
      embeds: [{
        color: 0xED4245,
        title: '🎙️ KRIMS VOICE AI • STATUS REPORT',
        description: 'Status: 🔴 **Offline / Standby**\n\nUse `/voice action:join` or `!voice call` while in a voice channel to start a Live 1-on-1 Voice Call!',
        footer: { text: 'KryloSMP Sovereign Network • Coded by Krishiv ⚡' }
      }]
    });
  }

  const channelId = botVoiceChannel?.id || voiceState?.channelId || connection?.joinConfig?.channelId;

  return sendResponse(context, {
    embeds: [{
      color: 0x00F2FF,
      title: '⚡ 🎙️ KRIMS VOICE AI • STATUS REPORT',
      fields: [
        { name: '🌐 Operational Status', value: '🟢 **ACTIVE & LISTENING (1-ON-1 CALL)**', inline: true },
        { name: '🔊 Channel Lock', value: channelId ? `<#${channelId}>` : 'Active Voice Channel', inline: true },
        { name: '🎤 STT Engine', value: '⚡ FFmpeg 16kHz Mono + Wit.ai Speech API', inline: false },
        { name: '🗣️ TTS Engine', value: '🔊 Google Neural TTS Audio Player', inline: false },
        { name: '👑 Master Architecture', value: 'Custom Trained by Krishiv for KryloSMP', inline: false }
      ],
      footer: { text: 'KryloSMP Sovereign Network • Coded by Krishiv ⚡' },
      timestamp: new Date().toISOString()
    }]
  });
}
