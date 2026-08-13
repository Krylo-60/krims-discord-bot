import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const brokenLine = `const msgContent = message.content.trim();
  if (msgContent.toLowerCase().startsWith('!postvideo') || msgContent.toLowerCase().includes('!postvideo')) || content.toLowerCase().startsWith('!postvideo')) {`;

const fixedLine = `const msgContent = message.content.trim();
  if (msgContent.toLowerCase().startsWith('!postvideo')) {`;

if (code.includes(brokenLine)) {
  code = code.replace(brokenLine, fixedLine);
  fs.writeFileSync('index.js', code);
  console.log('✅ Fixed syntax in index.js!');
} else {
  // Regex cleanup
  code = code.replace(/if\s*\(msgContent\.toLowerCase\(\)\.startsWith\('!postvideo'\)\s*\|\|\s*msgContent\.toLowerCase\(\)\.includes\('!postvideo'\)\)\s*\|\|\s*content\.toLowerCase\(\)\.startsWith\('!postvideo'\)\)/g, "if (msgContent.toLowerCase().startsWith('!postvideo'))");
  fs.writeFileSync('index.js', code);
  console.log('✅ Regex fixed syntax in index.js!');
}
