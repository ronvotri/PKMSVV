/* Votri Valley: fully offline Kecleon shop + inventory.
   25 natures, abilities and TM eligibility come from JPTER78 data files.
   Every user-visible label is VI/EN selected directly (not fragment fallback).
*/
G.KecleonUI=(()=>{
 const $=id=>document.getElementById(id);
 const L=(vi,en)=>G.I18n&&G.I18n.lang==='vi'?vi:en;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>Math.floor(n||0).toLocaleString(G.I18n&&G.I18n.locale||'vi-VN');
 const NATURE_VI={
   hardy:'Chăm chỉ',bold:'Táo bạo',modest:'Khiêm tốn',calm:'Điềm tĩnh',timid:'Nhút nhát',
   lonely:'Cô độc',docile:'Ngoan ngoãn',mild:'Dịu dàng',gentle:'Hiền hòa',hasty:'Vội vàng',
   adamant:'Kiên định',impish:'Tinh nghịch',bashful:'Rụt rè',careful:'Thận trọng',
   rash:'Liều lĩnh',jolly:'Vui vẻ',naughty:'Nghịch ngợm',lax:'Thoải mái',quirky:'Kỳ quặc',
   naive:'Ngây thơ',brave:'Dũng cảm',relaxed:'Thư thái',quiet:'Trầm lặng',sassy:'Bướng bỉnh',
   serious:'Nghiêm túc'
 };
 const STAT={pa:['Tấn công','Attack'],sa:['Tấn công ĐB','Sp. Atk'],df:['Phòng thủ','Defense'],sd:['Phòng thủ ĐB','Sp. Def'],spd:['Tốc độ','Speed']};
 const natName=n=>G.I18n.lang==='vi'?(NATURE_VI[n.id]||n.n[1]):n.n[1];
 const abilName=id=>{const a=G.ABIL[id];return a?(a[1]||a[0]):L('Không có','None');};
 const statName=id=>STAT[id]?L(...STAT[id]):id;
 const natureDesc=n=>!n.up?L('Không đổi chỉ số','Neutral stats'):
   '+'+statName(n.up)+' 10% · −'+statName(n.down)+' 10%';
 const owned=()=>Object.keys(G.DB.save?.owned||{}).map(Number)
   .filter(d=>G.DEX_BY[d]).sort((a,b)=>a-b);
 const title=(id)=>G.Moves.BY_ID[id]?G.T(G.Moves.BY_ID[id].name,'move'):id;
 const price=n=>'<span class="coin"></span> '+money(n);
 const toast=(vi,en)=>G.UI.toast(L(vi,en),2800);
 const label=key=>({
   mint:L('Bạc hà','Nature Mint'),
   cap:L('Viên nang Đặc tính','Ability Capsule'),
   caph:L('Viên nang Đặc tính Ẩn','Hidden Ability Capsule')
 })[key]||key;
 const text=key=>({
   mint:L('Đổi tính cách của một Pokémon đã mở khóa.','Choose a different nature for an unlocked Pokémon.'),
   cap:L('Chuyển sang Đặc tính thường còn lại.','Switch to another standard ability.'),
   caph:L('Có thể chọn cả Đặc tính ẩn.','Allows selection of the hidden ability.')
 })[key]||'';
 let selected=null,tab='shop';
 function valid(){
  if(!G.DB.save)return false;
  if(!owned().length)return false;
  if(!owned().includes(selected))selected=Number(G.DB.save.partner)||owned()[0];
  if(!owned().includes(selected))selected=owned()[0];
  return true;
 }
 function open(which='shop'){
  tab=which==='bag'?'bag':'shop';
  if(!valid()){toast('Cần mở khóa Pokémon trước.','Unlock a Pokémon first.');return;}
  G.UI.show('scr-kecleon',true);
  render();
 }
 function row(icon,name,desc,tail=''){
  return '<div class="pkmk-row"><div class="pkmk-icon">'+icon+'</div><div class="pkmk-row-copy"><b>'+name+
   '</b><small>'+desc+'</small></div><div class="pkmk-row-tail">'+tail+'</div></div>';
 }
 function buttons(){
  const p=G.DEX_BY[selected],n=G.Mons.natureOf(selected),a=G.Mons.abilityOf(selected);
  return '<div class="pkmk-partner"><span>'+L('Dùng vật phẩm cho:','Use items on:')+'</span> '+
    '<select class="field" id="pkmk-mon">'+owned().map(d=>'<option value="'+d+'" '+(d===selected?'selected':'')+'>'+esc(G.DEX_BY[d].name)+'</option>').join('')+'</select>'+
    '<small>'+esc(p.name)+' · '+L('Tính cách','Nature')+': '+esc(natName(n))+' ('+natureDesc(n)+')'+
    ' · '+L('Đặc tính','Ability')+': '+esc(abilName(a.id))+'</small></div>';
 }
 function render(){
  if(!valid())return;
  $('pkmk-heading').textContent=L('Cửa hàng Kecleon','Kecleon Shop');
  $('pkmk-tab-shop').textContent=L('Cửa hàng','Shop');
  $('pkmk-tab-bag').textContent=L('Túi đồ','Bag');
  $('pkmk-back').textContent=L('Trở về','Back');
  $('pkmk-tab-shop').classList.toggle('gold',tab==='shop');
  $('pkmk-tab-bag').classList.toggle('gold',tab==='bag');
  $('pkmk-balance').textContent=money(G.DB.save.coins||0)+' PokéCoins';
  $('pkmk-owner').innerHTML=buttons();
  $('pkmk-list').innerHTML=tab==='shop'?shopHtml():bagHtml();
  $('pkmk-tab-shop').onclick=()=>{tab='shop';render();};
  $('pkmk-tab-bag').onclick=()=>{tab='bag';render();};
  $('pkmk-back').onclick=()=>G.MenuUI.open();
  $('pkmk-mon').onchange=e=>{selected=Number(e.target.value);render();};
  $('pkmk-list').querySelectorAll('[data-pkmk-buy]').forEach(btn=>btn.onclick=()=>{
    const what=btn.dataset.pkmkBuy, result=G.Shop.buy(what);
    if(!result.ok){toast('Không đủ xu hoặc vật phẩm đã hết hàng.','Insufficient coins or item no longer for sale.');return;}
    G.UI.refreshCoins();G.Audio.sfx('buy');render();
    toast('Đã mua! Vật phẩm được chuyển vào Túi đồ.','Purchased! Your item is in the Bag.');
  });
  $('pkmk-list').querySelectorAll('[data-pkmk-use]').forEach(btn=>btn.onclick=()=>{
    apply(btn.dataset.pkmkUse);render();
  });
  $('pkmk-list').querySelectorAll('[data-pkmk-nature]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.pkmkNature;
    if(!G.Shop.count('mint')||!G.NATURE_BY[id]||!G.Shop.take('mint'))return;
    G.Mons.setNature(selected,id);G.DB.commit(true);
    G.Audio.sfx('buy');toast('Đã đổi tính cách.','Nature changed.');render();
  });
  $('pkmk-list').querySelectorAll('[data-pkmk-ability]').forEach(btn=>btn.onclick=()=>{
    const kind=btn.dataset.pkmkKind,slot=Number(btn.dataset.pkmkAbility);
    if(!G.Mons.abilityChoices(selected,kind==='caph').includes(slot)||!G.Shop.take(kind))return;
    G.Mons.setAbility(selected,slot);G.DB.commit(true);
    G.Audio.sfx('buy');toast('Đã đổi Đặc tính.','Ability changed.');render();
  });
  $('pkmk-list').querySelectorAll('[data-pkmk-tm]').forEach(btn=>btn.onclick=()=>{
    if(!G.Mons.teach(selected,btn.dataset.pkmkTm))return;
    G.DB.commit(true);G.Audio.sfx('buy');
    toast('Đã học TM vĩnh viễn!','TM move learned permanently!');render();
  });
 }
 function buyBtn(key,cost){
  return '<button class="btn small gold" data-pkmk-buy="'+esc(key)+'" '+(G.DB.save.coins<cost?'disabled':'')+'>'+price(cost)+'</button>';
 }
 function shopHtml(){
  let s='<p class="sub">'+L('8 TM luân phiên mỗi ngày. Bạc hà và Viên nang luôn bán. Vật phẩm mua được lưu trong Túi đồ.',
  '8 TMs rotate daily. Mints and Capsules are always available. Purchases go to your Bag.')+'</p>';
  s+='<h3>'+L('Vật phẩm','Items')+'</h3>';
  for(const key of G.Shop.ORDER){
    const item=G.Shop.ITEMS[key];s+=row('🎒',esc(label(key)),esc(text(key)),
      buyBtn(key,item.price)+'<small>×'+G.Shop.count(key)+'</small>');
  }
  s+='<h3>'+L('TM hôm nay','Today’s TMs')+'</h3>';
  for(const id of G.Shop.dailyTms()){
    if(!G.Moves.BY_ID[id])continue;
    const ok=G.Mons.canLearn(selected,id),cost=G.Shop.tmPrice(id);
    s+=row('📀',esc(title(id)),'TM · '+(ok?L('Pokémon đã chọn có thể học','Selected Pokémon can learn'):L('Không tương thích hoặc đã học','Not compatible or already learned')),
      buyBtn('tm:'+id,cost)+'<small>×'+G.Shop.tmCount(id)+'</small>');
  }
  return s;
 }
 let picker='';
 function apply(kind){picker=picker===kind?'':kind;}
 function useBtn(kind,enabled){
  return '<button class="btn small" data-pkmk-use="'+kind+'" '+(!enabled?'disabled':'')+'>'+L('Sử dụng','Use')+'</button>';
 }
 function bagHtml(){
  let s='<p class="sub">'+L('Chọn Pokémon ở trên rồi sử dụng vật phẩm. TM đã học sẽ xuất hiện trong các lựa chọn chiêu từ trận sau.',
  'Choose a Pokémon above, then use an item. Learned TMs join its future move choices.')+'</p>';
  for(const k of G.Shop.ORDER) if(G.Shop.count(k)){
    const choices=k==='mint'?G.NATURES.filter(n=>n.id!==G.Mons.natureOf(selected).id):G.Mons.abilityChoices(selected,k==='caph');
    s+=row('🎒',esc(label(k)),L('Trong túi: ','In bag: ')+G.Shop.count(k),useBtn(k,choices.length>0));
    if(picker===k&&choices.length){
      s+='<div class="pkmk-choices">';
      for(const n of choices){
       const val=k==='mint'?n.id:n,name=k==='mint'?natName(n):abilName(G.Mons.slots(selected)[n]);
       s+='<button class="btn small ghost" '+(k==='mint'?'data-pkmk-nature="'+val+'"':'data-pkmk-ability="'+val+'" data-pkmk-kind="'+k+'"')+'>'+esc(name)+
         (k==='mint'?'<small>'+natureDesc(n)+'</small>':'')+'</button>';
      }
      s+='</div>';
    }
  }
  const tms=Object.keys(G.DB.save.tms||{}).filter(id=>G.Shop.tmCount(id)&&G.Moves.BY_ID[id]);
  if(!G.Shop.ORDER.some(k=>G.Shop.count(k))&&!tms.length)s+='<p class="sub center">'+L('Túi đồ đang trống.','Your Bag is empty.')+'</p>';
  if(tms.length)s+='<h3>TM</h3>';
  for(const id of tms) s+=row('📀',esc(title(id)),L('Trong túi: ','In bag: ')+G.Shop.tmCount(id),
   '<button class="btn small gold" data-pkmk-tm="'+esc(id)+'" '+(!G.Mons.canLearn(selected,id)?'disabled':'')+'>'+L('Dạy chiêu','Teach')+'</button>');
  return s;
 }
 function attachDex(dex,host){
  if(!G.DB.save?.owned?.[dex]||!host||!G.Mons)return;
  const previous=host.querySelector('#pkmk-dex-stats');
  if(previous)previous.remove(); // Always refresh selected Pokémon details and TM list.
  const n=G.Mons.natureOf(dex),a=G.Mons.abilityOf(dex);
  const pane=document.createElement('div');pane.id='pkmk-dex-stats';pane.className='pkmk-dex';
  const fx=G.AbilityFX.of(a.id,G.DEX_BY[dex]);
  const taught=G.Mons.taught(dex);
  pane.innerHTML='<h3>'+L('Tính cách, Đặc tính & TM','Nature, Ability & TMs')+'</h3>'+
   '<p><b>'+L('Tính cách','Nature')+':</b> '+esc(natName(n))+' <small>'+natureDesc(n)+'</small></p>'+
   '<p><b>'+L('Đặc tính','Ability')+':</b> '+esc(abilName(a.id))+(a.slot===2?' ★':'')+'</p>'+
   '<p class="sub">'+L('Hiệu ứng Đặc tính được áp dụng trong trận.','Your Ability takes effect in battle.')+'</p>'+
   '<p><b>'+L('TM đã học','Learned TMs')+':</b> '+(taught.length?taught.map(x=>esc(title(x))).join(', '):L('Chưa có','None'))+'</p>'+
   '<button class="btn small gold" id="pkmk-open-dex">'+L('Dùng vật phẩm / TM','Use Items / TMs')+'</button>';
  host.appendChild(pane);
  pane.querySelector('#pkmk-open-dex').onclick=()=>{selected=dex;open('bag');};
 }
 return {open,render,attachDex};
})();