'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),context={G:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src','pkmsvv-global-power.js'),'utf8'),context);
const P=context.G.GlobalPower;
const obj=x=>JSON.parse(JSON.stringify(x));

test('thirteen worldwide permanent powerups including costly revival',()=>{
 assert.equal(P.LIST.length,13);
 for(const u of P.LIST) assert.ok(P.BY[u.id]===u);
 assert.equal(P.LIST.reduce((n,u)=>n+u.max,0),80);
 assert.equal(P.BY.opening.max,1);
 assert.equal(P.BY.revive.max,1);
});
test('new account and old saves start without global buffs',()=>{
 assert.deepEqual(obj(P.clean(null)),{});
 assert.deepEqual(obj(P.clean({power:-4,rapid:999,garbage:50})),{rapid:8});
 const p=P.combine({atkMul:1.1,cdMul:.88, startMoves:2,hp:8},null);
 assert.equal(p.atkMul,1.1);assert.equal(p.cdMul,.88);
 assert.equal(p.startMoves,2);assert.equal(p.hp,8);
});
test('global and per-Pokémon strength stack without replacing old levels',()=>{
 const personal={atkMul:1.2,cdMul:.90,magnetMul:1.12,rerolls:2,startMoves:2,crit:.15,hp:24};
 const r=P.combine(personal,{power:5,rapid:3,vital:2,opening:1,reach:4,reroll:3});
 assert.ok(Math.abs(r.atkMul-1.92)<1e-9);
 assert.ok(Math.abs(r.cdMul-.765)<1e-9);
 assert.equal(r.hp,74);assert.equal(r.startMoves,2);assert.equal(r.rerolls,5);
 assert.ok(Math.abs(r.magnetMul-1.792)<1e-9);
 assert.equal(personal.hp,24);
});
test('triple-priced starting skills and base stats, with same strength effects',()=>{
 assert.equal(P.cost('power',0),300);
 assert.equal(P.cost('opening',0),750);
 assert.equal(P.cost('opening',1),0);
 const s={coins:1500,globalUpgrades:{},globalSpent:{}};
 assert.equal(P.purchase(s,'opening'),true);
 assert.equal(s.coins,750);
 assert.equal(P.combine({},s.globalUpgrades).startMoves,2);
 assert.equal(P.purchase(s,'power'),true);
 assert.equal(P.combine({},s.globalUpgrades).atkMul,1.12);
 assert.equal(P.purchase(s,'opening'),false);
});
test('refund returns exactly spent coins, never changes individual Pokémon upgrades',()=>{
 const s={coins:3000,globalUpgrades:{},pupg:{25:{hp:3}}};
 const original=s.coins;
 for(const id of ['vital','power','rapid','healing'])assert.ok(P.purchase(s,id));
 const spent=P.refundable(s);
 assert.ok(spent>0);
 assert.equal(P.refundAll(s),spent);
 assert.equal(s.coins,original);
 assert.deepEqual(obj(s.globalUpgrades),{});
 assert.deepEqual(obj(s.globalSpent),{});
 assert.equal(s.pupg[25].hp,3);
 assert.equal(P.refundAll(s),0);
});
test('rank clamping and merge do not read unrelated saved fields',()=>{
 const old={power:3,vital:5};
 const incoming={power:7,vital:3,opening:9000,INVALID:2};
 assert.deepEqual(obj(P.merge(old,incoming)),{power:7,vital:5,opening:1});
 assert.equal(P.rank({power:'not-a-number'},'power'),0);
});
test('compiled game has the new menu, save schema, and start move integration',()=>{
 const base=path.join(root,'vendor','pokesurvivor');
 if(!fs.existsSync(path.join(base,'index.html')))return;
 const read=f=>fs.readFileSync(path.join(base,f),'utf8');
 assert.match(read('index.html'),/scr-global-powerups/);
 assert.match(read('index.html'),/data-go="global"/);
 assert.match(read('js/game.js'),/G\.GlobalPower\.combine/);
 assert.match(read('js/game.js'),/Math\.min\(2,perks\.startMoves\)/);
 assert.match(read('js/core/db.js'),/globalUpgrades: \{\}/);
 assert.match(read('js/core/db.js'),/globalSpent: \{\}/);
 assert.match(read('js/core/db.js'),/G\.GlobalPower\.legacyLedger/);
 assert.match(read('js/entities/player.js'),/G\.GlobalPower\.tryRevive\(this\)/);
 assert.match(read('js/entities/player.js'),/this\.extraRevives = perks\.revives \|\| 0/);
 assert.match(read('js/core/db.js'),/s\.coins \+= 1250/);
 assert.match(read('js/app.min.js'),/GlobalPower|globalUpgrades|pkmg-list/);
});

