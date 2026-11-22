import fs from 'fs';

const files = [
  'C:/Users/naina/.gemini/antigravity/scratch/krims-bot-dashboard/custombot.html',
  'C:/Users/naina/.gemini/antigravity/scratch/krims-bot-dashboard/devcustombot.html'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');

  // Update Top Up link in sidebar
  html = html.replace(
    '<a href="/rewards" target="_blank" style="font-size: 0.68rem; color: #38bdf8; text-decoration: none;">Top Up</a>',
    '<a href="/rewards#buy-points-section" target="_blank" style="font-size: 0.68rem; color: #38bdf8; text-decoration: none; font-weight: 600;">Top Up (Lemon Squeezy) ⚡</a>'
  );

  // Add Buy Kr Points button to trading banner
  const oldBtn = `<a href="/rewards" target="_blank" class="btn-unlock-kr" style="text-decoration: none; padding: 10px 18px;">
              <span>Claim Daily Kr in Vault ↗</span>
            </a>`;
  const newBtns = `<div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="/rewards#buy-points-section" target="_blank" class="btn-unlock-kr" style="text-decoration: none; padding: 10px 18px; background: linear-gradient(135deg, #0284c7, #0369a1);">
              <span>🍋 Buy Kr Points</span>
            </a>
            <a href="/rewards" target="_blank" class="btn-unlock-kr" style="text-decoration: none; padding: 10px 18px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);">
              <span>Claim Daily Vault ↗</span>
            </a>
          </div>`;

  if (html.includes(oldBtn)) {
    html = html.replace(oldBtn, newBtns);
  }

  fs.writeFileSync(file, html, 'utf8');
  console.log(`Updated ${file}!`);
}
