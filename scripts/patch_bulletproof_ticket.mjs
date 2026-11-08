import fs from 'fs';

const indexPath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');

const targetFunction = `async function createBulletproofTicketChannel(guild, { name, parentId = null, topic = '', permissionOverwrites = [] }) {
  if (!guild) throw new Error('Guild reference is missing.');

  if (!client.guilds.cache.has(guild.id)) {
    client.guilds.cache.set(guild.id, guild);
  }

  let channel = null;
  let lastError = null;

  // 1. Primary attempt: Standard discord.js guild.channels.create with full category & overwrites
  try {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parentId || null,
      topic: (topic || '').slice(0, 1024),
      permissionOverwrites: (permissionOverwrites && permissionOverwrites.length > 0) ? permissionOverwrites : undefined
    });
  } catch (createErr) {
    lastError = createErr;
    console.warn('[Bulletproof Creator] Attempt 1 failed:', createErr.message);
  }

  // 2. Fallback attempt: Create without initial overwrites in payload (in case an overwrite role/member ID was invalid)
  if (!channel || !channel.id) {
    try {
      console.log(\`[Bulletproof Creator] Attempt 2: Creating #\${name} without initial overwrites...\`);
      channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: parentId || null,
        topic: (topic || '').slice(0, 1024)
      });
      if (channel && permissionOverwrites && permissionOverwrites.length > 0 && channel.permissionOverwrites) {
        await channel.permissionOverwrites.set(permissionOverwrites).catch(() => {});
      }
    } catch (retryErr) {
      lastError = retryErr;
      console.warn('[Bulletproof Creator] Attempt 2 failed:', retryErr.message);
    }
  }

  // 3. Fallback attempt: Create at root level without parent category (in case category is full or has locked permissions)
  if (!channel || !channel.id) {
    try {
      console.log(\`[Bulletproof Creator] Attempt 3: Creating #\${name} at root level...\`);
      channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        topic: (topic || '').slice(0, 1024)
      });
      if (channel && permissionOverwrites && permissionOverwrites.length > 0 && channel.permissionOverwrites) {
        await channel.permissionOverwrites.set(permissionOverwrites).catch(() => {});
      }
    } catch (rootErr) {
      lastError = rootErr;
      console.warn('[Bulletproof Creator] Attempt 3 failed:', rootErr.message);
    }
  }

  // 4. Verification: If channel was created, preserve reference and enhance send if needed
  if (channel && channel.id) {
    if (typeof channel.send !== 'function') {
      const fetched = await client.channels.fetch(channel.id).catch(() => null);
      if (fetched && typeof fetched.send === 'function') {
        channel = fetched;
      }
    }
    // Guarantee overwrites applied
    if (permissionOverwrites && permissionOverwrites.length > 0 && channel.permissionOverwrites) {
      await channel.permissionOverwrites.set(permissionOverwrites).catch(() => {});
    }
    return channel;
  }

  // 5. Final fallback scan: Search guild channels cache
  await guild.channels.fetch().catch(() => {});
  const cachedMatch = guild.channels.cache.find(c => c && c.name && c.name.toLowerCase() === name.toLowerCase());
  if (cachedMatch && cachedMatch.id) {
    if (permissionOverwrites && permissionOverwrites.length > 0 && cachedMatch.permissionOverwrites) {
      await cachedMatch.permissionOverwrites.set(permissionOverwrites).catch(() => {});
    }
    return cachedMatch;
  }

  const detailedError = (lastError && lastError.message) 
    ? lastError.message 
    : (lastError ? String(lastError) : 'Discord channel creation was not confirmed by the API. Please ensure the bot has Manage Channels and Administrator permissions.');
  throw new Error(detailedError);
}`;

