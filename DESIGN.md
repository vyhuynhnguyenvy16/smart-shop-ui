# Northline — Bộ quy tắc thiết kế (DESIGN.md)

> **Nguồn sự thật duy nhất cho mọi giao diện của Northline.** Mọi thay đổi UI (người hay AI) phải theo file này.
> Giá trị nào không có ở đây thì **không được tự đặt ra** — thêm token vào đây trước, rồi mới dùng.
> Token được cài trong `src/styles.css` (khối `:root` + `@theme inline`). Dùng tên token/utility, không viết mã màu,
> cỡ chữ hay thời lượng chuyển động trực tiếp trong component.

Phiên bản 2.0 · 20/11/2026 · Hướng: **Trắng ấm + xanh rêu, một phông Be Vietnam Pro** (chủ shop chọn).

---

## 0. Năm nguyên tắc (đọc trước khi làm gì)

1. **Ảnh sản phẩm là nhân vật chính.** Giao diện trung tính, dịu, để quần áo nổi bật. Màu nhấn chỉ dùng cho hành động chính và trạng thái.
2. **Đơn giản nhưng ấm áp.** Bo góc mềm, khoảng trắng rộng, chữ tiếng Việt rõ ràng; không trang trí thừa (gradient, bóng đổ dưới mọi thẻ, nhãn VIẾT HOA).
3. **Mỗi chuyển động phải có lý do** — phản hồi thao tác, cho biết thứ gì vừa thay đổi. Ngắn (100–300 ms), không lặp, tắt khi người dùng bật "giảm chuyển động".
4. **Trung thực.** Không đánh giá, số liệu, nhãn "bán chạy" hay giảm giá bịa. Chỉ hiển thị bộ lọc/sắp xếp mà dữ liệu API thật sự có.
5. **Ai cũng dùng được.** WCAG 2.2 AA là mức tối thiểu: tương phản, vùng chạm, focus, bàn phím.

---

## 1. Màu sắc

### 1.1 Cách xây (theo Refactoring UI + Material 3)
- Một **thang màu cố định** cho mỗi họ màu, định nghĩa trước; không pha màu mới theo cảm tính.
- Xám được **ngả nhẹ về xanh rêu** (cùng tông với màu chính) để giao diện không bị "chết".
- Màu dùng theo **vai trò** (role), không theo tên màu: `primary`/`on-primary`, `surface`/`on-surface`… Luôn đặt chữ `on-X` lên nền `X`.
- Tỷ lệ diện tích tham khảo: ~70% nền trung tính · ~25% chữ/ảnh · ≤5% màu nhấn (nút chính, link, trạng thái).

### 1.2 Thang màu gốc (primitive)

