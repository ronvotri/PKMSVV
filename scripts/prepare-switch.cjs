'use strict';
// EXPERIMENTAL Brewser app for Atmosphere Switch/Switch Lite.
// It is a local SD web bundle, not an independently built NRO/NSP.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const source=path.join(root,'mobile','www');
const dest=path.join(root,'dist','switch-package');
const id='com.votrivalley.pkmsvv';
const dir=path.join(dest,'switch','brewser','apps',id);
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
if(!fs.existsSync(path.join(source,'index.html')))throw Error('Run npm run prepare:android first');
if(!fs.existsSync(path.join(source,'assets','icons','icon-512.png')))throw Error('Run npm run prepare:icons first');
fs.rmSync(dest,{recursive:true,force:true});
fs.mkdirSync(dir,{recursive:true});
fs.cpSync(source,dir,{recursive:true});
const boot=[
 '(function(){',
 '  try {',
 '    const key="ps.settings";',
 '    if (!localStorage.getItem(key)) localStorage.setItem(key,',
 '      JSON.stringify({quality:"low",dmgNumbers:false,calm:true,gamepad:true,padRumble:false}));',
 '  } catch (_) {}',
 '  document.documentElement.setAttribute("data-pkmsvv-switch","");',
 '})();',
 ''
].join('\n');
fs.writeFileSync(path.join(dir,'pkmsvv-switch-boot.js'),boot);
const p=path.join(dir,'index.html');
let html=fs.readFileSync(p,'utf8');
if(!/<\/head>/i.test(html))throw Error('Game HTML has no head');
html=html.replace(/<\/head>/i,
  '<meta name="pkmsvv-platform" content="brewser-switch-homebrew">\n'+
  '<script src="pkmsvv-switch-boot.js"></script>\n</head>');
fs.writeFileSync(p,html,'utf8');
const manifest={
 id,name:'PKMSVV Pokémon Sinh Tồn',version,
 description:'<p>PokéSurvivor fan translation & noncommercial gameplay modifications by Votri Valley; source game by JPTER78.</p>',
 summary:'PKMSVV Switch Lite — phiên bản homebrew offline',
 logo:'assets/icons/icon-512.png',entry:'index.html',
 categories:['Games'],permissions:['storage'],compatibility:['switch'],allowed_origins:[],
 developer:'Votri Valley',license:'LicenseRef-PolyForm-Noncommercial-1.0.0',
 tags:['Survival','Offline','Fan Translation'],exitGame:'MINUS',fullscreen:true,
 hideMouseDocked:false,hideMouseUndocked:false,publishedAt:'2026-10-21T00:00:00Z'
};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const guide=[
 'PKMSVV '+version+' — THỬ NGHIỆM TRÊN SWITCH / SWITCH LITE (ATMOSPHERE)',
 '',
 'Đây là GÓI GAME HTML5 cho ứng dụng homebrew Brewser. KHÔNG PHẢI NSP',
 'hay NRO độc lập. Đã đóng gói tài nguyên offline, không tải từ website.',
 '',
 '1. Tải Brewser tại: https://github.com/natureglass/Brewser/releases',
 '2. Chép brewser.nro vào: sd:/switch/brewser.nro',
 '3. Khởi động Brewser từ Homebrew Menu một lần, sau đó thoát.',
 '4. Giải nén ZIP này vào gốc thẻ nhớ, để gộp chung thư mục switch/.',
 '   KHÔNG xóa những thư mục Brewser cũ hoặc save đã có.',
 '5. Chạy Brewser, dùng thanh địa chỉ mở URL nội bộ:',
 '   brewser://apps/com.votrivalley.pkmsvv/index.html',
 '',
 'ĐIỀU KHIỂN DỰ KIẾN',
 'Analog trái/D-pad : Di chuyển / menu',
 'A : Xác nhận',
 'B : Quay lại',
 'X : Chiêu lao tới (khi có chiêu chủ động)',
 'Y : Đổi thẻ khi lên cấp',
 '+ : Tạm dừng',
 '- : Thoát ứng dụng (theo manifest)',
 'Cảm ứng : Menu và nút chiêu chủ động',
 '',
 'TÙY CHỈNH: lần đầu tự chọn đồ họa Thấp để thử. Game dùng',
 'localStorage trên thẻ SD; không tự đồng bộ save với PC hoặc APK.',
 'Nên mở hbmenu ở chế độ đầy đủ RAM (giữ R khi vào một game).',
 'Brewser chưa hỗ trợ đầy đủ mọi hiệu ứng Web Audio; nhạc có thể lỗi.',
 'Chưa chơi thử trên Switch thật: cần QA âm thanh, save, hình và FPS.',
 '',
 'Tác giả game gốc: https://github.com/JPTER78/pokesurvivor',
 'Việt hóa và Mod điều chỉnh bởi Votri Valley.',
 'Giữ ghi công và PolyForm Noncommercial; không thương mại.',
 ''
].join('\r\n');
fs.writeFileSync(path.join(dest,'HUONG_DAN_SWITCH.txt'),guide);
console.log('PKMSVV Switch Brewser local SD game ready:',dir);
