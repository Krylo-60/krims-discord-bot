import fs from 'fs';

const content = fs.readFileSync('index.js', 'utf8');
const urls = new Set();
const matches = content.matchAll(/https?:\/\/[^\s"'`<>]+/g);
for (const m of matches) {
  const u = m[0];
  if (u.includes('store') || u.includes('tebex') || u.includes('portal') || u.includes('web.app') || u.includes('vercel.app')) {
    urls.add(u);
  }
}
console.log('=== Registered Store & Portal URLs ===');
urls.forEach(u => console.log('• ' + u));
