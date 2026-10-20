# PKMSVV — PokéSurvivor PC + Android Offline (v0.5.0)

**Unofficial, free, noncommercial fan build** of [PokéSurvivor](https://github.com/JPTER78/pokesurvivor) for Windows 10/11 x64.

This repository is a **reproducible desktop build/customization layer**, not an independent Pokémon game and **not** an official JPTER78 release. It pulls the original game source at an exact pinned commit, applies optional local gameplay tweaks, and packages all assets into one portable Windows `.exe` using Electron. The app does **not** open pokesurvivor.com or require network access while playing.

## Tải bản Windows

1. Mở tab **Actions** của repository này.
2. Chọn workflow **Build Windows Offline (noncommercial)** và nhấn **Run workflow** (hoặc mở run sau một lần push).
3. Khi job **Build Windows portable EXE** hoàn tất, tải artifact **PKMSVV-Windows-Offline-x64**.
4. Giải nén ZIP và chạy file `PKMSVV-*-Windows-x64.exe`. Đây là bản **portable**, không cần cài đặt hay kết nối internet.

> Đây là quy trình tạo bản thử nghiệm. Nếu workflow báo lỗi, xem logs trước khi sử dụng. Windows SmartScreen có thể cảnh báo vì file chưa được ký số. Chỉ chạy file từ repo mình tin cậy.

## Chức năng

- **PC offline:** đầy đủ client game và sprites nằm trong .exe, không dùng website live.
- **Local saves không cần đăng nhập:** tự mở hồ sơ cục bộ, nếu có phiên đăng nhập local đang lưu thì khôi phục trước; không chuyển sang guest. Tiến trình lưu bền qua `localStorage` trong dữ liệu Electron.
- **Điều khiển:** WASD/phím mũi tên, phím 1–4, Q/E, Esc/P; F11 để bật/tắt toàn màn hình.
- **RVT Balanced:** gameplay dựa trên bản gốc, tùy chỉnh được lượng quái, sức mạnh, Shiny, gacha và tiền khởi đầu bằng [config/gameplay.json](config/gameplay.json). Muốn giữ cân bằng tác giả, xem preset trong tài liệu.
- **Offline-only:** tắt Firebase, ẩn các mục bạn bè/ranking online và chặn truy cập mạng từ game client.
- **Ngôn ngữ:** mặc định tiếng Việt (có dấu); từ điển sinh từ 1.374 mục tiếng Anh của nguồn, ưu tiên dịch thủ công và quy tắc thay thế. **Chưa được QA hoàn chỉnh từng câu**, có thể còn câu pha tiếng Anh hoặc thuật ngữ cần chỉnh.

## Mã nguồn / Git gốc

- Official source: https://github.com/JPTER78/pokesurvivor
- Author: Jonathan Piera Torregrosa / JPTER78
- Source revision pinned by build: `11fe868c640b62ac37beacc222e056bc4d9ec892` (2026-10-20)
- Local source folder generated during build: `vendor/pokesurvivor/` (not checked into PKMSVV)
- This repository contains only the desktop wrapper, customizer and build workflow. The **complete upstream game is cloned** into the build workspace and included in the compiled artifact.

## Build trên Windows (Node.js 22+ và Git)

```powershell
git clone https://github.com/ronvotri/PKMSVV.git
cd PKMSVV
git init vendor/pokesurvivor
git -C vendor/pokesurvivor remote add origin https://github.com/JPTER78/pokesurvivor.git
git -C vendor/pokesurvivor fetch --depth 1 origin 11fe868c640b62ac37beacc222e056bc4d9ec892
git -C vendor/pokesurvivor checkout --detach FETCH_HEAD
npm install
npm run prepare:game
npm run prepare:icons
npm run test:balance
npm run build:win
```

Output: `dist/PKMSVV-*-Windows-x64.exe`. The prep script is designed to run **once per clean source checkout**. To rebuild after changing the config, restore the upstream working tree first (or re-clone into `vendor/pokesurvivor`). The GitHub workflow starts from fresh source every time. Avoid running a modified game source from untrusted origins.

## Giấy phép — bắt buộc đọc

**Không thương mại hóa** bản build: không bán game, thu phí tải, quảng cáo/kiếm tiền bằng nội dung game, hoặc lấy tài nguyên Pokémon dùng cho sản phẩm thương mại. Mã game mới tại upstream được cấp phép **PolyForm Noncommercial 1.0.0** từ 14/10/2026. Bản cũ tới commit `b297089` là MIT, nhưng **bản PKMSVV này sử dụng mã hiện tại theo PolyForm NC**. Sprite SpriteCollab là **CC BY-NC 4.0**, font Pixelify Sans theo **OFL 1.1**. Thương hiệu và hình Pokémon là của Nintendo, Creatures Inc., GAME FREAK/The Pokémon Company, không thuộc giấy phép của tác giả.

See [NOTICE.md](NOTICE.md), and bundled original `LICENSE`, `LICENSE-NONCOMMERCIAL.md` and `CREDITS.md`. All source copyright notices remain in the imported source; the executable is for personal, noncommercial use only. Third-party IP holders may still impose independent restrictions.

The workflow publishes a **temporary GitHub Actions artifact**, not a public GitHub Release or commercial distribution. Do not imply endorsement by JPTER78 or The Pokémon Company.

## Tiến hóa Pokémon trong trận — v0.2.0

- Bảng [455 nhánh tiến hóa Pokédex](data/evolution-rules.json), đi kèm [checklist toàn bộ Pokémon](docs/EVOLUTION_CHECKLIST.md) và [bảng CSV](docs/EVOLUTION_CHECKLIST.csv). Dữ liệu lấy từ PokeAPI, chỉ xét các loài hiện có trong PokéSurvivor; cần sprite đích mới có thể tiến hóa.
- **Lên cấp:** tiến hóa đúng mốc cấp của Pokédex (Charmander Lv16 → Charmeleon; Charmeleon Lv36 → Charizard). Giữ chiêu thức, cấp, HP theo tỷ lệ, các buff đang có; chỉ đổi dạng, chỉ số cơ bản, hệ và sprite.
- **Tiến hóa bằng vật phẩm/trao đổi:** thắng boss để nhận 1 **Mảnh Tiến Hóa** mỗi boss, tiêu một mảnh để kích hoạt đúng đá/vật phẩm hoặc Dây Liên Kết; không cần mạng.
- **Điều kiện đặc biệt:** tính thân thiết dựa trên cấp và thời gian sinh tồn; luân phiên ngày/đêm theo chu kỳ 4 phút trong trận; di chuyển, chịu sát thương, dùng chiêu, thời tiết, địa hình và thắng boss cho các yêu cầu được chuyển thể.
- **Nhiều nhánh:** menu hiện các dạng thỏa điều kiện để tự chọn; có nút hoãn đến lần lên cấp tiếp theo.
- **Ngoại lệ:** Meltan → Melmetal sau 4 boss; Gimmighoul → Gholdengo bằng cách tiêu 999 Pokécoins local; Bisharp → Kingambit sau 3 boss (đều là quy đổi từ điều kiện gốc).
- **Giới hạn:** không hỗ trợ phát sinh thêm Shedinja như đồng đội; không tạo các dạng regional/giới tính riêng khi Pokédex gốc không có sprite tương ứng; biến thể hình thái và nhiều điều kiện ngoại lệ được **quy đổi**, không cam kết giống tuyệt đối game chính thức. Chưa kiểm thử thủ công tất cả 455 nhánh.
- **Sưu tầm:** tiến hóa trong run không tự mở khóa Pokémon mới trong bộ sưu tập; vẫn cần gacha/thu thập như cũ. Trong game chỉ phát triển một Pokémon đang điều khiển; không phải đội 6 Pokémon.

Xem `src/pkmsvv-evolution.js` để sửa logic và `tests/evolution.test.cjs` để kiểm tra tự động.

## Hướng phát triển tiếp

- Việt hóa tiếng Việt đầy đủ và kiểm tra tràn chữ.
- Menu cấu hình gameplay ngay trong game, thay vì chỉnh JSON rồi build lại.
- Export/import saves an toàn và phục hồi sau cài lại Windows.
- Kiểm tra gamepad, fullscreen và tối ưu dung lượng.

## Khởi động không đăng nhập và Việt hóa

- Lần đầu mở game: tự tạo hồ sơ **Người chơi** trên máy, vào bài kiểm tra Pokémon ban đầu nếu chưa chọn starter. Các lần sau vào menu trực tiếp; không cần user/password/Guest. **Nếu máy đang có phiên lưu local từ bản trước, sẽ khôi phục phiên đó**. Các file save khác được giữ nguyên, không tự ý hợp nhất hoặc xóa.
- Từ điển tiếng Việt: [src/vi-translations.cjs](src/vi-translations.cjs), tích hợp với hệ thống i18n của game. Bản này ưu tiên giao diện, HUD, nhiệm vụ, vật phẩm và tên chiêu thức; nguồn có nhiều nội dung phát sinh theo ngữ cảnh nên vẫn cần báo lỗi màn hình để rà soát.
- Giữ nguyên hành vi ghi localStorage của game. Không đưa lại Firebase hay màn hình cloud/login; các mục online và đăng xuất được ẩn. Thử nghiệm xuất/nhập save là hạng mục riêng.

## PKMSVV v0.4.0 — kỹ năng tự động và nhạc tùy chỉnh

- Mỗi chiêu học được tự đánh cùng lúc theo **hồi chiêu riêng**. Không cần chuyển qua lại bằng 1–4, Q/E; những phím số vẫn dùng để chọn thẻ lên cấp.
- Bắt đầu tối đa **6 kỹ năng**; mỗi lần hạ boss huyền thoại trong khe nứt mở thêm **1 ô** (tối đa 8 ô) và rút ngắn **4% hồi chiêu**. Vì mọi chiêu đã tự đánh nên không còn cần ghép Liên Kết để kích hoạt nhiều chiêu.
- HUD hiển thị AUTO cho tất cả ô kỹ năng, kèm bộ đếm hồi chiêu. Tiến hóa Pokémon, tiến hóa chiêu thức và lưu offline vẫn hoạt động như phiên trước.
- Băng Lựa Chọn đổi thành **+25% sát thương, -15% tốc chạy** do hình phạt không được chuyển chiêu đã không còn ý nghĩa.
- Hỗ trợ thay nhạc theo [7 vị trí đã đặt tên](custom-music/README.md). Thêm bài MP3/OGG/WAV đã có quyền sử dụng vào repo rồi build lại. Nếu không thêm bài nào, vẫn phát nhạc gốc do máy tổng hợp; không có nhạc Pokémon chính thức được phân phối kèm.

## Android APK — v0.5.0 (thử nghiệm)

- Android 7.0+ (API 24), WebView/Chrome hiện đại; yêu cầu chơi màn hình ngang. Game và tài nguyên nằm trong APK, không cần truy cập website để chơi.
- Đóng gói bằng Capacitor 8; giữ các bản vá hiện tại: tự động đăng nhập offline, tiếng Việt, tiến hóa Pokémon và tự thi triển các kỹ năng.
- Mở GitHub Actions, chọn workflow Build Android APK Offline; tải artifact PKMSVV-Android-APK-debug sau khi hoàn tất Success; giải nén ZIP và cài APK.
- APK debug không dành cho Google Play; Android có thể cảnh báo vì cài ứng dụng ngoài cửa hàng.
- Save Android hoàn toàn riêng Windows. Khóa ký debug do máy build tạo có thể thay đổi mỗi lần; nếu phải gỡ app để cài lại thì dữ liệu trong máy có thể mất. Chưa có chức năng sao lưu save, nên đừng dùng bản thử nghiệm để lưu tiến trình quan trọng.
- APK sẽ mang đầy đủ nhạc custom-music đã được phép phân phối nếu có; phần chưa được thay sử dụng nhạc game gốc.
- Chưa thử trực tiếp trên máy Android; cần kiểm tra cảm ứng, font dấu, lưu game, nhạc và hiệu suất 6–8 chiêu đồng thời.

### Build APK tại máy

Yêu cầu Node.js 22, Java 21 và Android SDK 36. Sau khi đã clone đúng revision upstream như README Windows:

```bash
npm install
npm run prepare:game
npm run prepare:icons
npm run test:balance
npm run prepare:android
npx cap add android
npx cap sync android
node scripts/configure-android.cjs
node scripts/apply-android-icons.cjs
cd android
./gradlew assembleDebug
```

File đầu ra: android/app/build/outputs/apk/debug/app-debug.apk.

## V0.5.0 — Cân bằng 103 chiêu tự động, 6 buff và biểu tượng Survival

- Mọi **103 kỹ năng** được cân lại hồi chiêu theo **23 nhóm**. Không đổi tác dụng riêng của từng kỹ năng; khi học mới và lên cấp, vẫn hoạt động bình thường. Giảm hồi chiêu từ các thẻ nâng cấp có giới hạn an toàn tránh spam quá nhanh.
- **6 buff** (Swords Dance, Nasty Plot, Agility, Harden, Aqua Ring, Dragon Dance) không còn cộng dồn liên tục: cấp 1–4 tự bật và nghỉ theo chu kỳ 16 giây, với thời gian hiệu lực tăng theo cấp. Lên **cấp 5** buff duy trì vĩnh viễn, chỉ 1 tầng tác dụng, không tiếp tục tạo hoạt ảnh. Buff không chịu giảm hồi chiêu chung để giữ khoảng nghỉ ở cấp thấp.
- HUD kỹ năng hiển thị `ON 5s`, `OFF 4s` hoặc `MAX`; chiêu gây sát thương vẫn hiển thị `AUTO` và hồi chiêu.
- [Chi tiết hồi chiêu và buff cho từng chiêu](docs/SKILL_BALANCE.md) — đối chiếu 103 chiêu từ nguồn. Cân bằng là điểm khởi đầu, cần chơi thử để điều chỉnh thêm mật độ quái, DPS và FPS.
- Icon Windows EXE, favicon và launcher Android dùng **Poké Ball với chữ Survival**. Nguồn icon có thể xem ở [assets/icon-survival.svg](assets/icon-survival.svg); icon được render trong CI từ nguồn vector này.

## v0.6.0 — QA sau bản chơi thử

- Khôi phục **hai ngôn ngữ Tiếng Việt (mặc định) và English** trong phần Cài đặt. Khi đổi ngôn ngữ sẽ lưu lựa chọn qua lần chạy sau.
- **Tên của 103 chiêu thức và 97 tên chiêu sau tiến hóa trở lại tiếng Anh**, tham chiếu theo tên tiếng Anh chính thức và bảng phân biệt tên Anh/Việt của cộng đồng. Phần mô tả, nâng cấp và nhiệm vụ vẫn bằng tiếng Việt.
- Mục **Có gì mới?** được đặt về danh sách trống để chờ nhật ký cập nhật PKMSVV do bạn biên soạn, không còn bản tin tác giả game gốc. Khi cần thêm bản tin, cập nhật `js/data/changelog.js` trong nguồn patch thay vì tin bản gốc.
- Không còn hướng dẫn đổi chiêu 1–4/Q/E hoặc LB/RB. Các chiêu bình thường vẫn tự dùng khi hồi chiêu xong.
- **4 chiêu lao vào mục tiêu** (nhóm `dash`): chỉ kích hoạt thủ công bằng **F trên PC / X trên tay cầm / nút kỹ năng ở cạnh phải màn hình cảm ứng**. Nếu học nhiều hơn một chiêu lao tới, mỗi lần bấm sẽ kích hoạt một chiêu sẵn sàng theo vòng luân phiên. Không thể kích hoạt khi đang hồi chiêu hoặc game tạm dừng.
- Màn hình **tiến hóa Pokémon** được đưa vào hệ thống chọn bằng tay cầm. D-pad/analog chọn, **A** xác nhận, **B** giữ nguyên dạng hiện tại.
- Bản vá này là bản kiểm thử mới. Cần xác nhận trực tiếp với các tay cầm Xbox, PlayStation hoặc Switch vì ánh xạ nút thực tế có thể khác trên từng thiết bị.