test('revival is deliberately expensive, bought exactly once permanently',()=>{
 const unaffordable={coins:49999,globalUpgrades:{}};
 assert.equal(P.purchase(unaffordable,'revive'),false);
 assert.equal(P.cost('revive',0),50000);
 assert.equal(P.originalCost('revive',0),50000);
 const s={coins:50100,globalUpgrades:{}};
 assert.equal(P.purchase(s,'revive'),true);
 assert.equal(s.coins,100);
 assert.equal(P.purchase(s,'revive'),false);
 assert.equal(P.combine({},s.globalUpgrades).revives,1);
 assert.equal(P.cost('revive',1),0);
});
test('the purchased revival activates at fatal HP only once per run',()=>{
 const pl={hp:-24,maxHp:200,dead:false,extraRevives:1,invuln:0,
   revive(fraction){this.hp=Math.round(this.maxHp*fraction);this.dead=false;this.invuln=2;}
 };
 assert.equal(P.tryRevive(pl),true);
 assert.equal(pl.hp,120);
 assert.equal(pl.invuln,3);
 assert.equal(pl.extraRevives,0);
 pl.hp=0;pl.invuln=0;
 assert.equal(P.tryRevive(pl),false);
 const sashSaved={...pl,hp:1,extraRevives:1};
 assert.equal(P.tryRevive(sashSaved),false);
 assert.equal(sashSaved.extraRevives,1);
 const noUnlock={...pl,hp:0,extraRevives:0};
 assert.equal(P.tryRevive(noUnlock),false);
});
test('an earlier 3-skill save is capped at two and returns legacy second-rank cost',()=>{
 assert.equal(P.combine({}, {opening:2}).startMoves,2);
 assert.deepEqual(obj(P.clean({opening:2})),{opening:1});
 const s={coins:2000,globalUpgrades:{opening:1,revive:1}};
 assert.equal(P.refundAll(s),50250);
 assert.equal(s.coins,52250);
});

test('ALL 12 non-revive upgrades cost triple for every purchase level',()=>{
 assert.equal(P.PRICE_MULTIPLIER,3);
 for(const u of P.LIST) {
   for(let level=0;level<u.max;level++) {
     assert.equal(P.cost(u.id,level),P.originalCost(u.id,level)*(u.id==='revive'?1:3),u.id+' rank '+level);
   }
 }
 assert.equal(P.cost('reach',0),210);
 assert.equal(P.cost('vital',0),240);
 assert.equal(P.cost('rapid',0),420);
 assert.equal(P.cost('opening',0),750);
 assert.equal(P.cost('revive',0),50000);
});
test('legacy saves keep original purchase price when refunding despite 3x price updates',()=>{
 const levels={power:1,rapid:2,opening:1,revive:1};
 const legacy=P.legacyLedger(levels);
 assert.equal(legacy.power,100);
 assert.equal(legacy.opening,250);
 assert.equal(legacy.revive,50000);
 const s={coins:12000,globalUpgrades:{...levels},globalSpent:legacy};
 const paidBefore=P.refundable(s);
 assert.equal(paidBefore,P.spent(levels,legacy));
 assert.equal(P.cost('power',1),390);
 assert.equal(P.purchase(s,'power'),true);
 assert.equal(s.globalUpgrades.power,2);
 assert.equal(s.globalSpent.power,490);
 assert.equal(P.refundable(s),paidBefore+390);
 assert.equal(P.refundAll(s),paidBefore+390);
 assert.equal(s.coins,12000+paidBefore);
 assert.equal(s.globalUpgrades.power,undefined);
});
test('ledger sanitization prevents over-credit from impossible amounts',()=>{
 const s={coins:0,globalUpgrades:{power:1},globalSpent:{power:100000000,revive:50000,INVALID:10000}};
 assert.equal(P.refundable(s),300);
 assert.deepEqual(obj(P.cleanLedger(s.globalSpent,s.globalUpgrades)),{power:300});
});