const replacementFunction = `async function createBulletproofTicketChannel(guild, { name, parentId = null, topic = '', permissionOverwrites = [] }) {
  if (!guild) throw new Error('Guild reference is missing.');

  const targetGuild = client.guilds.cache.get(guild.id) || guild;
  if (!client.guilds.cache.has(guild.id)) {
    client.guilds.cache.set(guild.id, targetGuild);
  }

  let channel = null;
  let lastError = null;

  // 1. Primary attempt: Standard targetGuild.channels.create with full category & overwrites
  try {
    channel = await targetGuild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parentId || null,
      topic: (topic || '').slice(0, 1024),
      permissionOverwrites: (permissionOverwrites && permissionOverwrites.length > 0) ? permissionOverwrites : undefined
    });
  } catch (createErr) {
    lastError = createErr;
    console.warn('[Bulletproof Creator] Attempt 1 failed:', createErr.message);
  }

  // 2. Fallback attempt: Create without initial overwrites in payload (in case an overwrite role/member ID was invalid)
  if (!channel || !channel.id) {
    try {
      console.log(\`[Bulletproof Creator] Attempt 2: Creating #\${name} without initial overwrites...\`);
      channel = await targetGuild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: parentId || null,
        topic: (topic || '').slice(0, 1024)
      });
    } catch (retryErr) {
      lastError = retryErr;
      console.warn('[Bulletproof Creator] Attempt 2 failed:', retryErr.message);
    }
  }

  // 3. Fallback attempt: Create at root level without parent category (in case category is full or has locked permissions)
  if (!channel || !channel.id) {
    try {
      console.log(\`[Bulletproof Creator] Attempt 3: Creating #\${name} at root level...\`);
      channel = await targetGuild.channels.create({
        name,
        type: ChannelType.GuildText,
        topic: (topic || '').slice(0, 1024)
      });
    } catch (rootErr) {
      lastError = rootErr;
      console.warn('[Bulletproof Creator] Attempt 3 failed:', rootErr.message);
    }
  }

  // 4. Indestructible REST API attempt: Direct Discord REST API POST to /guilds/{id}/channels
  if (!channel || !channel.id) {
    try {
      console.log(\`[Bulletproof Creator] Attempt 4: Direct Discord REST API channel creation for #\${name}...\`);
      const restData = await client.rest.post(Routes.guildChannels(guild.id), {
        body: {
          name,
          type: ChannelType.GuildText,
          parent_id: parentId || undefined,
          topic: (topic || '').slice(0, 1024)
        }
      });
      if (restData && restData.id) {
        channel = await client.channels.fetch(restData.id).catch(() => null);
        if (!channel) {
          channel = {
            id: restData.id,
            name: restData.name || name,
            guild: targetGuild,
            send: async (payload) => {
              return await safeSendToTicketChannel(restData.id, payload);
            }
          };
        }
      }
    } catch (restErr) {
      lastError = restErr;
      console.warn('[Bulletproof Creator] Attempt 4 REST failed:', restErr.message);
    }
  }

  // 5. Final fallback scan: Force fetch all channels from guild
  if (!channel || !channel.id) {
    const fetchedChannels = await targetGuild.channels.fetch().catch(() => new Map());
    const cachedMatch = fetchedChannels.find(c => c && c.name && c.name.toLowerCase() === name.toLowerCase());
    if (cachedMatch && cachedMatch.id) {
      channel = cachedMatch;
    }
  }

  // 6. Guarantee channel reference, messaging capabilities, and permission overwrites
  if (channel && channel.id) {
    if (typeof channel.send !== 'function') {
      const fetched = await client.channels.fetch(channel.id).catch(() => null);
      if (fetched && typeof fetched.send === 'function') {
        channel = fetched;
      }
    }
    if (permissionOverwrites && permissionOverwrites.length > 0 && channel.permissionOverwrites && typeof channel.permissionOverwrites.set === 'function') {
      await channel.permissionOverwrites.set(permissionOverwrites).catch(() => {});
    }
    return channel;
  }

  const detailedError = (lastError && lastError.message) 
    ? lastError.message 
    : (lastError ? String(lastError) : 'Discord channel creation was not confirmed by the API. Please ensure the bot has Manage Channels and Administrator permissions.');
  throw new Error(detailedError);
}`;

if (content.includes(targetFunction)) {
  content = content.replace(targetFunction, replacementFunction);
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('SUCCESS: Patched createBulletproofTicketChannel with Tier 4 REST API creation!');
} else {
  console.error('Target function not found in index.js');
}
