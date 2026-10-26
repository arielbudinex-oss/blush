// Generates Apple-style emoji sheet + lookup data used by the chat UI.
// Artwork comes from the Apple emoji set shipped by emoji-datasource-apple.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const src = path.join(root, "node_modules/emoji-datasource-apple");
const emoji = JSON.parse(fs.readFileSync(path.join(src, "emoji.json"), "utf8"));
const CELL = 66;

const usable = emoji.filter((e) => e.has_img_apple && e.category !== "Component");

// Apple's grid leaves holes for a few entries: drop cells with no artwork so the
// picker never renders an empty square.
const sheetRaw = await sharp(path.join(src, "img/apple/sheets/64.png"))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const sheetW = sheetRaw.info.width;
const px = sheetRaw.data;
const ch = sheetRaw.info.channels;
function hasArt(x, y) {
  const x0 = x * CELL;
  const y0 = y * CELL;
  for (let row = 0; row < CELL; row += 2) {
    for (let col = 0; col < CELL; col += 2) {
      const idx = ((y0 + row) * sheetW + (x0 + col)) * ch + (ch - 1);
      if (px[idx] > 12) return true;
    }
  }
  return false;
}
const filled = usable.filter((e) => hasArt(e.sheet_x, e.sheet_y));
const missing = usable.length - filled.length;

const categories = [
  "Smileys & Emotion",
  "People & Body",
  "Animals & Nature",
  "Food & Drink",
  "Travel & Places",
  "Activities",
  "Objects",
  "Symbols",
  "Flags",
];
const catIndex = new Map(categories.map((c, i) => [c, i]));

const key = (unified) => unified.toLowerCase().replace(/-/g, "");
const compact = filled.map((e) => ({
  u: e.unified,
  x: e.sheet_x,
  y: e.sheet_y,
  n: e.short_name,
  a: e.name,
  c: catIndex.get(e.category) ?? 0,
  k: (e.short_names || []).slice(0, 4).join(" "),
  s: e.sort_order,
}));
compact.sort((a, b) => a.c - b.c || a.s - b.s);

fs.mkdirSync(path.join(root, "src/lib/emoji"), { recursive: true });
fs.writeFileSync(
  path.join(root, "src/lib/emoji/apple-emoji-data.json"),
  JSON.stringify({ categories, emoji: compact }),
);

const lookup = {};
for (const e of filled) {
  lookup[key(e.unified)] = [e.sheet_x, e.sheet_y];
  const stripped = key(e.unified.replace(/-FE0F/g, ""));
  if (!(stripped in lookup)) lookup[stripped] = [e.sheet_x, e.sheet_y];
  if (e.non_qualified) lookup[key(e.non_qualified)] = [e.sheet_x, e.sheet_y];
}
fs.writeFileSync(path.join(root, "src/lib/emoji/apple-emoji-map.json"), JSON.stringify(lookup));

fs.mkdirSync(path.join(root, "public/emoji"), { recursive: true });
await sharp(path.join(src, "img/apple/sheets/64.png"))
  .resize(1364, 1364, { kernel: "lanczos3" })
  .webp({ quality: 80, effort: 6, alphaQuality: 88 })
  .toFile(path.join(root, "public/emoji/apple-sheet.webp"));

const bytes = fs.statSync(path.join(root, "public/emoji/apple-sheet.webp")).size;
console.log(
  JSON.stringify({
    emoji: compact.length,
    emptyCells: missing,
    lookupKeys: Object.keys(lookup).length,
    sheetKb: Math.round(bytes / 1024),
    cell: CELL / 2,
    cols: 62,
  }),
);
