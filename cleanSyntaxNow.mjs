import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// Replace all occurrences of value: <t::R> with backtick template string
code = code.replace(/value:\s*<t::R>/g, 'value: `<t:${unixTime}:R>`');
code = code.replace(/value:\s*KryloSmp\.play\.hosting/g, 'value: "`KryloSmp.play.hosting`"');

fs.writeFileSync('index.js', code);
console.log('✅ Cleaned syntax in index.js!');
