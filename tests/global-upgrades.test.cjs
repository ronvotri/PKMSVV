'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),context={G:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src','pkmsvv-global-power.js'),'utf8'),context);
const P=context.G.GlobalPower;
const obj=x=>JSON.parse(JSON.stringify(x));

test('twelve independent worldwide permanent powerups',()=>{
 assert.equal(P.LIST.length,12);
 for(const u of P.LIST) assert.ok(P.BY[u.id]===u);
 assert.equal(P.LIST.reduce((n,u)=>n+u.max,0),80);
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
 const r=P.combine(personal,{power:5,rapid:3,vital:2,opening:2,reach:4,reroll:3});
 assert.ok(Math.abs(r.atkMul-1.92)<1e-9);
 assert.ok(Math.abs(r.cdMul-.765)<1e-9);
 assert.equal(r.hp,74);assert.equal(r.startMoves,3);assert.equal(r.rerolls,5);
 assert.ok(Math.abs(r.magnetMul-1.792)<1e-9);
 assert.equal(personal.hp,24);
});
test('low-cost early power and two extra skills available',()=>{
 assert.equal(P.cost('power',0),100);
 assert.equal(P.cost('opening',0),250);
 assert.equal(P.cost('opening',1),1250);
 const s={coins:750,globalUpgrades:{}};
 assert.equal(P.purchase(s,'opening'),true);
 assert.equal(s.coins,500);
 assert.equal(P.combine({},s.globalUpgrades).startMoves,2);
 assert.equal(P.purchase(s,'power'),true);
 assert.equal(P.combine({},s.globalUpgrades).atkMul,1.12);
 assert.equal(P.purchase(s,'opening'),false);
});
test('refund returns exactly spent coins, never changes individual Pokémon upgrades',()=>{
 const s={coins:3000,globalUpgrades:{},pupg:{25:{hp:3}}};
 const original=s.coins;
 for(const id of ['vital','power','rapid','healing'])assert.ok(P.purchase(s,id));
 const spent=P.spent(s.globalUpgrades);
 assert.ok(spent>0);
 assert.equal(P.refundAll(s),spent);
 assert.equal(s.coins,original);
 assert.deepEqual(obj(s.globalUpgrades),{});
 assert.equal(s.pupg[25].hp,3);
 assert.equal(P.refundAll(s),0);
});
test('rank clamping and merge do not read unrelated saved fields',()=>{
 const old={power:3,vital:5};
 const incoming={power:7,vital:3,opening:9000,INVALID:2};
 assert.deepEqual(obj(P.merge(old,incoming)),{power:7,vital:5,opening:2});
 assert.equal(P.rank({power:'not-a-number'},'power'),0);
});
test('compiled game has the new menu, save schema, and start move integration',()=>{
 const base=path.join(root,'vendor','pokesurvivor');
 if(!fs.existsSync(path.join(base,'index.html')))return;
 const read=f=>fs.readFileSync(path.join(base,f),'utf8');
 assert.match(read('index.html'),/scr-global-powerups/);
 assert.match(read('index.html'),/data-go="global"/);
 assert.match(read('js/game.js'),/G\.GlobalPower\.combine/);
 assert.match(read('js/game.js'),/Math\.min\(3,perks\.startMoves\)/);
 assert.match(read('js/core/db.js'),/globalUpgrades: \{\}/);
 assert.match(read('js/app.min.js'),/GlobalPower|globalUpgrades|pkmg-list/);
});
