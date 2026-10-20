'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..','vendor','pokesurvivor');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function load(){
 const G={};new Function('G',read('js/data/moves.js'))(G);
 new Function('G',read('js/data/pkmsvv-skill-balance.js'))(G);return G;
}
test('all 103 skills have a cooldown policy across 23 effect families',()=>{
 const G=load(),audit=G.PKMSVVBalance.audit();
 assert.equal(audit.length,103);assert.equal(new Set(audit.map(x=>x.kind)).size,23);
 for(const x of audit){assert.ok(x.baseCd>0 && x.minEffective>0,x.id);assert.ok(x.baseCd>=x.minEffective||x.kind==='orbit',x.id)}
});
test('six buffs have downtime from level 1 to 4 then one permanent max-level effect',()=>{
 const G=load(),buffs=Object.values(G.Moves.BY_ID).filter(x=>x.kind==='buff');
 assert.equal(buffs.length,6);
 for(const d of buffs){
  const m=G.Moves.instance(d.id),pl={cdMul:0.01};
  for(let lvl=1;lvl<5;lvl++){
   assert.ok(m.dur<G.PKMSVVBalance.effectiveCooldown(pl,m),d.id+' Lv'+lvl);
   G.Moves.levelUp(m);
  }
  assert.equal(m.lvl,5);
  const owner={buffs:{[m.stat]:{n:0,t:0,amount:0}}};
  assert.equal(G.PKMSVVBalance.refreshBuff(owner,m),true);
  assert.equal(owner.buffs[m.stat].n,1);
  assert.equal(owner.buffs[m.stat].t,Infinity);
  assert.equal(m.t,Infinity);
 }
});
test('global cooldown reduction cannot create infinite skill spam',()=>{
 const G=load(),pl={cdMul:0.00001};
 for(const def of Object.values(G.Moves.BY_ID)){
  if(def.kind==='buff'||def.kind==='orbit')continue;
  const m=G.Moves.instance(def.id),min=G.PKMSVVBalance.profiles[m.kind].floor;
  assert.ok(G.PKMSVVBalance.effectiveCooldown(pl,m)>=min,def.id);
 }
});
test('buff indicators, nonstack and combat guard are integrated',()=>{
 const player=read('js/entities/player.js'),hud=read('js/ui/hud.js'),combat=read('js/systems/combat.js');
 assert.match(player,/b\.n = 1; \/\/ PKMSVV/);
 assert.match(hud,/OFF '/);assert.match(hud,/ON '/);assert.match(hud,/MAX/);
 assert.match(combat,/G\.PKMSVVBalance\.effectiveCooldown\(pl, m\)/);
 assert.match(combat,/G\.PKMSVVBalance\.refreshBuff\(pl, m\)/);
});
