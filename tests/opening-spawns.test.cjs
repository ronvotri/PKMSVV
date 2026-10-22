'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const src = path.join(root, 'vendor/pokesurvivor/js/systems/spawner.js');

function spawner() {
  const pl = {x:0,y:0,dead:false};
  const mgr = {
    count:0,
    all:()=>[],
    bossAlive:()=>false,
    add(){this.count++;}
  };
  const G = {
    EnemyMgr:mgr,
    Enemy: class {
      constructor(def,x,y,stats) {
        this.name='Test Pokémon'; this.x=x;this.y=y;this.hp=this.maxHp=stats.hp;
        this.dmg=10;this.xp=10;this.dead=false;
      }
    },
    Enemies:{BOSSES:[],rollRun(){},upcomingDex:()=>[],bagAt:()=>[{dex:25}],scale:()=>({hp:10})},
    Sprites:{preload(){},hovers:()=>false,hasShiny:()=>false},
    Camera:{outerRadius:()=>100,kick(){}},
    Coop:{scaleRate:()=>1,scaleHp:()=>1,isHost:false},
    U:{rand:(a)=>a,pick:(arr)=>arr[0],dist2:()=>999999},
    Rift:{inArena:false,leftBehind:()=>false},
    Judgment:{active:false},
    World:{isFree:()=>true},
    Audio:{sfx(){}},
    Events:{golden:false},
    Game:{player:pl,st:{time:0}}
  };
  vm.runInNewContext(fs.readFileSync(src,'utf8'),{G,Math,Set,Array,Object,Number}, {timeout:4000});
  G.Spawner.reset();
  return {G,pl,mgr};
}
const baseRate = t => (1.6 + t*0.028 + Math.pow(t/60,1.6)*0.5) * 0.28;
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10, String(a)+' versus '+String(b));

test('For exactly 180 seconds ordinary spawn rate is 2/3; returns to normal at 180s',()=>{
  if(!fs.existsSync(src)) return;
  const {G}=spawner();
  for(const t of [0,60,179,179.999]) close(G.Spawner.rate(t),baseRate(t)*2/3);
  for(const t of [180,181,300,1200]) close(G.Spawner.rate(t),baseRate(t));
});
test('Early burst adds 20 of 30 enemies; minute 3 restores full 30',()=>{
  if(!fs.existsSync(src)) return;
  for(const [time,expected] of [[0,20],[179,20],[180,30],[240,30]]){
    const {G,mgr}=spawner();G.Game.st.time=time;
    G.Spawner.burst(30);
    assert.equal(mgr.count,expected,'run time '+time);
  }
});
test('Opening tidal wave is reduced as well as steady spawns',()=>{
  if(!fs.existsSync(src))return;
  const {G,pl,mgr}=spawner();
  G.Spawner.update(32,pl,0);
  // 9 ordinary spawns plus 4 tide spawns = 13.
  assert.equal(mgr.count,13);
});
