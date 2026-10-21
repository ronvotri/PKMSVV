'use strict';
/* Install account-wide upgrades on the pinned source after normal PKMSVV patches
 * and BEFORE tools/build.js compiles dev.html into app.min.js.
 */
const fs=require('node:fs'),path=require('node:path');
const project=path.join(__dirname,'..'),game=path.join(project,'vendor','pokesurvivor');
function patch(file, before, after) {
 const p=path.join(game,file),raw=fs.readFileSync(p,'utf8');
 const parts=raw.split(before);
 if(parts.length!==2)throw Error('Global powerups: unexpected source anchor ('+file+'): '+before.slice(0,90));
 fs.writeFileSync(p,parts.join(after),'utf8');
}
for(const [src,dst] of [
 ['src/pkmsvv-global-power.js','js/data/pkmsvv-global-power.js'],
 ['src/pkmsvv-global-power-ui.js','js/ui/pkmsvv-global-power-ui.js']
])fs.copyFileSync(path.join(project,src),path.join(game,dst));

patch('dev.html',
 '<script defer src="js/data/upgrades.js"></script>',
 '<script defer src="js/data/upgrades.js"></script>\n<script defer src="js/data/pkmsvv-global-power.js"></script>');
patch('dev.html',
 '<script defer src="js/ui/menu.js"></script>',
 '<script defer src="js/ui/menu.js"></script>\n<script defer src="js/ui/pkmsvv-global-power-ui.js"></script>');

patch('dev.html',
 '<button class="menu-item" data-go="upgrades">Mejoras<small>Haz más fuerte cada run</small></button>',
 '<button class="menu-item" data-go="upgrades">Mejoras<small>Haz más fuerte cada run</small></button>\n'+
 '        <button class="menu-item" data-go="global">Nâng cấp Toàn Đội<small>Vĩnh viễn cho mọi Pokémon</small></button>');

const section=String.raw\`
<!-- ====== PKMSVV: permanent team powerups ====== -->
<section id="scr-global-powerups" class="scr dim hidden">
 <div class="box wide pkmg-panel">
  <div class="row between"><h2 id="pkmg-title">Nâng cấp Toàn Đội</h2>
   <button class="btn small ghost" id="pkmg-back" data-back>Trở về</button></div>
  <p class="sub" id="pkmg-subtitle"></p>
  <div class="pkmg-summary"><b id="pkmg-progress"></b><strong id="pkmg-balance"></strong></div>
  <div id="pkmg-list" class="pkmg-grid"></div>
  <div class="pkmg-footer"><button class="btn small ghost" id="pkmg-refund" data-sfx="none"></button></div>
 </div>
</section>
\`;
patch('dev.html','<!-- ====== Gacha ====== -->',section+'\n<!-- ====== Gacha ====== -->');
patch('js/ui/ui.js',
 "'scr-dex', 'scr-upgrades', 'scr-gacha',",
 "'scr-dex', 'scr-upgrades', 'scr-global-powerups', 'scr-gacha',");
patch('js/game.js',
 "['scr-dex', 'scr-upgrades', 'scr-gacha',",
 "['scr-dex', 'scr-upgrades', 'scr-global-powerups', 'scr-gacha',");
patch('js/ui/menu.js',
 "upgrades: 'up', gacha:",
 "upgrades: 'up', global: 'star', gacha:");
patch('js/ui/menu.js',
 "else if (go === 'upgrades') openUpgrades();",
 "else if (go === 'upgrades') openUpgrades();\n        else if (go === 'global') G.GlobalPowerUI.open();");

patch('js/core/db.js',
 "      pupg: {},               // dex -> { id -> nivel }: mejoras de cada Pokémon",
 "      pupg: {},               // dex -> { id -> nivel }: mejoras de cada Pokémon\n"+
 "      globalUpgrades: {},     // PKMSVV: account-wide upgrades for every Pokémon");
patch('js/core/db.js',
 "    s.coins = n(s.coins);",
 "    s.coins = n(s.coins);\n    s.globalUpgrades = G.GlobalPower.clean(s.globalUpgrades);");
patch('js/core/db.js',
 "    r.pupg = r.pupg || {};",
 "    r.globalUpgrades = G.GlobalPower.merge(r.globalUpgrades,older.globalUpgrades);\n    r.pupg = r.pupg || {};");

patch('js/game.js',
 "    const perks = G.Upgrades.perks(G.DB.upgradesOf(mon.dex));",
 "    const perks = G.GlobalPower.combine(G.Upgrades.perks(G.DB.upgradesOf(mon.dex)),save.globalUpgrades);");

patch('js/game.js',
 `    // Mejora "Repertorio": un segundo movimiento de ataque al azar.
    if (perks.startMoves >= 2) {
      const pool = G.Moves.poolFor(mon).filter(id => !pl.hasMove(id) && !pl.banned.has(id) && G.Moves.BY_ID[id].kind !== 'buff');
      if (pool.length) pl.addMove(G.U.pick(pool));
      pl.setActive(0);
    }`,
 `    // PKMSVV: team powerups allow up to THREE starting attacks, independent
    // of Pokémon-specific Repertorio. Never add the same move or a buff twice.
    for (let i = 1; i < Math.min(3,perks.startMoves); i++) {
      const pool = G.Moves.poolFor(mon).filter(id =>
        !pl.hasMove(id) && !pl.banned.has(id) && G.Moves.BY_ID[id].kind !== 'buff');
      if (!pool.length) break;
      pl.addMove(G.U.pick(pool));
    }
    pl.setActive(0);`);

const css=String.raw\`
/* PKMSVV: global powerups — compact 2-column layout across desktop/touch */
#scr-global-powerups{padding-top:66px}
.pkmg-panel{width:min(970px,96vw)!important;max-height:89vh;overflow-y:auto}
.pkmg-panel h2{color:var(--gold);margin:0}
.pkmg-panel .sub{line-height:1.5;margin:7px 0 10px}
.pkmg-summary{display:flex;justify-content:space-between;gap:10px;color:#ffe3a0;margin:7px 0 14px;flex-wrap:wrap}
.pkmg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.pkmg-card{border:1px solid #50658d;border-radius:11px;padding:9px;background:rgba(20,36,65,.8);display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}
.pkmg-info{display:flex;align-items:center;gap:9px;min-width:0;flex:1}
.pkmg-info strong{font-size:14px;line-height:1.4;display:block}
.pkmg-icon{width:37px;flex:0 0 37px;display:flex;justify-content:center}
.pkmg-desc{font-size:11px;color:var(--muted);line-height:1.4}
.pkmg-pips{display:flex;gap:3px;flex-wrap:wrap;margin-top:5px}
.pkmg-pips i{height:6px;width:15px;border-radius:4px;background:#31405a;border:1px solid #50658d}
.pkmg-pips i.on{background:#f4cf60;border-color:#ffd858}
.pkmg-buy{display:flex;flex-direction:column;align-items:center;gap:4px;flex:0 0 auto}
.pkmg-buy span{font-size:12px;color:#b5c9e9}
.pkmg-buy button{font-size:12px;min-width:86px;padding:7px}
.pkmg-footer{display:flex;justify-content:flex-end;padding-top:14px}
@media(max-width:660px){.pkmg-grid{grid-template-columns:1fr}.pkmg-panel{max-height:81vh}.pkmg-info strong{font-size:13px}}
\`;
const cssPath=path.join(game,'css','style.css');
fs.appendFileSync(cssPath,'\n'+css+'\n');
console.log('PKMSVV: team powerups patched; starter attacks, migration, UI and refund ready');
