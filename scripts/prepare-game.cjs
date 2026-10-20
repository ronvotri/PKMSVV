'use strict';

/**
 * Patch a clean, pinned upstream checkout. Exact-match anchors fail closed.
 * Added Pokemon evolution uses independently catalogued offline PokeAPI rules.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const project = path.join(__dirname, '..');
const game = path.join(project, 'vendor', 'pokesurvivor');
const cfg = JSON.parse(fs.readFileSync(path.join(project, 'config', 'gameplay.json'), 'utf8'));

if (!fs.existsSync(path.join(game, 'dev.html')) || !fs.existsSync(path.join(game, 'LICENSE-NONCOMMERCIAL.md'))) {
  throw new Error('Chưa có mã nguồn gốc tại vendor/pokesurvivor. Hãy clone upstream theo README.');
}
function num(value, min, max, label, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new Error('Cấu hình không hợp lệ: ' + label + ' (phải trong khoảng ' + min + '–' + max + ')');
  }
  return value;
}
const hp = num(cfg.player.hpMultiplier, .5, 3, 'player.hpMultiplier');
const atk = num(cfg.player.damageMultiplier, .5, 4, 'player.damageMultiplier');
const speed = num(cfg.player.speedMultiplier, .5, 2, 'player.speedMultiplier');
const cap = num(cfg.enemies.maxAlive, 16, 300, 'enemies.maxAlive', true);
const density = num(cfg.enemies.density, .05, 1, 'enemies.density');
const enemyDmg = num(cfg.enemies.damageMultiplier, .2, 5, 'enemies.damageMultiplier');
const xp = num(cfg.enemies.xpMultiplier, .2, 12, 'enemies.xpMultiplier');
const coins = num(cfg.progression.startingCoins, 0, 100000, 'progression.startingCoins', true);
const wild = num(cfg.shiny.wildDenominator, 1, 20000, 'shiny.wildDenominator', true);
const gacha = num(cfg.shiny.gachaDenominator, 1, 10000, 'shiny.gachaDenominator', true);

function patch(rel, before, after) {
  const file = path.join(game, rel);
  const original = fs.readFileSync(file, 'utf8');
  const parts = original.split(before);
  if (parts.length !== 2) throw new Error('Không tìm thấy chính xác một vị trí cần chỉnh trong ' + rel + ': ' + before);
  fs.writeFileSync(file, parts.join(after), 'utf8');
}
patch('js/entities/player.js', 'this.atkMul = perks.atkMul || 1;', 'this.atkMul = (perks.atkMul || 1) * ' + atk + ';');
patch('js/entities/player.js', 'this.spdMul = perks.spdMul || 1;', 'this.spdMul = (perks.spdMul || 1) * ' + speed + ';');
patch('js/entities/player.js', 'this.maxHp = mon.hp + (perks.hp || 0);', 'this.maxHp = Math.round((mon.hp + (perks.hp || 0)) * ' + hp + ');');
patch('js/systems/spawner.js', 'const CAP = 64, ELITE_FROM = 0.85;', 'const CAP = ' + cap + ', ELITE_FROM = 0.85;');
patch('js/systems/spawner.js', 'const DENSITY = 0.24, DMG_K = 2.4, XP_K = 5.6;', 'const DENSITY = ' + density + ', DMG_K = ' + enemyDmg + ', XP_K = ' + xp + ';');
patch('js/systems/spawner.js', 'const SHINY_RATE = 1 / 4096;', 'const SHINY_RATE = 1 / ' + wild + ';');
patch('js/systems/gacha.js', 'const SHINY_RATE = 1 / 100;', 'const SHINY_RATE = 1 / ' + gacha + ';');
patch('js/core/db.js', 'const START_COINS = 500;', 'const START_COINS = ' + coins + ';');

// Evolution: data are versioned with PKMSVV rather than fetched during play.
const evolution = JSON.parse(fs.readFileSync(path.join(project, 'data', 'evolution-rules.json'), 'utf8'));
if (!Array.isArray(evolution.rules) || evolution.rules.length < 400) throw new Error('Thiếu dữ liệu tiến hóa Pokédex');
fs.writeFileSync(path.join(game, 'js', 'data', 'pkmsvv-evolution-data.js'),
  '/* Offline PokeAPI evolutionary routes for PKMSVV */\nG.PKMSVV_EVOLUTION_DATA = ' + JSON.stringify(evolution) + ';\n', 'utf8');
