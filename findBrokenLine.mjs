import fs from 'fs';

const lines = fs.readFileSync('index.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('commandName === \'clan\'')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
