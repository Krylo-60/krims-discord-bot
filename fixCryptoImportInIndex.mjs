import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

if (!code.includes("import crypto from 'crypto';")) {
  code = "import crypto from 'crypto';\n" + code;
  fs.writeFileSync('index.js', code);
  console.log("✅ Added import crypto from 'crypto'; to top of index.js!");
} else {
  console.log("import crypto from 'crypto'; already present");
}