const evoSource = fs.readFileSync(path.join(project, 'src', 'pkmsvv-evolution.js'), 'utf8');
if (!evoSource.includes('__PKMSVV_HP_FACTOR__')) throw new Error('Sai placeholder HP của evolution engine');
fs.writeFileSync(path.join(game, 'js', 'systems', 'pkmsvv-evolution.js'),
  evoSource.replace('__PKMSVV_HP_FACTOR__', String(hp)), 'utf8');

// Track attacks and damage without overwriting any of the upstream hooks.
patch('js/entities/player.js', '  cast(m) {\n', '  cast(m) {\n    G.PKMSVVEvo.onCast(this, m);\n');
patch('js/entities/player.js', '    this.hp -= d;\n', '    this.hp -= d;\n    G.PKMSVVEvo.onHurt(this, d);\n');
patch('js/game.js', '    pl = new G.Player(mon, perks, !!save.partnerShiny && G.DB.ownsShiny(mon.dex));',
  '    pl = new G.Player(mon, perks, !!save.partnerShiny && G.DB.ownsShiny(mon.dex));\n    G.PKMSVVEvo.reset(pl);');
patch('js/game.js', '    G.Weather.update(dt, time, pl);\n    G.FX.update(dt);',
  '    G.Weather.update(dt, time, pl);\n    if (!coop) G.PKMSVVEvo.tick(pl, time);\n    G.FX.update(dt);');
patch('js/game.js', '    if (!coop || G.Coop.isHost) maybeLevelUp();',
  '    if (!coop && pendingLevels === 0 && !G.Judgment.active && G.PKMSVVEvo.tryOpen(pl, time, () => { state = "playing"; })) state = "choice";\n    if (!coop || G.Coop.isHost) maybeLevelUp();');

// Insert before source game.js, after all dependencies are loaded.
patch('dev.html', '<script defer src="js/data/pokedex.js"></script>',
  '<script defer src="js/data/pokedex.js"></script>\n<script defer src="js/data/pkmsvv-evolution-data.js"></script>');
patch('dev.html', '<script defer src="js/game.js"></script>',
  '<script defer src="js/systems/pkmsvv-evolution.js"></script>\n<script defer src="js/game.js"></script>');

fs.writeFileSync(path.join(game, 'js/core/firebase-config.js'),
  '/* PKMSVV: forced local saves, Firebase deliberately disabled. */\nG.FIREBASE_CONFIG = null;\n', 'utf8');

execFileSync(process.execPath, [path.join(game, 'tools', 'build.js'), '--sin-seo', '--expose'], { cwd: game, stdio: 'inherit' });

const indexPath = path.join(game, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('</head>')) throw new Error('index.html không có thẻ head');
html = html.replace(/<title>[^<]*<\/title>/, '<title>PKMSVV — PokéSurvivor Offline</title>');
html = html.replace('</head>', '<style>\n' +
  '#scr-menu [data-go="friends"], #scr-menu [data-go="rank"], #btn-google { display: none !important; }\n' +
  '.pkmsvv-evo{position:fixed;inset:0;z-index:9999;background:rgba(5,9,24,.88);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}\n' +
  '.pkmsvv-evo-panel{background:#172645;border:2px solid #f5d16a;border-radius:14px;padding:20px;width:min(570px,96vw);max-height:90vh;overflow-y:auto;box-shadow:0 18px 70px #000}\n' +
  '.pkmsvv-evo-panel h2{color:#ffde72;text-align:center;margin:0 0 12px;font-size:25px}\n' +
  '.pkmsvv-evo-panel p{color:#d8e8fc;margin:8px 0 14px;line-height:1.45}\n' +
  '.pkmsvv-evo-option,.pkmsvv-evo-skip{display:block;width:100%;padding:12px;border-radius:8px;font-family:inherit;font-size:16px;cursor:pointer;margin:8px 0;text-align:left}\n' +
  '.pkmsvv-evo-option{background:#304c7c;color:#fff;border:1px solid #8ebcfb}.pkmsvv-evo-option:hover{background:#42669e}\n' +
  '.pkmsvv-evo-skip{background:#151f35;color:#c3cede;border:1px solid #536b90;text-align:center}\n' +
  '</style>\n</head>');
html = html.replace('Web oficial: pokesurvivor.com · si alguien te pide pagar, no somos nosotros',
  'PKMSVV: edición offline no oficial · solo uso personal sin fines comerciales');
fs.writeFileSync(indexPath, html, 'utf8');

const notice = fs.readFileSync(path.join(project, 'NOTICE.md'), 'utf8');
fs.writeFileSync(path.join(game, 'NOTICE-PKMSVV.txt'), notice, 'utf8');
console.log('PKMSVV READY: local source, offline cloud disabled, evolution rules (' + evolution.rules.length + ') and tuning applied.');
