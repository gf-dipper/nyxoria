// Összerakja a szerverfüggvényt egyetlen fájlba: server/functions/nyx/index.ts
// Futtatás: node tools/build-server.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const out = [
  '// Nyxoria RPG – szerverfüggvény. EZT A FÁJLT A tools/build-server.js KÉSZÍTI, ne szerkeszd kézzel!',
  '// Supabase → Edge Functions → nyx → illeszd be az egészet az index.ts helyére.',
  "import postgres from 'npm:postgres@3.4.9';",
  '',
  '// ===== js/data.js =====', read('js/data.js'),
  '// ===== js/content.js =====', read('js/content.js'),
  '// ===== js/engine.js =====', read('js/engine.js'),
  '// ===== js/game.js =====', read('js/game.js'),
  '// ===== js/extra.js =====', read('js/extra.js'),
  '// ===== server/nyx.js =====',
  'const NYX = globalThis.NYX;',
  read('server/nyx.js')
].join('\n');
const dest = path.join(root, 'server/functions/nyx/index.ts');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out);
console.log('kész:', dest, Math.round(out.length / 1024) + ' KB');
