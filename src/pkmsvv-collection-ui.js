/* PKMSVV: goals supplement UI; existing daily/weekly missions remain untouched. */
G.PKMSVVCollectUI=(()=>{
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n||0).toLocaleString('vi-VN');
 const mon=id=>G.DEX_BY[id];
 function action(box,selector,handler){box.querySelectorAll(selector).forEach(el=>el.addEventListener('click',()=>handler(el)));}
 function render(box){
   const s=G.DB.save;
   if(!s)return;
   G.PKMSVVCollect.ensure(s);
   if(G.PKMSVVCollect.checkCollection(s)) G.DB.commit(true);
   const d=s.pkmDaily,w=s.pkmWeekly;
   const name=id=>mon(id)?esc(mon(id).name):'Pokémon chưa xác định';
   const stampCount=G.PKMSVVCollect.stampsCount(s);
   const all=G.DEX.filter(p=>G.SPRITE_META[p.dex]).length;
   const dailyDone=d.complete,weeklyDone=w.dexes.length&&w.done.length===w.dexes.length;
   const dailyInfo=d.dex?'<b>'+name(d.dex)+'</b> — Sống sót ít nhất 3 phút.':'Hãy mở khóa Pokémon đầu tiên.';
   const targetRows=w.dexes.map(dex=>
     '<div class="pkm-task"><span>'+(w.done.includes(dex)?'✅':'◻️')+' '+name(dex)+'</span>'+
     '<button class="btn small ghost" data-pkm-choose="'+dex+'">Chọn</button></div>').join('');
   const block=document.createElement('section');block.className='pkm-collection-goals';
   block.innerHTML=
    '<div class="pkm-guide"><h3>⭐ NHIỆM VỤ POKÉMON HÔM NAY</h3>'+
    '<p>'+dailyInfo+'</p><p class="sub">Thưởng: 500 PokéCoins + 2 vé Gacha</p>'+
    '<div class="pkm-task">'+(dailyDone?'✅ Đã hoàn thành':'◻️ Chưa hoàn thành')+
    (d.dex?'<button class="btn small ghost" data-pkm-choose="'+d.dex+'">Chọn Pokémon</button>':'')+
    '<button class="btn small gold" data-pkm-claim="daily" '+(!dailyDone||d.claimed?'disabled':'')+'>'+(d.claimed?'Đã nhận':'Nhận thưởng')+'</button></div></div>'+
    '<div class="pkm-guide"><h3>🏆 THỬ THÁCH TUẦN</h3>'+
    '<p class="sub">Sống sót 3 phút với từng Pokémon được chỉ định, hoàn thành cả bộ để nhận 2.500 PokéCoins + 1 vé ×10.</p>'+
    (targetRows||'<p>Chưa có Pokémon để chọn.</p>')+
    '<div class="pkm-task"><strong>'+w.done.length+'/'+w.dexes.length+' Pokémon</strong>'+
    '<button class="btn small gold" data-pkm-claim="weekly" '+(!weeklyDone||w.claimed?'disabled':'')+'>'+(w.claimed?'Đã nhận':'Nhận thưởng')+'</button></div></div>'+
    '<div class="pkm-guide"><h3>🏅 DẤU ẤN POKÉDEX</h3>'+
    '<p>Chơi 3 phút với một Pokémon lần đầu để nhận dấu ấn và <b>150 PokéCoins</b>.</p>'+
    '<p><b>'+stampCount+' / '+all+'</b> Dấu Ấn đã thu thập</p>'+
    '<div class="pkm-stamp-grid">'+[10,25,50,100,250,500,all].filter((n,i,a)=>n<=all&&a.indexOf(n)===i).map(n=>
     '<span class="'+(s.pkmMilestones[n]?'pkm-medal-on':'')+'"> '+(s.pkmMilestones[n]?'🏅':'🔒')+' '+n+' dấu ấn</span>').join('')+'</div>'+
    '<p class="sub">Hoàn thành Gen: +5.000 PokéCoins, 1 vé ×10. Shiny đầy Gen: +10.000 PokéCoins.</p></div>';
   box.appendChild(block);
   action(block,'[data-pkm-claim]',el=>{
     if(!G.PKMSVVCollect.claim(s,el.dataset.pkmClaim))return;
     G.DB.commit(true);G.UI.refreshCoins();G.Audio.sfx('buy');renderReplace(box);
   });
   action(block,'[data-pkm-choose]',el=>{
     const dex=Number(el.dataset.pkmChoose);
     if(!G.PKMSVVCollect.choose(s,dex))return;
     G.DB.commit(true);G.UI.toast('Đã chọn '+name(dex).replace(/&amp;/g,'&'));G.MenuUI.open();
   });
 }
 function renderReplace(box){
   // Rerender goals through its public entry point; restores original missions.
   G.GoalsUI.open('missions');
 }
 return {render};
})();