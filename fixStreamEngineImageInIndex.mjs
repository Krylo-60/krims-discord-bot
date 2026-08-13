import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const oldImage = "https://i.ytimg.com/vi/UBT9cvXm_c4/maxresdefault.jpg";
const newMinecraftImage = "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80";

if (code.includes(oldImage)) {
  code = code.replaceAll(oldImage, newMinecraftImage);
  fs.writeFileSync('index.js', code);
  console.log('✅ Replaced stream thumbnail fallback in index.js with high-res Minecraft artwork!');
} else {
  console.log('Stream thumbnail image already updated in index.js');
}
