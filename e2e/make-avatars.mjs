// Generates 100 unique illustrated avatar portraits (no real people) in mixed
// formats/sizes, plus edge-case files for upload stress testing.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(import.meta.dirname, ".avatars");
fs.mkdirSync(OUT, { recursive: true });

let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const skins = ["#f6d7c3", "#e8b896", "#c68e65", "#a0673f", "#7a4a2a", "#5a3520"];
const hairs = ["#2b1b12", "#5b3a1e", "#a4672b", "#d9b26a", "#888", "#c0392b", "#1a1a1a"];
const skies = [["#87ceeb", "#e0f6ff"], ["#ff9a76", "#ffd3a5"], ["#34495e", "#5d6d7e"], ["#a8e6cf", "#dcedc1"], ["#c3aed6", "#fbe3e8"]];

function svg(i) {
  const [s1, s2] = pick(skies), skin = pick(skins), hair = pick(hairs);
  const shirt = `hsl(${Math.floor(rnd() * 360)},55%,45%)`, mtn = `hsl(${100 + Math.floor(rnd() * 120)},25%,${30 + Math.floor(rnd() * 20)}%)`;
  const hat = rnd() > 0.6, glasses = rnd() > 0.7, beard = rnd() > 0.7;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 200 200">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs>
  <rect width="200" height="200" fill="url(#g)"/>
  <polygon points="0,150 ${40 + rnd() * 30},${70 + rnd() * 30} 110,150" fill="${mtn}"/>
  <polygon points="70,150 ${130 + rnd() * 30},${60 + rnd() * 30} 200,150" fill="${mtn}" opacity=".8"/>
  <rect y="150" width="200" height="50" fill="${mtn}" opacity=".6"/>
  <ellipse cx="100" cy="200" rx="62" ry="45" fill="${shirt}"/>
  <rect x="88" y="128" width="24" height="22" fill="${skin}"/>
  <ellipse cx="100" cy="100" rx="34" ry="40" fill="${skin}"/>
  <path d="M66 95 Q70 55 100 56 Q132 55 134 95 Q124 72 100 74 Q78 72 66 95Z" fill="${hair}"/>
  ${beard ? `<path d="M70 110 Q100 160 130 110 Q120 132 100 134 Q80 132 70 110Z" fill="${hair}"/>` : ""}
  <circle cx="87" cy="100" r="3.5" fill="#222"/><circle cx="113" cy="100" r="3.5" fill="#222"/>
  ${glasses ? `<g fill="none" stroke="#222" stroke-width="2"><circle cx="87" cy="100" r="9"/><circle cx="113" cy="100" r="9"/><path d="M96 100h8"/></g>` : ""}
  <path d="M90 119 Q100 ${124 + rnd() * 5} 110 119" stroke="#8a3b2f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  ${hat ? `<path d="M60 70 Q100 30 140 70Z" fill="${shirt}"/><rect x="54" y="66" width="92" height="8" rx="4" fill="${shirt}"/>` : ""}
  <text x="6" y="194" font-size="8" fill="#fff" opacity=".5">synthetic #${i}</text></svg>`;
}

const fmts = ["jpeg", "png", "webp"];
for (let i = 0; i < 100; i++) {
  const fmt = fmts[i % 3];
  const size = [400, 800, 1600, 3000][i % 4];
  const ext = fmt === "jpeg" ? "jpg" : fmt;
  await sharp(Buffer.from(svg(i))).resize(size, size)[fmt]({ quality: 85 }).toFile(path.join(OUT, `avatar_${String(i).padStart(3, "0")}.${ext}`));
}
// edge cases
const edge = path.join(OUT, "edge"); fs.mkdirSync(edge, { recursive: true });
await sharp(Buffer.from(svg(999))).resize(6000, 6000).png({ compressionLevel: 0 }).toFile(path.join(edge, "huge_6000px.png")); // >10MB
await sharp(Buffer.from(svg(998))).resize(400, 4000, { fit: "fill" }).jpeg().toFile(path.join(edge, "tall_400x4000.jpg"));
fs.writeFileSync(path.join(edge, "corrupt.jpg"), Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(5000, 7)]));
fs.writeFileSync(path.join(edge, "not_an_image.png"), "this is plain text pretending to be a png");
fs.writeFileSync(path.join(edge, "photo.heic"), Buffer.alloc(20000, 3));
await sharp(Buffer.from(svg(997))).resize(1, 1).png().toFile(path.join(edge, "tiny_1px.png"));
console.log("avatars:", fs.readdirSync(OUT).length - 1, "edge:", fs.readdirSync(edge));
for (const f of fs.readdirSync(edge)) console.log(f, fs.statSync(path.join(edge, f)).size);
