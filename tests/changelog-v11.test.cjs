'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'..');
const src=x=>fs.readFileSync(path.join(base,x),'utf8');
const baseG={};vm.runInNewContext(src('src/pkmsvv-changelog-v11.js'),{G:baseG});
const entry=baseG.CHANGELOG[0];

function render(locale){
 const controls={};
 function element(id){
   return controls[id] ||= {id,innerHTML:'',scrollTop:-1,onclick:null,
     classList:{toggle(){},remove(){},add(){}}};
 }
 const G={CHANGELOG:baseG.CHANGELOG,I18n:{lang:locale,locale:locale==='vi'?'vi-VN':'en-GB'},
   UI:{$:element},Icons:{html:()=>''},T:s=>s};
 const context={G,Date,localStorage:{getItem:()=>null,setItem:()=>{}}};
 vm.runInNewContext(src('vendor/pokesurvivor/js/ui/news-ui.js'),context);
 G.NewsUI.init();
 G.NewsUI.open();
 return controls['news-body'].innerHTML;
}
test('owner-approved v1.1 release text has complete VI/EN pair structure',()=>{
 assert.equal(baseG.CHANGELOG.length,1);
 assert.equal(entry.d,'2026-10-22');
 assert.ok(entry.title[0].includes('v1.1'));
 assert.equal(entry.new.length,4);
 assert.equal(entry.chg.length,3);
 assert.equal(entry.fix.length,4);
 for(const key of ['title','subtitle','credit'])
   assert.equal(entry[key].length,2);
 for(const section of ['new','chg','fix'])
   for(const pair of entry[section]){
     assert.equal(pair.length,2);assert.ok(pair[0].trim()&&pair[1].trim());
   }
});
test('Vietnamese release screen displays approved Vietnamese copy, not English fallback',()=>{
 const compiled=path.join(base,'vendor/pokesurvivor/js/ui/news-ui.js');
 if(!fs.existsSync(compiled))return;
 const html=render('vi');
 assert.ok(html.includes('15 Nâng cấp Toàn Đội'));
 assert.ok(html.includes('TÍNH NĂNG MỚI'));
 assert.ok(html.includes('THAY ĐỔI GAMEPLAY'));
 assert.ok(html.includes('CẢI TIẾN &amp; SỬA LỖI'));
 assert.ok(html.includes('Đồng hành'));
 assert.ok(html.includes('10%'));
 assert.ok(html.includes('Votri Valley — Bản chỉnh sửa'));
 assert.equal(html.includes('15 Team Powerups'),false);
});
test('English release screen displays approved English copy, not Vietnamese fragments',()=>{
 const compiled=path.join(base,'vendor/pokesurvivor/js/ui/news-ui.js');
 if(!fs.existsSync(compiled))return;
 const html=render('en');
 assert.ok(html.includes('15 Team Powerups'));
 assert.ok(html.includes('NEW FEATURES'));
 assert.ok(html.includes('GAMEPLAY CHANGES'));
 assert.ok(html.includes('IMPROVEMENTS &amp; FIXES'));
 assert.ok(html.includes('Choose Partner'));
 assert.ok(html.includes('Candelabrador'));
 assert.ok(html.includes('Votri Valley — A noncommercial modification'));
 assert.equal(html.includes('15 Nâng cấp Toàn Đội'),false);
 assert.equal(html.includes('Chọn đồng hành'),false);
});
test('release text reaches offline compiled game assets with no unapproved extra entries',()=>{
 const vendor=path.join(base,'vendor/pokesurvivor');
 if(!fs.existsSync(path.join(vendor,'index.html')))return;
 const payload=src('vendor/pokesurvivor/js/data/changelog.js');
 assert.ok(payload.startsWith(src('src/pkmsvv-changelog-v11.js')));
 assert.ok(payload.includes(src('src/pkmsvv-changelog-v12.js').trim()));
 assert.match(payload,/G\.CHANGELOG\.unshift\(/);
 const bundled=src('vendor/pokesurvivor/js/app.min.js');
 assert.match(bundled,/15 Team Powerups/);
 assert.match(bundled,/15 Nâng cấp Toàn Đội/);
 assert.match(bundled,/Pokémon Survivor – Votri Valley v1\.1/);
});
