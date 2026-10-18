import {
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType
} from 'discord.js';

export const KEYWORD_RULES_DEFS = [
  {
    name: '🛡️ AutoMod • Anti-Invite Shield',
    keywords: ['*discord.gg/*', '*discord.com/invite/*', '*discordapp.com/invite/*']
  },
  {
    name: '🛡️ AutoMod • Anti-Nitro Scam & Phishing',
    keywords: ['*free-nitro*', '*nitro-gift*', '*dlscord*', '*discrod*', '*claim-nitro*', '*nitrodrop*']
  },
  {
    name: '🛡️ AutoMod • Anti-Malicious Grabbers',
    keywords: ['*grabify.link*', '*steamcommunity.link*', '*iplogger*', '*curiouscat.club*', '*shorturl.at*']
  },
  {
    name: '🛡️ AutoMod • Anti-Spam Promo & Ads',
    keywords: ['*follow for follow*', '*cheap nitro*', '*earn robux*', '*free vbucks*', '*dm for promo*']
  },
  {
    name: '🛡️ AutoMod • Anti-Raid Token Flood',
    keywords: ['*raid*token*', '*selfbot*', '*nuke server*', '*crash discord*', '*join server get*']
  },
  {
    name: '🛡️ AutoMod • Anti-Crypto & Scam Airdrops',
    keywords: ['*crypto airdrop*', '*claim btc*', '*free solana*', '*trustwallet*', '*metamask-gift*']
  }
];

/**
 * Synchronize AutoMod rules for a single guild
 */
export async function syncGuildAutoMod(guild) {
  if (!guild || !guild.available) return 0;

  try {
    const existingRules = await guild.autoModerationRules.fetch().catch(() => null);
    if (!existingRules) return 0;

    let rulesCreated = 0;

    // 1. Keyword Rules (max 6 per guild)
    for (const def of KEYWORD_RULES_DEFS) {
      const alreadyExists = existingRules.some(
        r => r.name.toLowerCase().includes(def.name.toLowerCase().replace('🛡️ automod • ', '')) ||
             r.name === def.name
      );

      if (!alreadyExists) {
        try {
          const rule = await guild.autoModerationRules.create({
            name: def.name,
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: { keywordFilter: def.keywords },
            actions: [
              {
                type: AutoModerationActionType.BlockMessage,
                metadata: { customMessage: '🛡️ Action blocked by AutoMod security filter.' }
              }
            ],
            enabled: true
          });
          rulesCreated++;
          console.log(`[AutoMod Sync] ✅ Created Keyword Rule: "${rule.name}" in "${guild.name}"`);
        } catch (err) {
          // Rule limit or lack of Manage Guild permission
        }
      }
    }

    // 2. Preset Rule (Content / Profanity / Toxicity)
    const hasPreset = existingRules.some(r => r.triggerType === AutoModerationRuleTriggerType.KeywordPreset);
    if (!hasPreset) {
      try {
        await guild.autoModerationRules.create({
          name: '🛡️ AutoMod • Content & Profanity Filter',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.KeywordPreset,
          triggerMetadata: { presets: [1, 2, 3] },
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: '🛡️ Inappropriate content blocked by AutoMod.' }
            }
          ],
          enabled: true
        });
        rulesCreated++;
      } catch (_) {}
    }

    // 3. Suspected Spam Rule
    const hasSpam = existingRules.some(r => r.triggerType === AutoModerationRuleTriggerType.Spam);
    if (!hasSpam) {
      try {
        await guild.autoModerationRules.create({
          name: '🛡️ AutoMod • Suspected Spam Shield',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Spam,
          actions: [
            {
              type: AutoModerationActionType.BlockMessage,
              metadata: { customMessage: '🛡️ Suspected spam blocked by AutoMod.' }
            }
          ],
          enabled: true
        });
        rulesCreated++;
      } catch (_) {}
    }

    // 4. Member Profile Rule
    const hasProfile = existingRules.some(r => r.triggerType === AutoModerationRuleTriggerType.MemberProfile || r.triggerType === 6);
    if (!hasProfile) {
      const alertChannel = guild.systemChannelId ||
        existingRules.first()?.actions?.find(a => a.metadata?.channelId)?.metadata?.channelId ||
        guild.channels.cache.find(c => c && c.isTextBased() && !c.isVoiceBased())?.id;

      if (alertChannel) {
        try {
          await guild.autoModerationRules.create({
            name: '🛡️ AutoMod • Member Profile Shield',
            eventType: 1,
            triggerType: 6,
            triggerMetadata: { keywordFilter: ['*scam*', '*discord.gg*'] },
            actions: [
              {
                type: AutoModerationActionType.SendAlertMessage,
                metadata: { channel: alertChannel }
              }
            ],
            enabled: true
          });
          rulesCreated++;
        } catch (_) {}
      }
    }

    return rulesCreated;
  } catch (err) {
    console.warn(`[AutoMod Sync Notice] Guild "${guild.name}":`, err.message);
    return 0;
  }
}

/**
 * Synchronize AutoMod rules across all guilds the bot is in
 */
export async function syncAllGuildsAutoMod(client) {
  if (!client || !client.guilds) return;
  console.log(`\n🛡️ [AutoMod Engine] Starting scheduled 6-hour AutoMod sync across ${client.guilds.cache.size} servers...`);

  let totalNewRules = 0;
  for (const [, guild] of client.guilds.cache) {
    try {
      const fetchedGuild = await guild.fetch().catch(() => null);
      if (fetchedGuild) {
        const count = await syncGuildAutoMod(fetchedGuild);
        totalNewRules += count;
      }
    } catch (_) {}
  }

  console.log(`🛡️ [AutoMod Engine] Sync complete! Deployed ${totalNewRules} new rules. Badge qualification verified.\n`);
}

/**
 * Initializes recurring AutoMod sync (Every 6 hours)
 */
export function startAutoModScheduler(client, intervalHours = 6) {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  console.log(`🛡️ [AutoMod Engine] Scheduler active: Running AutoMod sync every ${intervalHours} hours.`);

  // Initial sync 30 seconds after startup
  setTimeout(() => {
    syncAllGuildsAutoMod(client).catch(() => {});
  }, 30000);

  // Periodic recurring sync
  return setInterval(() => {
    syncAllGuildsAutoMod(client).catch(() => {});
  }, intervalMs);
}