| Token | Hex | Ghi chú |
|---|---|---|
| `moss-50` | `#EEF4F1` | nền nhạt cho thông báo/selected |
| `moss-100` | `#DCE8E2` | chip đã chọn (nền) |
| `moss-200` | `#B9D1C5` | viền nhấn nhẹ |
| `moss-300` | `#8FB4A3` | |
| `moss-400` | `#5E8E7B` | |
| `moss-500` | `#3F7462` | |
| `moss-600` | `#2F5D50` | **màu chính** |
| `moss-700` | `#264C42` | hover của nút chính |
| `moss-800` | `#1E3C34` | pressed |
| `moss-900` | `#152B25` | |
| `stone-0` | `#FFFFFF` | thẻ nổi, ô nhập |
| `stone-50` | `#FAFAF7` | **nền trang** |
| `stone-100` | `#F1EEE7` | mặt phụ (sand): khối nổi bật, skeleton |
| `stone-200` | `#E4E0D8` | đường chia trang trí |
| `stone-400` | `#7C847F` | **viền ô nhập/checkbox** (≥3:1 với nền) |
| `stone-600` | `#5C6660` | chữ phụ |
| `stone-700` | `#3D4540` | chữ phụ đậm |
| `stone-900` | `#1F2421` | **chữ chính** (không dùng #000) |
| `red-600` | `#B42318` | giảm giá, lỗi, xóa |
| `green-600` | `#1F7A4D` | thành công, còn hàng |
| `amber-700` | `#9A5B00` | sắp hết hàng, cảnh báo |
| `blue-600` | `#2557A7` | thông tin trung tính (hiếm dùng) |

### 1.3 Vai trò (semantic) — chỉ dùng các tên này trong component

| Vai trò | Giá trị | Dùng cho |
|---|---|---|
| `background` | stone-50 | nền trang |
| `foreground` | stone-900 | chữ chính, icon |
| `card` / `popover` | stone-0 | thẻ nổi, menu, dialog, ô nhập |
| `muted` | stone-100 | khối nền phụ, skeleton, ảnh chờ tải |
| `muted-foreground` | stone-600 | chữ phụ, meta, placeholder |
| `border` | stone-200 | đường chia, khung trang trí |
| `input` | stone-400 | viền ô nhập, checkbox, radio (yêu cầu 3:1) |
| `primary` / `primary-foreground` | moss-600 / trắng | nút chính, link chính, trạng thái chọn |
| `primary-hover` / `primary-active` | moss-700 / moss-800 | hover / nhấn nút chính |
| `accent` / `accent-foreground` | moss-50 / moss-700 | nền chọn nhẹ, chip đã chọn, hàng được chọn |
| `secondary` | stone-100 / stone-900 | nút phụ dạng nền |
| `destructive` | red-600 | lỗi, xóa |
| `sale` | red-600 | giá giảm, nhãn "Giảm giá" — **chỉ** khi có giá gốc thật |
| `success` / `warning` | green-600 / amber-700 | còn hàng / sắp hết |
| `ring` | moss-600 | viền focus |

### 1.4 Tương phản đã kiểm tra (WCAG 2.2: chữ thường ≥4.5:1, chữ lớn/thành phần UI ≥3:1)

| Cặp | Tỷ lệ |
|---|---|
| foreground / background | 15.1:1 |
| muted-foreground / background | 5.7:1 |
| muted-foreground / muted | 5.1:1 |
| trắng / primary | 7.5:1 |
| primary / background (link) | 7.2:1 |
| sale / background | 6.3:1 |
| success / background | 5.1:1 |
| warning / background | 5.2:1 |
| input (viền) / background | 3.7:1 |

**Quy tắc:** thêm cặp màu mới → chạy lại kiểm tra; dưới ngưỡng thì không dùng. Không bao giờ truyền tải thông tin **chỉ bằng màu** (kèm chữ hoặc icon: "Hết hàng", gạch ngang size hết).

### 1.5 Cấm
- Gradient trang trí, màu neon, nhiều hơn 1 màu nhấn trên cùng một khu vực.
- Dùng `primary` cho tiêu đề hay icon trang trí (màu nhấn chỉ cho thứ bấm được/trạng thái).
- Dùng đỏ cho thứ không phải giảm giá/lỗi.

---

## 2. Chữ (Typography)

### 2.1 Phông
- **Be Vietnam Pro** cho toàn bộ giao diện — neo-grotesk do Lâm Bảo, Tony Le, ViệtAnh Nguyễn thiết kế, tinh chỉnh riêng cho dấu tiếng Việt. Giấy phép SIL OFL.
- Tự host (`public/fonts/be-vietnam-pro-*.woff2`), 4 độ đậm: **400** (thân), **500** (nhãn, tên sản phẩm), **600** (tiêu đề, giá, nút), **700** (chỉ hero). Subset latin + latin-ext + vietnamese, `font-display: swap`.
- Preload 2 file trên màn đầu: latin-400 và latin-600.
- Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Không dùng độ đậm 100–300 (mảnh, khó đọc dấu ở cỡ nhỏ — Apple HIG khuyên tăng cỡ nếu dùng nét mảnh).

### 2.2 Thang chữ (theo vai trò Material 3; px, dòng = line-height)

| Token | Desktop (≥768px) | Mobile | Đậm | Tracking | Dùng cho |
|---|---|---|---|---|---|
| `display` | 48/56 | 36/44 | 700 | -0.02em | tiêu đề hero (1 chỗ/trang) |
| `h1` | 36/44 | 28/36 | 600 | -0.015em | tiêu đề trang (H1) |
| `h2` | 24/32 | 22/30 | 600 | -0.01em | tiêu đề khu vực |
| `h3` | 20/28 | 18/26 | 600 | 0 | tiêu đề khối nhỏ, dialog |
| `title` | 16/24 | 16/24 | 600 | 0 | tiêu đề trong thẻ, nhóm bộ lọc |
| `body-lg` | 16/26 | 16/26 | 400 | 0 | **thân bài, mô tả sản phẩm** |
| `body` | 15/24 | 15/24 | 400 | 0 | chữ giao diện chung |
| `body-sm` | 14/20 | 14/20 | 400 | 0 | chữ phụ, meta, breadcrumb |
| `label` | 15/20 | 15/20 | 600 | 0 | nút, tab |
| `label-sm` | 13/16 | 13/16 | 500 | 0.01em | badge, nhãn ảnh |
| `caption` | 12/16 | 12/16 | 400 | 0.01em | chú thích (tối thiểu tuyệt đối) |
| `price` | 16/24 | 16/24 | 600 | 0 | giá trên thẻ (tabular) |
| `price-lg` | 28/36 | 24/32 | 600 | -0.01em | giá trang chi tiết |

### 2.3 Quy tắc
- **Thân bài 16px** (Material: body large 16; Apple: mặc định 17pt). Ô nhập luôn **≥16px** (tránh iOS tự phóng to).
- **Cỡ nhỏ nhất 12px**, và chỉ cho caption — không dùng cho thông tin quan trọng (giá, tồn kho, lỗi).
- Độ dài dòng **45–75 ký tự** (`measure` = 68ch); line-height thân bài 1.5–1.65 (dấu tiếng Việt cần thêm khoảng dòng so với tiếng Anh).
- Số tiền/số lượng dùng **tabular-nums** (`tabular`); định dạng `vi-VN`: `1.290.000 ₫`.
- **Sentence case** ("Thêm vào giỏ hàng"), không VIẾT HOA cả cụm, không tô màu một từ trong tiêu đề.
- Tối đa 3 cấp chữ trong một thẻ (tên · giá · phụ).

---

## 3. Khoảng cách, lưới, bo góc, độ nổi

### 3.1 Khoảng cách — lưới 4px (Material, Polaris)
`space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16` 64 · `space-24` 96.
Chỉ dùng các giá trị này (Tailwind: `1,2,3,4,5,6,8,10,12,16,24`).

| Vị trí | Giá trị |
|---|---|
| Lề ngang container | 16 (mobile) · 24 (tablet) · 40 (desktop) |
| Container tối đa | 1280px |
| Khoảng giữa các section | 48 (mobile) · 80 (desktop) |
| Tiêu đề section → nội dung | 24 |
| Lưới sản phẩm: cột / hàng | 12 / 32 (mobile) · 24 / 48 (desktop) |
| Ảnh → tên sản phẩm | 12 |
| Tên → giá | 4 |
| Nhóm bộ lọc ↔ nhóm | 32 |
| Nhãn → ô nhập | 6 · ô nhập → lỗi: 6 · giữa các ô: 20 |

### 3.2 Lưới trang
- Breakpoint: `sm 640` · `md 768` · `lg 1024` · `xl 1280`.
- Lưới sản phẩm: **2 cột** mobile · **3 cột** md–lg · **4 cột** xl (trang chủ) / 3 cột khi có sidebar lọc.
- Sidebar bộ lọc 240px từ `lg`; dưới `lg` dùng drawer.

### 3.3 Bo góc — mềm, thân thiện, có thứ bậc

| Token | Giá trị | Dùng cho |
|---|---|---|
| `radius-sm` | 6px | badge, tag nhỏ, checkbox |
| `radius-md` | 10px | **nút, ô nhập, chip, select** |
| `radius-lg` | 14px | thẻ, ảnh sản phẩm, khối nội dung |
| `radius-xl` | 20px | dialog, drawer, bottom sheet, banner lớn |
| `radius-full` | 999px | badge số giỏ hàng, avatar |

Không dùng một bán kính cho mọi thứ — thành phần lớn bo nhiều hơn thành phần nhỏ.

### 3.4 Độ nổi (bóng) — chỉ cho thứ nằm **trên** trang
| Token | Giá trị | Dùng cho |
|---|---|---|
| `shadow-0` | none | thẻ ở trạng thái nghỉ (dùng nền/khoảng trắng để tách) |
| `shadow-1` | `0 1px 2px rgb(31 36 33 / .06), 0 2px 8px rgb(31 36 33 / .06)` | thẻ khi hover, sticky bar |
| `shadow-2` | `0 4px 12px rgb(31 36 33 / .08), 0 12px 32px rgb(31 36 33 / .10)` | menu, gợi ý tìm kiếm, popover |
| `shadow-3` | `0 12px 40px rgb(31 36 33 / .18)` | dialog, drawer |

Không đặt cùng một bóng dưới mọi thẻ (dấu hiệu "template AI").

---

## 4. Chuyển động (Motion)

### 4.1 Thời lượng — tổng hợp NN/g, Material 3, IBM Carbon, Polaris, Fluent
NN/g: phần lớn animation nên nằm trong **100–500 ms**; phản hồi đơn giản (checkbox, toggle) **~100 ms**. Carbon và Material đặt chuyển động thành phần trong dải 100–300 ms.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--dur-instant` | 100ms | nhấn nút, checkbox, toggle, đổi màu icon |
| `--dur-fast` | 150ms | hover màu/viền, focus ring, tooltip |
| `--dur-base` | 200ms | chip, dropdown, gợi ý tìm kiếm, hover ảnh |
| `--dur-moderate` | 300ms | drawer, dialog, bottom sheet (vào) |
| `--dur-slow` | 450ms | hero xuất hiện lần đầu (duy nhất) |

Thoát (exit) **ngắn hơn vào ~25%** (vd. dialog vào 300 / ra 200). Desktop ưu tiên đầu dưới của dải.

### 4.2 Đường cong (easing)
| Token | Giá trị | Nguồn | Dùng cho |
|---|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Material 3 standard | thay đổi tại chỗ (màu, kích thước) |
| `--ease-enter` | `cubic-bezier(0, 0, 0.38, 0.9)` | Carbon entrance productive | phần tử xuất hiện |
| `--ease-exit` | `cubic-bezier(0.2, 0, 1, 0.9)` | Carbon exit productive | phần tử biến mất |
| `--ease-expressive` | `cubic-bezier(0.4, 0.14, 0.3, 1)` | Carbon standard expressive | hero, khoảnh khắc quan trọng |

Không dùng `linear` (trừ spinner) và không dùng bounce/overshoot cho thương mại điện tử.

### 4.3 Công thức tương tác (bắt buộc dùng đúng)

| Tương tác | Thuộc tính | Thời lượng · easing |
|---|---|---|
| Hover nút | màu nền | fast · standard |
| Nhấn nút | `scale(0.98)` | instant · standard |
| Hover thẻ sản phẩm | ảnh `scale(1.04)` trong khung bo góc; ảnh thứ 2 (nếu có) fade vào | base · standard |
| Chip/size chọn | nền + viền + chữ | fast · standard |
| Gợi ý tìm kiếm, dropdown | opacity 0→1 + `translateY(-4px→0)` | base · enter (ra: fast · exit) |
| Drawer bộ lọc / menu mobile | `translateX(-100%→0)` + scrim fade | moderate · enter (ra: base · exit) |
| Dialog / quick view | opacity + `scale(0.97→1)` | moderate · enter |
| Toast | `translateY(8px→0)` + fade | base · enter |
| Thêm vào giỏ thành công | badge giỏ hàng `scale(1→1.2→1)` + toast | 300ms · expressive |
| Skeleton | opacity 1↔0.55, 1.4s, lặp khi đang tải | — |
| Hero lần đầu | opacity + `translateY(12px→0)` cho khối chữ | slow · expressive, 1 lần |

Chỉ animate `transform` và `opacity` (mượt 60fps). Không fade-in từng section khi cuộn. Không tự chạy animation > 5 giây.

### 4.4 Giảm chuyển động
`@media (prefers-reduced-motion: reduce)` → mọi duration ≈ 0, bỏ transform, giữ đổi màu. (Đã cài toàn cục trong `styles.css`.)

---

## 5. Thành phần (Components)

### 5.1 Nút
| Size | Cao | Padding ngang | Chữ | Dùng cho |
|---|---|---|---|---|
| `sm` | 36 (chỉ desktop) | 14 | label-sm 14/600 | thao tác phụ trong bảng/thanh công cụ |
| `md` | **44** | 20 | label 15/600 | mặc định |
| `lg` | 52 | 28 | label 16/600 | CTA chính trang chi tiết, giỏ, thanh toán |

| Biến thể | Nghỉ | Hover | Nhấn | Ghi chú |
|---|---|---|---|---|
| `primary` | nền primary, chữ trắng | primary-hover | primary-active + scale .98 | **1 nút primary mỗi khu vực** |
| `secondary` | viền 1.5px foreground, nền trong | nền stone-100 | scale .98 | hành động thứ hai |
| `tertiary` | chữ foreground, gạch chân khi hover | gạch chân | — | link dạng nút |
| `destructive` | chữ/viền red-600 | nền red-50 | — | xóa |

- Bo `radius-md`. Icon 20px, cách chữ 8px.
- **Disabled:** opacity 0.4, `cursor: not-allowed`, không hover.
- **Loading:** giữ nguyên chiều rộng, thay chữ bằng "Đang …" + spinner 16px; chặn bấm lặp.
- Nhãn nút = động từ + kết quả ("Thêm vào giỏ hàng", "Đặt hàng"), giữ nhất quán với thông báo sau đó ("Đã thêm vào giỏ").

### 5.2 Ô nhập, select, checkbox, radio
- Cao **48**, padding 14, chữ **16px**, nền card, viền 1px `input`, bo `radius-md`.
- Focus: viền primary + ring 3px primary 20% (không chỉ đổi màu viền).
- Lỗi: viền destructive + dòng lỗi 14px màu destructive ngay dưới, nói **cách sửa** ("Số điện thoại chưa đúng — ví dụ 0901234567").
- Nhãn luôn hiển thị phía trên (không dùng placeholder thay nhãn). Bắt buộc đánh dấu `*` + chú thích.
- Checkbox/radio 20px, vùng bấm cả dòng ≥44px.
- `autocomplete`, `inputMode` đúng loại (tel, email…).

### 5.3 Chip lựa chọn (size, màu, bộ lọc)
- Cao 44, padding 14, bo `radius-md`, viền 1px border.
- Chọn: nền `accent` (moss-50), viền primary 1.5px, chữ moss-700 600. Hết hàng: chữ muted + gạch ngang + `aria-disabled`, vẫn đọc được.
- Chip "bộ lọc đang áp dụng": cao 36, nền stone-100, bo full, icon ✕ 14px, có nút "Xóa tất cả".

### 5.4 Thẻ sản phẩm
- Ảnh **3:4**, `object-fit: cover`, bo `radius-lg`, nền muted khi chờ tải; cùng tỷ lệ trên toàn lưới.
- Thứ tự: ảnh → tên (15/22, 500, tối đa 2 dòng) → giá (price) → phụ (số màu / sắp hết, body-sm muted).
- Nhãn trên ảnh (góc trên trái, cách 10px): label-sm, bo `radius-sm`; "Giảm giá" = nền sale chữ trắng; "Hết hàng" = nền card chữ foreground.
- Nút yêu thích: 40×40 (vùng chạm 44), nền card 90% bo full, góc trên phải.
- Hover (desktop): ảnh zoom 1.04; nút "Thêm nhanh"/"Chọn size" trượt lên ở đáy ảnh. Mobile không có hover → toàn thẻ bấm vào trang chi tiết.
- Giá giảm: giá mới màu sale + giá gốc gạch ngang muted (chỉ khi có giá gốc thật).

### 5.5 Header & điều hướng
- Thanh thông báo: cao 36, nền moss-700, chữ trắng 13px — **1 câu**, chính sách thật.
- Header: cao 64 (mobile) / 72 (desktop), nền background 95% + blur, đường chia dưới; sticky.
- Logo chữ "Northline" 22px/700. Danh mục từ `lg`; dưới `lg` → nút menu 44×44.
- Danh mục đang chọn: chữ foreground + gạch dưới 2px primary; thường: muted, hover foreground.
- Giỏ hàng: icon 22px + badge số (bo full, nền primary, chữ trắng 11px/600, tối thiểu 18px).
- Tìm kiếm: ô 44 cao, bo full, nền card, icon trái; gợi ý sau 250ms, tối đa 5, đóng bằng Esc / bấm ra ngoài.
- Mobile: bottom nav 4 mục (Trang chủ, Sản phẩm, Giỏ hàng, Tài khoản), cao 64 + safe-area.

### 5.6 Dialog, drawer, toast
- Dialog: bo `radius-xl`, padding 24, shadow-3, scrim stone-900 40%; Esc đóng, focus vào trong, trả focus khi đóng, khóa cuộn nền.
- Drawer bộ lọc: rộng 360 (tối đa 90vw), nút "Xem N sản phẩm" cố định ở đáy.
- Toast: trên giữa, 4 giây, có nút đóng; thành công kèm hành động ("Xem giỏ hàng").

### 5.7 Trạng thái trang
- **Đang tải:** skeleton đúng hình dạng nội dung (ảnh 3:4 + 2 dòng), không spinner toàn trang, không hiện "0 sản phẩm".
- **Rỗng:** tiêu đề + 1 câu hướng dẫn + 1 nút ("Xóa bộ lọc" / "Bắt đầu mua sắm").
- **Lỗi:** nói chuyện gì xảy ra + "Thử lại"; không xin lỗi dài dòng, không mơ hồ.

---

## 6. Mẫu trang thương mại điện tử (Baymard, NN/g)

- **Trang danh sách:** breadcrumb → H1 + số sản phẩm → thanh sắp xếp → chip bộ lọc đang áp dụng → lưới. Bộ lọc chỉ gồm dữ liệu thật (danh mục, giá, size, màu, còn hàng). Sắp xếp: Mới nhất, Giá thấp→cao, Giá cao→thấp. "Xem thêm" thay cho phân trang số.
- **Trang chi tiết:** ảnh lớn 3:4 bên trái (sticky desktop) → tên H1 → giá → chọn màu (chip) → chọn size (chip, **không chọn sẵn** trừ khi chỉ có 1 size) → 1 nút primary lg + 1 nút secondary → chính sách (3 dòng có icon) → mô tả (≤68ch) → thông tin chi tiết → sản phẩm liên quan. Mobile: thanh mua cố định đáy (giá + nút).
- **Giỏ hàng:** chỉ báo bước (Giỏ hàng → Giao hàng → Xác nhận), dòng sản phẩm có ảnh 3:4, màu/size, số lượng (nút 44×44), tạm tính, phí ship theo chính sách, thanh tiến độ freeship.
- **Thanh toán:** chỉ hỏi trường API cần, tự điền địa chỉ đã lưu, tóm tắt lỗi ở đầu form và focus vào đó, nút "Đặt hàng · {tổng}".
- **Trang chủ:** hero (ảnh thật + 1 câu giá trị + 2 nút) → danh mục (ảnh 3:4) → 1 khối editorial → hàng mới về. Không lặp cùng một ảnh trên một trang.

---

## 7. Hình ảnh & icon
- Ảnh sản phẩm: nền trung tính, ánh sáng đều, WebP, tỷ lệ 3:4, rộng 900px; luôn có `width/height` (chống nhảy layout).
- Hàng ảnh đầu tiên `loading="eager"` (+ `fetchpriority="high"` cho ảnh LCP), còn lại `lazy`.
- `alt` mô tả sản phẩm; ảnh trang trí `alt=""`.
- Icon: Lucide, nét 1.75, cỡ 20 (giao diện) / 22 (header) / 16 (trong chip); luôn kèm nhãn hoặc `aria-label`.
- Ghi nguồn/giấy phép ảnh bên thứ ba (xem `public/products/LICENSE-shrine-images.txt`).

## 8. Nội dung (microcopy)
- Tiếng Việt toàn bộ, giọng thân thiện, ngắn: "bạn", không "quý khách".
- Động từ rõ ràng; thông báo lỗi nói cách sửa; trạng thái rỗng mời hành động.
- Không dùng "→" cuối link, không dùng dấu "·" nối meta tràn lan, không nhãn VIẾT HOA phía trên tiêu đề.

## 9. Khả năng tiếp cận (WCAG 2.2 AA)
- Vùng chạm tối thiểu **24×24 CSS px** (2.5.8), mục tiêu **44×44** cho nút/ chip/ icon chính.
- Focus luôn thấy được: viền 2px `ring`, offset 2px; không bị header sticky che (2.4.11).
- Thứ tự tab theo thứ tự đọc; có link "Bỏ qua tới nội dung chính"; `lang="vi"`.
- Dialog có `role="dialog"`, `aria-modal`, nhãn; danh sách tải thêm thông báo qua `aria-live`.
- Không nhập lại thông tin đã có (3.3.7 — tự điền địa chỉ).

## 10. Checklist trước khi merge (tự chấm /10 mỗi mục)
1. Màu chỉ lấy từ vai trò ở §1.3; tương phản đạt §1.4.
2. Chữ chỉ dùng token §2.2; thân bài 16px, ô nhập ≥16px, không chữ <12px.
3. Khoảng cách thuộc thang 4px; bo góc đúng thứ bậc §3.3.
4. Chuyển động dùng token §4; chỉ transform/opacity; có reduced-motion.
5. Nút/ô nhập/chip đúng kích thước §5; 1 primary mỗi khu vực.
6. Có đủ trạng thái tải/rỗng/lỗi §5.7.
7. Vùng chạm ≥44 (tối thiểu 24), focus rõ, bàn phím dùng được.
8. Ảnh 3:4, có width/height, alt đúng.
9. Nội dung tiếng Việt, trung thực, không số liệu bịa.
10. Chụp màn hình mobile 390px và desktop 1440px, so với file này.

---

## Nguồn tham khảo
- Material Design 3 — Type scale (body large 16/24…), color roles, motion easing & duration: m3.material.io
- Apple Human Interface Guidelines — Typography (mặc định 17pt, tối thiểu 11pt), Accessibility (vùng chạm 44pt): developer.apple.com/design/human-interface-guidelines
- IBM Carbon — Motion (productive/expressive easing, durations 70–700ms): carbondesignsystem.com/elements/motion
- Shopify Polaris — Motion tokens (`--p-motion-ease`, duration 50–500ms): polaris.shopify.com/tokens/motion
- Microsoft Fluent 2 / WinUI — Timing & easing (83/167/250ms): fluent2.microsoft.design/motion
- Nielsen Norman Group — Animation duration (100–500ms; phản hồi ~100ms): nngroup.com/articles/animation-duration
- Refactoring UI (Adam Wathan & Steve Schoger) — Building your color palette: refactoringui.com
- W3C WCAG 2.2 — 1.4.3, 1.4.11, 2.4.11, 2.5.8, 3.3.7: w3.org/WAI/standards-guidelines/wcag/new-in-22
- Baymard Institute — Product list, product page, checkout UX research: baymard.com
- Butterick's Practical Typography — độ dài dòng, khoảng dòng: practicaltypography.com
- Be Vietnam Pro — Lâm Bảo, Tony Le, ViệtAnh Nguyễn (SIL OFL): github.com/bettergui/BeVietnamPro
- Tham khảo thêm: awesome-design-md (Nike DESIGN.md), taste-skill, UI UX Pro Max — đã đối chiếu, không sao chép.
