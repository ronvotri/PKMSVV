# PKMSVV — PokéSurvivor PC Offline (v0.3.0)

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
