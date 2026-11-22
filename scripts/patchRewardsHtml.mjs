import fs from 'fs';
import path from 'path';

const file = 'C:/Users/naina/.gemini/antigravity/scratch/krims-bot-dashboard/rewards.html';
let content = fs.readFileSync(file, 'utf8');

const target = 'window.triggerPassNotice = function(passName, cost) {';
if (!content.includes(target)) {
  console.error('Target not found in rewards.html!');
  process.exit(1);
}

const snippet = `
    // 🍋 Official Lemon Squeezy Checkout Handler
    window.openLemonCheckout = function(points, priceUsd, tierName) {
      let discordId = currentUser?.id || localStorage.getItem('krims_discord_user_id') || '';

      if (!discordId) {
        const entered = prompt(
          '👋 Discord User ID Required for Instant Points Delivery:\\n\\n' +
          'Please enter your Discord User ID so your KR points are instantly credited after payment.\\n' +
          '(Tip: In Discord, right-click your profile -> "Copy User ID", or login with Discord above!)'
        );
        if (!entered || !entered.trim()) {
          showToast('Checkout paused: Discord User ID is required to credit points.', '⚠️');
          return;
        }
        discordId = entered.trim();
        localStorage.setItem('krims_discord_user_id', discordId);
      }

      showToast(\`Launching Lemon Squeezy checkout for \${tierName}...\`, '🍋');

      // Base Lemon Squeezy Store Checkout URL
      const defaultStoreUrl = 'https://krimscode.lemonsqueezy.com/buy';
      const baseUrl = window.LEMON_SQUEEZY_CHECKOUT_URL || defaultStoreUrl;

      // Append checkout[custom][discord_id] as required by Lemon Squeezy Webhook
      const checkoutUrl = new URL(baseUrl);
      checkoutUrl.searchParams.set('checkout[custom][discord_id]', discordId);
      checkoutUrl.searchParams.set('checkout[custom][points]', String(points));
      checkoutUrl.searchParams.set('checkout[custom][tier]', tierName);

      if (currentUser?.email) {
        checkoutUrl.searchParams.set('checkout[email]', currentUser.email);
      }
      if (currentUser?.global_name || currentUser?.username) {
        checkoutUrl.searchParams.set('checkout[name]', currentUser.global_name || currentUser.username);
      }

      // Check if Lemon Squeezy overlay is available
      if (window.LemonSqueezy && typeof window.LemonSqueezy.Url?.Open === 'function') {
        window.LemonSqueezy.Url.Open(checkoutUrl.toString());
      } else {
        window.open(checkoutUrl.toString(), '_blank');
      }
    };
`;

content = content.replace(target, snippet + '\n    ' + target);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully inserted openLemonCheckout into rewards.html!');
