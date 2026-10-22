'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const built=()=>fs.existsSync(path.join(root,'vendor/pokesurvivor/index.html'));
function game(){
 const pokemon={dex:25,name:'Pikachu',pa:1.1,sa:1.5,df:95,sd:110,spd:90,atk:1.5,types:['electric']};
 const G={DB:{save:{created:100,updated:100,partner:25,owned:{25:{}},coins:15000,bag:{},tms:{},ptm:{},pnat:{},pabil:{}},commit:()=>true},
    DEX_BY:{25:pokemon},DEX_ABIL:{25:['static','lightning-rod','surge-surfer']},I18n:{lang:'vi',locale:'vi-VN'},
    Moves:{BY_ID:{'thunder-shock':{id:'thunder-shock',type:'electric'},
      'surf':{id:'surf',type:'water'}},poolFor:()=>['thunder-shock']},
    TM_MOVES:{surf:[25]},TM_PRICE:{surf:440},TM_OF:d=>d===25?['surf']:[],Gacha:{}};
 const ctx={G,Date,JSON,Intl,Number,String,Math,Set,Array,Object,Map};
 for(const file of ['data/natures.js','data/abilities.js','systems/mons.js','data/shop.js']){
  vm.runInNewContext(read('src/kecleon/upstream/'+file),ctx,{timeout:4000});
 }
 return G;
}
test('New Nature applies +10/-10 to run clone and keeps Pokédex base intact',()=>{
 const G=game(),before={...G.DEX_BY[25]};
 G.Mons.setNature(25,'modest');
 const mon=G.Mons.monFor(25);
 assert.equal(mon.sa,before.sa*1.1);
 assert.equal(mon.pa,before.pa*0.9);
 assert.equal(G.DEX_BY[25].sa,before.sa);
 assert.deepEqual(Array.from(Object.keys(G.DB.save.pnat)),['25']);
});
test('Kecleon store purchases Mint and Capsule with PokéCoins into Bag',()=>{
 const G=game(),s=G.DB.save;
 assert.equal(G.Shop.buy('mint').ok,true);
 assert.equal(s.coins,13500);
 assert.equal(s.bag.mint,1);
 assert.equal(G.Shop.buy('cap').ok,true);
 assert.equal(s.bag.cap,1);
 assert.equal(G.Shop.take('mint'),true);
 assert.equal(G.Shop.count('mint'),0);
 s.coins=0;
 assert.equal(G.Shop.buy('caph').ok,false);
 assert.equal(s.bag.caph||0,0);
});
test('TM taught to compatible Pokémon is consumed once, permanent and never duplicated',()=>{
 const G=game(),s=G.DB.save;
 s.tms.surf=1;
 assert.equal(G.Mons.canLearn(25,'surf'),true);
 assert.equal(G.Mons.teach(25,'surf'),true);
 assert.equal(s.tms.surf||0,0);
 assert.ok(G.Mons.taught(25).includes('surf'));
 assert.equal(G.Mons.canLearn(25,'surf'),false);
 assert.equal(G.Mons.teach(25,'surf'),false);
});
test('Ability Capsule stores chosen Ability and rejects unowned hidden slots',()=>{
 const G=game();
 // Synthetic two-standard-slot fixture: the upstream Pokédex ability catalog overwrites mocks.
 G.DEX_ABIL[25]=['static','lightning-rod','surge-surfer'];
 const options=G.Mons.abilityChoices(25,false);
 assert.ok(options.length);
 G.Mons.setAbility(25,options[0]);
 assert.equal(G.Mons.abilityOf(25).slot,options[0]);
 assert.equal(G.Mons.abilityChoices(25,false).includes(2),false);
});
test('Compiled game includes new Kecleon screens and Nature/Ability hooks',()=>{
 if(!built())return;
 const base='vendor/pokesurvivor/';
 const html=read(base+'index.html');
 for(const k of ['scr-kecleon','pkmk-tab-shop','pkmk-tab-bag','data-go="shop"','data-go="bag"'])assert.match(html,new RegExp(k));
 for(const file of ['js/data/natures.js','js/data/abilities.js','js/data/tms.js','js/data/shop.js','js/data/ability-fx.js','js/systems/mons.js','js/ui/pkmsvv-kecleon-ui.js'])
  assert.ok(fs.existsSync(path.join(root,base,file)),file);
 const moves=read(base+'js/data/moves.js');
 const pl=read(base+'js/entities/player.js');
 const game=read(base+'js/game.js');
 assert.match(moves,/G\.Mons\.taught/);
 assert.match(game,/G\.Mons\.monFor/);
 assert.match(game,/pl\.setAbility/);
 assert.match(pl,/G\.AbilityFX\.of/);
 assert.match(read(base+'js/app.min.js'),/pkmk-balance/);
});
test('Owner-approved changelog is not modified by this integration',()=>{
 const doc=read('src/pkmsvv-changelog-v11.js');
 assert.match(doc,/15 Nâng cấp Toàn Đội/);
 assert.doesNotMatch(doc,/Kecleon Shop|Túi đồ|Cửa hàng Kecleon/);
 if(built())assert.equal(read('vendor/pokesurvivor/js/data/changelog.js').trim(),doc.trim());
});

test('Kecleon Pokédex pane escapes apostrophes and refreshes after item changes',()=>{
 const G=game(),s=G.DB.save;
 G.AbilityFX={of:()=>({})};G.T=v=>v;
 G.Moves.BY_ID.surf.name="Trainer's Wave";
 s.ptm={25:['surf']};
 const host={
  panel:null,
  querySelector(sel){return sel==='#pkmk-dex-stats'?this.panel:null;},
  appendChild(el){this.panel=el;}
 };
 const document={createElement(){return {
  id:'',className:'',innerHTML:'',
  remove(){if(host.panel===this)host.panel=null;},
  querySelector(){return {onclick:null};}
 };}};
 vm.runInNewContext(read('src/kecleon/pkmsvv-kecleon-ui.js'),{G,document,Date,Number,String,Intl,Math});
 G.KecleonUI.attachDex(25,host);
 const original=host.panel;
 assert.match(original.innerHTML,/Trainer&#39;s Wave/);
 assert.doesNotMatch(original.innerHTML,/Trainerundefineds/);
 s.ptm[25]=[];
 G.KecleonUI.attachDex(25,host);
 assert.notEqual(host.panel,original);
 assert.match(host.panel.innerHTML,/Chưa có/);
});
