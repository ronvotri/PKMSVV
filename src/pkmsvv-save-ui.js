/* PKMSVV: explicit offline JSON backup + restore for PC, Android and Switch.
 * A backup is outside private app storage only after the user SAVES / SHARES it.
 * No automatic cloud sync, no remote account, no hidden network upload.
 */
G.PKMSVVSaveUI=(()=>{
 const MAX_BYTES=10*1024*1024;
 const getKey=()=>{try{const k=JSON.parse(localStorage.getItem('ps.session'));return typeof k==='string'&&/^[a-z0-9_ñáéíóú-]{2,48}$/i.test(k)?k:null;}catch{return null;}};
 const backup=()=>{
   if(!G.DB.save||G.DB.guest)throw Error('Không có hồ sơ lưu offline đang hoạt động.');
   if(!G.DB.commit(true))throw Error('Không thể lưu tiến trình hiện tại.');
   const saved=JSON.parse(JSON.stringify(G.DB.save));
   return JSON.stringify({format:'PKMSVV_SAVE',version:1,createdAt:new Date().toISOString(),source:'Votri Valley',save:saved},null,2);
 };
 async function shareAndroid(text,filename){
   const C=window.Capacitor;
   const fs=C&&C.Plugins&&C.Plugins.Filesystem,share=C&&C.Plugins&&C.Plugins.Share;
   if(!fs||!share)return false;
   await fs.writeFile({path:filename,data:text,encoding:'utf8',directory:'CACHE'});
   const r=await fs.getUri({path:filename,directory:'CACHE'});
   await share.share({title:'Pokémon Survivor — Save Backup',url:r.uri,dialogTitle:'Lưu bản sao ở Downloads, Google Drive hoặc gửi sang thiết bị khác'});
   return true;
 }
 function download(text,filename){
   const blob=new Blob([text],{type:'application/json;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),120000);
 }
 function validate(text){
   if(typeof text!=='string'||text.length>MAX_BYTES)throw Error('File save quá lớn hoặc không hợp lệ (tối đa 10 MB).');
   const b=JSON.parse(text),s=b&&b.save;
   if(!b||b.format!=='PKMSVV_SAVE'||b.version!==1||!s||typeof s!=='object'||Array.isArray(s))throw Error('Đây không phải file sao lưu Pokémon Survivor.');
   if(!s.owned||typeof s.owned!=='object'||!s.stats||typeof s.stats!=='object'||!s.pupg||typeof s.pupg!=='object'||!Number.isFinite(+s.coins))throw Error('File save thiếu dữ liệu hoặc bị hỏng.');
   // Keep only JSON data. No eval, HTML injection, external URL, or code import.
   return JSON.parse(JSON.stringify(s));
 }
 function restore(s){
   const key=getKey();
   if(!key||!G.DB.save||G.DB.guest)throw Error('Hãy mở hồ sơ chơi offline trước khi nhập save.');
   const path='ps.save.'+key,old=localStorage.getItem(path);
   const accounts=localStorage.getItem('ps.accounts');
   if(!accounts)throw Error('Không tìm thấy hồ sơ lưu trên máy này.');
   if(old)localStorage.setItem('pkmsvv.preimport.'+key,old);
   localStorage.setItem(path,JSON.stringify(s));
   // The current session stays with this device, so restoring never needs
   // account passwords or leaking hashes in the backup.
   location.reload();
 }
 function mount(box,prefix='pkmsvv-save'){
   if(!box||box.querySelector('.pkm-backup'))return;
   const wrap=document.createElement('div');wrap.className='pkm-backup';
   wrap.innerHTML='<h3>💾 DỮ LIỆU TRÒ CHƠI</h3>'+
     '<p>Gỡ ứng dụng Android sẽ xóa save trong bộ nhớ ứng dụng. Hãy <b>xuất file</b> và lưu ngoài app trước khi gỡ/cập nhật.</p>'+
     '<div class="row wrap" style="gap:8px"><button class="btn gold" id="'+prefix+'-export">Sao lưu Save (.json)</button>'+
     '<button class="btn" id="'+prefix+'-import">Khôi phục Save</button></div>'+
     '<input id="'+prefix+'-file" type="file" accept=".json,application/json" style="display:none">'+
     '<p class="note" id="'+prefix+'-msg">File sao lưu gồm Pokémon, Shiny, PokéCoins, nâng cấp, nhiệm vụ và Dấu Ấn. Chỉ lưu vào nơi bạn tin cậy.</p>';
   box.appendChild(wrap);
   const msg=wrap.querySelector('#'+prefix+'-msg'),file=wrap.querySelector('#'+prefix+'-file');
   wrap.querySelector('#'+prefix+'-export').onclick=async()=>{
     try{
       const data=backup(),filename='PokemonSurvivor-Save-'+new Date().toISOString().slice(0,10)+'.json';
       if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()){
         if(await shareAndroid(data,filename)){msg.textContent='Đã mở trình chia sẻ. Hãy chọn Drive, Downloads hoặc nơi lưu BÊN NGOÀI ứng dụng.';return;}
       }
       download(data,filename);
       msg.textContent='Đã yêu cầu tải file save. Hãy kiểm tra Downloads; đảm bảo file nằm ngoài thư mục của game.';
     }catch(e){msg.textContent='Không thể sao lưu: '+e.message;}
   };
   wrap.querySelector('#'+prefix+'-import').onclick=()=>file.click();
   file.onchange=async()=>{
     try{
       if(!file.files||!file.files[0])return;
       const f=file.files[0];
       if(f.size>MAX_BYTES)throw Error('File quá lớn (tối đa 10 MB).');
       const save=validate(await f.text());
       if(!confirm('Khôi phục save sẽ THAY THẾ tiến trình đang chơi trên thiết bị này. Bạn đã sao lưu bản hiện tại chưa?'))return;
       restore(save);
     }catch(e){msg.textContent='Không thể khôi phục: '+e.message;}
     finally{file.value='';}
   };
 }
 let quick=null;
 function isOpen(){return !!quick && quick.isConnected;}
 function closeQuick(){ if(!quick)return;quick.remove();quick=null; }
 function openQuick(){
   if(isOpen()){closeQuick();return;}
   if(!G.DB.save||G.DB.guest){G.UI.toast('Hãy mở hồ sơ chơi đã lưu trước khi sao lưu.');return;}
   const modal=document.createElement('section');
   modal.id='scr-pkmsvv-save-quick';
   modal.className='scr dim pkmsvv-quick';
   modal.innerHTML='<div class="box pkmsvv-quick-box">'+
     '<div class="row between"><h2>💾 SAO LƯU & KHÔI PHỤC</h2>'+
     '<button class="btn small ghost" id="pkmsvv-quick-close" type="button">✕ Đóng</button></div>'+
     '<div class="pkmsvv-quick-content"></div></div>';
   document.body.appendChild(modal);quick=modal;
   modal.querySelector('#pkmsvv-quick-close').onclick=closeQuick;
   modal.onclick=e=>{if(e.target===modal)closeQuick();};
   mount(modal.querySelector('.pkmsvv-quick-content'),'pkmsvv-quick');
   if(G.Pad&&G.Pad.focusFirst)G.Pad.focusFirst();
 }
 function initQuick(){
   const button=document.getElementById('btn-backup');if(!button)return;
   button.innerHTML=G.Icons.html('save',20);
   button.title='Sao lưu / Khôi phục Save';
   button.setAttribute('aria-label','Sao lưu hoặc khôi phục Save');
   button.onclick=openQuick;
 }
 return {mount,backup,validate,restore,initQuick,openQuick,closeQuick,isOpen};
})();