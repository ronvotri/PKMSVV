'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const load=f=>fs.readFileSync(path.join(root,'vendor','pokesurvivor',f),'utf8');
test('Pokedex Start is gated on explicitly selecting an owned Pokémon',()=>{
 const f=path.join(root,'vendor','pokesurvivor/js/ui/pkmsvv-pad-flow.js');
 if(!fs.existsSync(f))return;
 const ctx={G:{}};vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
 const p=ctx.G.PKMSVVPadFlow;
 const save={partner:25,owned:{25:{},1:{}}};
 assert.equal(p.consumeSelected(save),false,'No phantom run on merely opening Pokédex');
 p.select(1);
 assert.equal(p.consumeSelected(save),false,'Selecting a different Pokémon cannot arm Start');
 p.select(25);
 assert.equal(p.consumeSelected(save),true);
 assert.equal(p.consumeSelected(save),false,'One selection = one Start');
 p.select(25);p.reset();
 assert.equal(p.consumeSelected(save),false,'Leaving Pokédex disarms shortcut');
 p.select(25);delete save.owned[25];
 assert.equal(p.consumeSelected(save),false,'Locked Pokémon cannot enter a run');
});
test('Gacha result overlay is recognized by pad navigation and A can press continue',()=>{
 const dir=path.join(root,'vendor','pokesurvivor');
 if(!fs.existsSync(path.join(dir,'index.html')))return;
 const listeners={};
 function classList(names=[]){const set=new Set(names);return{
  contains:n=>set.has(n),add:n=>set.add(n),remove:n=>set.delete(n)};
 }
 const btn={id:'pull-close',disabled:false,isConnected:true,classList:classList(['btn']),
  textContent:'Continuar',getBoundingClientRect(){return{left:300,top:200,width:120,height:40,right:420,bottom:240};},
  matches:s=>s==='button'||s==='select'||s==='input'||s==='.play, .btn.gold, .card'?s==='button':s.includes('button'),
  contains:el=>el===btn,hasAttribute:()=>false,click(){this.clicked=(this.clicked||0)+1},
  scrollIntoView(){}};
 const fx={id:'pull-fx',classList:classList(),querySelectorAll:s=>s==='*'?[btn]:[btn]};
 const gacha={id:'scr-gacha',classList:classList(),querySelectorAll:()=>[]};
 let buttons=Array.from({length:16},()=>({pressed:false,value:0}));
 const mockPad={connected:true,id:'Test Controller',axes:[0,0,0,0],get buttons(){return buttons}};
 const context={G:{Settings:{get:()=>true},Game:{state:'ui'},DB:{save:{partner:25,owned:{25:{}}}},
     Flow:{play:()=>{}},Input:{virtual:()=>{}},UI:{}},
   innerWidth:900,innerHeight:600,
   navigator:{getGamepads:()=>[mockPad]},
   addEventListener:(n,cb)=>listeners[n]=cb,
   getComputedStyle:()=>({zIndex:'0',cursor:'auto'}),
   document:{getElementById:id=>id==='pull-fx'?fx:null,
     querySelectorAll:q=>q==='.scr:not(.hidden)'?[gacha]:[],
     elementFromPoint:()=>btn},
   setTimeout:()=>0,Event:function Event(name){this.type=name;},
   performance:{now:()=>0}};
 vm.runInNewContext(load('js/core/gamepad.js'),context);
 assert.equal(context.G.Pad.focusElement(btn),true,'Continue must be in top navigation scope');
 buttons[0].pressed=true;context.G.Pad.poll(.016);
 assert.equal(btn.clicked,1,'A triggers Continue while results overlay is visible');
});
test('all related controller fixes are included in the compiled bundle',()=>{
 const dir=path.join(root,'vendor','pokesurvivor');
 if(!fs.existsSync(path.join(dir,'index.html')))return;
 const pad=load('js/core/gamepad.js'),menu=load('js/ui/menu.js'),evo=load('js/systems/pkmsvv-evolution.js'),gacha=load('js/ui/gacha-ui.js'),html=load('index.html');
 assert.match(pad,/getElementById\("pull-fx"\)/);
 assert.match(pad,/focusElement\(el\)/);
 assert.match(pad,/top\.id === 'scr-dex'/);
 assert.match(pad,/G\.PKMSVVPadFlow\.consumeSelected/);
 assert.match(gacha,/G\.Pad\.focusElement\(\$\('pull-close'\)\)/);
 assert.match(evo,/G\.Pad\.focusElement\(panel\.querySelector\('\.pkmsvv-evo-option'\)\)/);
 assert.match(menu,/G\.PKMSVVPadFlow\.select\(dex\)/);
 assert.match(html,/id="dex-play-now"/);
 assert.match(load('js/app.min.js'),/PKMSVVPadFlow|pkmsvv-pad-flow/);
});
