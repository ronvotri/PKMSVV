'use strict';

/**
 * Patch a CLEAN, pinned checkout of the official game, then rebuild its
 * bundled JavaScript. Every change is required to match EXACTLY ONE source
 * location; upstream refactors fail closed instead of silently misbuilding.
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
  if (parts.length !== 2) {
    throw new Error('Không tìm thấy chính xác một vị trí cần chỉnh trong ' + rel + ': ' + before);
  }
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

// Explicitly disable cloud credentials in the bundled client, never talk to
// the original developer's Firebase project with unofficial offline builds.
fs.writeFileSync(path.join(game, 'js/core/firebase-config.js'),
  '/* PKMSVV: forced local saves, Firebase deliberately disabled. */\nG.FIREBASE_CONFIG = null;\n', 'utf8');

// The upstream build reads dev.html and regenerates index.html and locales.
// --expose avoids remote-only anti-cheat obfuscation tools; no online gameplay
// or multiplayer is enabled in the desktop wrapper.
execFileSync(process.execPath, [path.join(game, 'tools', 'build.js'), '--sin-seo', '--expose'], { cwd: game, stdio: 'inherit' });

const indexPath = path.join(game, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('</head>')) throw new Error('index.html không có thẻ head');
html = html.replace(/<title>[^<]*<\/title>/, '<title>PKMSVV — PokéSurvivor Offline</title>');
html = html.replace('</head>', '<style>\n' +
  '#scr-menu [data-go="friends"], #scr-menu [data-go="rank"], #btn-google { display: none !important; }\n' +
  '</style>\n</head>');
html = html.replace('Web oficial: pokesurvivor.com · si alguien te pide pagar, no somos nosotros',
  'PKMSVV: edición offline no oficial · solo uso personal sin fines comerciales');
fs.writeFileSync(indexPath, html, 'utf8');

const notice = fs.readFileSync(path.join(project, 'NOTICE.md'), 'utf8');
fs.writeFileSync(path.join(game, 'NOTICE-PKMSVV.txt'), notice, 'utf8');
console.log('PKMSVV READY: local source built, offline cloud disabled, tuning applied.');
