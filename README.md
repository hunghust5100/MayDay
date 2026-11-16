# MayDay

Ứng dụng di động **MayDay** của **Hệ thống Quản lý khám bệnh & Theo dõi Mề đay (DrMayDay)**, dành cho **bệnh nhân** và **bác sĩ**:

- **Bệnh nhân:** đăng ký/đăng nhập, khai báo bệnh án theo mẫu phiếu khám động, theo dõi tổn thương da (đợt bùng phát, vị trí, ảnh tiến triển), chấm điểm UAS7 hằng ngày, xem đơn thuốc và kết quả xét nghiệm, nhận thông báo đẩy.
- **Bác sĩ:** tìm/tạo bệnh nhân, tiếp nhận và chốt bệnh án, xem câu trả lời và ảnh tổn thương, chỉ định xét nghiệm, kê đơn thuốc.

| Thành phần    | Phiên bản / Công nghệ |
|---------------|-----------------------|
| Expo SDK      | 58 |
| React Native  | 0.88 |
| React         | 19.3 |
| TypeScript    | 6.0 |
| Điều hướng    | Expo Router (file-based routing) |
| Giao diện     | NativeWind 4 (Tailwind CSS 3.4), tailwind-variants, Lucide icon, font Be Vietnam Pro |
| Form          | react-hook-form + zod |
| Dữ liệu       | TanStack Query (cache, phân trang), expo-secure-store (lưu JWT) |
| Backend       | REST API `/api/v1`, xác thực JWT |

---

## 1. Yêu cầu môi trường

- **Node.js** LTS v18 trở lên (kèm npm)
- **Git**

```bash
node -v
npm -v
git --version
```

---

## 2. Cài đặt

```bash
git clone <repo-url> drmayday-app
cd drmayday-app
npm install
```

> **npm registry:** file `.npmrc` của dự án cố định registry công khai `https://registry.npmjs.org/`, ghi đè cấu hình registry toàn máy (VD Nexus nội bộ) — chỉ áp dụng trong thư mục dự án.

Thêm thư viện mới luôn dùng `npx expo install <package>` để chọn phiên bản tương thích với SDK.

Cấu hình địa chỉ API: sao chép `.env.example` thành `.env` rồi sửa `EXPO_PUBLIC_API_URL` (chạy trên điện thoại thật thì dùng IP LAN của máy chạy backend, không dùng `localhost`). Chưa có backend thì để `EXPO_PUBLIC_API_MOCK=true` để dùng [mock API](#7-mock-api). Sửa `.env` xong phải khởi động lại `npx expo start`.

```bash
cp .env.example .env
```

---

## 3. Thiết bị kiểm thử

- **Điện thoại thật:** cài **Expo Go** (App Store / Google Play), điện thoại và máy tính dùng chung Wi-Fi.
- **Android Emulator:** Android Studio → Android SDK → Virtual Device Manager → tạo thiết bị ảo.
- **iOS Simulator** (chỉ macOS): Xcode → Settings › Components → tải iOS Simulator.

---

## 4. Chạy ứng dụng

```bash
npx expo start
```

| Thao tác                  | Cách làm |
|---------------------------|----------|
| Mở trên điện thoại        | Quét QR bằng Expo Go (Android) hoặc Camera (iOS) |
| Android Emulator          | Nhấn `a` |
| iOS Simulator             | Nhấn `i` |
| Trình duyệt               | Nhấn `w` |
| Tải lại                   | Nhấn `r` |
| Developer menu            | Nhấn `m` |

Điện thoại không kết nối được qua Wi-Fi (mạng công ty chặn, khác subnet…): `npx expo start --tunnel`.

### 4.1. Tài khoản đăng nhập thử (mock API)

Dùng khi `.env` đặt `EXPO_PUBLIC_API_MOCK=true` (xem [mục 7](#7-mock-api)). **Mật khẩu của mọi tài khoản: `123456`.**

| Số điện thoại | Họ tên | Vai trò (`role_id`) | Ghi chú |
|---------------|--------|---------------------|---------|
| `0900000001` | Quản Trị Viên | Admin (1) | Gọi được các API quản trị |
| `0911111111` | Trần Thị Bình | Bác sĩ (2) | Hà Nội · Khoa Da liễu · Phòng 101 |
| `0911111112` | Lê Văn Cường | Bác sĩ (2) | Hà Nội · Khoa Dị ứng – Miễn dịch · Phòng 201 |
| `0922222222` | Phạm Thị Dung | Điều dưỡng (4) | Hà Nội · Khoa Da liễu |
| `0911111113` | Hoàng Minh Đức | Trưởng khoa (6) | TP.HCM · Khoa Da liễu · Phòng 301 |
| `0912345678` | Nguyễn Văn A | Bệnh nhân (3) | Hồ sơ cá nhân đầy đủ |
| `0988888888` | Đỗ Thị Hoa | Bệnh nhân (3) | **Bị khóa**: đăng nhập báo "Tài khoản đã bị khóa" (`3101`) |
| `0971000017` … `0971000040` | 24 bệnh nhân sinh tự động | Bệnh nhân (3) | Dữ liệu thử danh sách, phân trang, tìm kiếm |

- **Quên mật khẩu:** OTP luôn là `123456`.
- **Tài khoản tự đăng ký** chỉ tồn tại đến khi tải lại app (dữ liệu mock nằm trong bộ nhớ).
- **Sau khi đăng nhập:** bệnh nhân vào `/patient`, admin vào `/admin`, các vai trò nhân viên (bác sĩ, điều dưỡng, trưởng khoa) vào `/doctor`.

---

## 5. Các lệnh

| Lệnh               | Mô tả |
|--------------------|-------|
| `npm start`        | Khởi động dev server |
| `npm run android`  | Mở trên Android |
| `npm run ios`      | Mở trên iOS (cần macOS) |
| `npm run web`      | Mở trên trình duyệt |
| `npm run lint`     | Kiểm tra code (ESLint với cấu hình Expo) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run test:modules` | Kiểm thử hợp đồng API/mock và biểu mẫu |
| `npx expo-doctor`  | Chẩn đoán cấu hình / phiên bản thư viện |

---

## 6. Kiến trúc

Kiến trúc phân lớp, chia module theo nghiệp vụ (feature-based) để tái sử dụng tối đa: hạ tầng và UI dùng chung viết một lần ở `core/` và `shared/`, mỗi nghiệp vụ gói gọn trong một thư mục `features/<module>`.

### 6.1. Cấu trúc thư mục

```
src/
├── app/                      # CHỈ định tuyến (Expo Router) — file route mỏng, render screen từ features
│   ├── _layout.tsx           # Layout gốc
│   ├── index.tsx             # Điểm vào: chuyển tới đăng nhập hoặc trang chủ theo vai trò
│   ├── (auth)/               # Chưa đăng nhập: đăng nhập, đăng ký, quên / đặt lại mật khẩu
│   └── (app)/                # Đã đăng nhập (mất phiên → về đăng nhập)
│       ├── change-password.tsx
│       ├── patient/          # /patient/* — bệnh nhân: (tabs)/ + các màn con
│       ├── doctor/           # /doctor/*  — nhân viên y tế (bác sĩ, điều dưỡng…)
│       └── admin/            # /admin/*   — quản trị viên
│
├── core/                     # Hạ tầng toàn ứng dụng (khởi tạo một lần)
│   ├── api/                  # HTTP client, gắn JWT, chuẩn hóa Base Response, mã lỗi
│   ├── auth/                 # Phiên đăng nhập, token, chặn route theo vai trò
│   ├── config/               # Biến môi trường, cấu hình
│   ├── storage/              # Secure storage, cache cục bộ
│   ├── notifications/        # Vị trí dành cho hạ tầng push (chưa tích hợp FCM native)
│   └── providers/            # Gộp các Provider gốc
│
├── shared/                   # Code dùng chung, không phụ thuộc nghiệp vụ
│   ├── ui/                   # Design system: component giao diện cơ bản
│   ├── form/                 # Field nhập liệu, validation
│   ├── hooks/                # Custom hook dùng chung
│   ├── theme/                # Design token: màu, spacing, typography
│   ├── utils/                # Hàm tiện ích thuần
│   ├── constants/            # Hằng số dùng chung
│   └── types/                # Kiểu dữ liệu dùng chung
│
├── mocks/                    # Mock API (backend giả chạy trong app) — chỉ app/_layout.tsx import
│
└── features/                 # Module nghiệp vụ
    ├── auth/                 # Xác thực tài khoản
    ├── admin/                # Quản trị người dùng, vai trò, quyền hạn
    ├── home/                 # Trang chủ theo vai trò
    ├── profile/              # Hồ sơ cá nhân
    ├── facilities/           # Chi nhánh, khoa, phòng khám
    ├── patients/             # Bác sĩ tìm kiếm & tạo bệnh nhân
    ├── medical-records/      # Hồ sơ bệnh án
    ├── dynamic-form/         # Renderer bệnh án + quản lý/thiết kế/xem thử mẫu phiếu
    ├── uas7/                 # Chấm điểm UAS7
    ├── prescriptions/        # Đơn thuốc
    ├── labs/                 # Xét nghiệm
    ├── media/                # Kho ảnh & ảnh đính kèm
    ├── lesions/              # Theo dõi tổn thương da
    └── notifications/        # Thông báo
```

### 6.2. Cấu trúc một feature

```
features/<module>/
├── api/          # Hàm gọi endpoint của module (dùng client ở core/api)
├── types/        # Model & DTO theo đặc tả API
├── schemas/      # zod schema của các form trong module
├── hooks/        # Logic, state, gọi api
├── components/   # UI riêng của module (ghép từ shared/ui)
├── screens/      # Màn hình hoàn chỉnh, được app/ import
└── index.ts      # Public API — bên ngoài chỉ import module qua file này
```

### 6.3. Quy tắc phụ thuộc

```
app ──▶ features ──▶ core ──▶ shared
           └───────────────────▲
```

| Lớp | Được import | Không được import |
|-----|-------------|-------------------|
| `app` | `features`, `core`, `shared` | — |
| `features` | `core`, `shared`, feature khác **chỉ qua `index.ts`** | `app`, file nội bộ của feature khác |
| `core` | `shared` | `app`, `features` |
| `shared` | thư viện ngoài | `app`, `features`, `core` |
| `mocks` | `shared` | `app`, `features`, `core` |

- `app/` không chứa logic hay UI — mỗi route chỉ render một screen từ `features`.
- Thứ gì dùng ở **từ 2 feature trở lên** chuyển xuống `shared/` (UI, hook, util) hoặc `core/` (hạ tầng).
- Điều hướng theo vai trò dựa vào `role_id` (`core/auth/roles.ts`): Bệnh nhân (`3`) → `/patient`, Admin (`1`, chưa chốt với backend) → `/admin`, còn lại → `/doctor`. Mỗi nhóm route có `RoleStack` chặn sai vai trò.
- `mocks/` chỉ được import ở `app/_layout.tsx` (bật/tắt bằng `.env`), không lớp nào khác phụ thuộc vào nó.
- Import theo alias `@/` (trỏ tới `src/`), ví dụ `@/shared/ui`, `@/features/auth`.

### 6.4. Danh sách màn hình

✅ đã làm (gọi API thật / mock) · 🚧 màn giữ chỗ `ComingSoonScreen` — người phụ trách module thay bằng màn thật trong `features/<module>/screens`.

| Nhóm | Route | Màn hình | |
|------|-------|----------|---|
| Xác thực | `/login`, `/signup` | Đăng nhập, Đăng ký | ✅ |
| | `/forgot-password`, `/reset-password` | Quên mật khẩu (gửi OTP), Đặt lại mật khẩu | ✅ |
| | `/change-password` | Đổi mật khẩu (mọi vai trò) | ✅ |
| Bệnh nhân — tab | `/patient` | Trang chủ (lối tắt chức năng) | ✅ |
| | `/patient/records` | Bệnh án cá nhân, lọc trạng thái | ✅ |
| | `/patient/tracking` | Theo dõi (UAS7, tổn thương, kho ảnh) | ✅ |
| | `/patient/notifications` | Hộp thư, đọc/đọc tất cả, xóa, phân trang | ✅ |
| | `/patient/account` | Tài khoản | ✅ |
| Bệnh nhân — màn con | `/patient/profile`, `/patient/profile/edit` | Hồ sơ cá nhân, Sửa hồ sơ | ✅ |
| | `/patient/records/new` | Phân loại, điền phiếu, khai báo bệnh án | ✅ |
| | `/patient/uas7`, `/patient/lesions` | Chấm điểm UAS7, Theo dõi tổn thương | 🚧 |
| | `/patient/prescriptions`, `/patient/labs`, `/patient/media` | Đơn thuốc, Xét nghiệm, Kho ảnh | 🚧 |
| Nhân viên y tế — tab | `/doctor` | Tổng quan (lối tắt chức năng) | ✅ |
| | `/doctor/records`, `/doctor/patients` | Bệnh án, tìm/lọc bệnh nhân | ✅ |
| | `/doctor/notifications` | Hộp thư riêng, điều hướng theo vai trò | ✅ |
| | `/doctor/account` | Tài khoản | ✅ |
| Nhân viên y tế — màn con | `/doctor/patients/new` | Thêm bệnh nhân và thông tin hồ sơ | ✅ |
| | `/doctor/patients/[id]`, `/doctor/records/new` | Lịch sử bệnh nhân, tạo bệnh án | ✅ |
| | `/patient/records/[id]`, `/doctor/records/[id]` | Chi tiết, câu trả lời, tiếp nhận và chốt theo vai trò | ✅ |
| | `/doctor/prescriptions`, `/doctor/labs`, `/doctor/media` | Kê đơn, Xét nghiệm, Kho ảnh | 🚧 |
| Admin — tab | `/admin` | Tổng quan (số liệu tài khoản, lối tắt) | ✅ |
| | `/admin/users` | Người dùng: tìm kiếm, lọc, phân trang | ✅ |
| | `/admin/rbac` | Phân quyền: vai trò (dạng cây), quyền hạn | ✅ |
| | `/admin/facilities` | Cơ sở: danh sách, lọc, thêm/sửa/xóa chi nhánh, khoa, phòng | ✅ |
| | `/admin/facilities/[kind]/[id]` | Chi tiết/chỉnh sửa cơ sở; `id=new` để tạo | ✅ |
| | `/admin/records`, `/admin/records/[id]` | Danh sách/chi tiết và xóa bệnh án | ✅ |
| | `/admin/account` | Tài khoản | ✅ |
| Admin — màn con | `/admin/users/new`, `/admin/users/new-staff` | Thêm người dùng, Thêm nhân viên y tế | ✅ |
| | `/admin/users/[id]` | Chi tiết người dùng, khóa / mở khóa, xóa | ✅ |
| | `/admin/users/[id]/edit`, `/admin/users/[id]/assign` | Sửa người dùng, Phân công công tác | ✅ |
| | `/admin/roles/new`, `/admin/roles/[id]` | Thêm vai trò, Quyền của vai trò (cấp / thu hồi) | ✅ |
| | `/admin/permissions/new`, `/admin/permissions/[id]` | Thêm quyền, Sửa / xóa quyền | ✅ |
| | `/admin/templates` | Danh sách mẫu, lọc trạng thái, phân trang | ✅ |
| | `/admin/templates/new`, `/admin/templates/[id]/edit` | Tạo/sửa thông tin mẫu | ✅ |
| | `/admin/templates/[id]` | Cây nội dung, CRUD phần/câu hỏi/lựa chọn, preview và branching | ✅ |

---

## 7. Mock API

Backend giả chạy **ngay trong app** (`src/mocks/`), làm theo đặc tả giáo viên (xem [ghi chú tích hợp](docs/module-integration.md)): cùng endpoint, Base Response, mã lỗi, JWT, phân trang. Mock chặn `fetch` tới `EXPO_PUBLIC_API_URL` nên `core/api` và code nghiệp vụ chạy y như khi nối backend thật. Đổi sang backend thật thì đặt `EXPO_PUBLIC_API_MOCK=false`, không phải sửa code.

**Bật / tắt:** `EXPO_PUBLIC_API_MOCK=true | false` trong `.env`, rồi khởi động lại dev server. Mỗi request được in ra console (`[mock] POST /auth/login → 1000`).

**Đã mock:**

| Tài liệu | API |
|----------|-----|
| Xác thực và quản lý tài khoản người dùng | auth01–auth07 (signup, login, logout, forgot/reset/change password, create_staff), profile01–02 |
| Quản trị người dùng, Phân Quyền | admin01–admin06, role01–02, perm01–04, roleperm01–03 |
| Quản lý CSVC và Hạ tầng tổ chức | branch01–05, dept01–05, room01–05 |
| Quản lý bệnh nhân và bệnh án | docpat01–02, medrec01–08/10/11/13/14 (các API trong đặc tả) |
| Phiếu khám động | 11 endpoint: CRUD mẫu, phần, câu hỏi/options; giữ tmpl03 đọc cây mẫu cho bệnh án |
| Thông báo | 5 endpoint: danh sách, đọc một/tất cả, xóa, đăng ký token ở mức REST mock |

Endpoint chưa mock trả `9901` và in cảnh báo `[mock] Chưa có mock cho …`.

**Tài khoản mẫu:** xem [mục 4.1](#41-tài-khoản-đăng-nhập-thử-mock-api).

**Lưu ý:**

- **OTP quên mật khẩu** luôn là `123456`, hạn 10 phút (được in ra console).
- **Dữ liệu chỉ nằm trong bộ nhớ:** tải lại app là về dữ liệu mẫu. Phiên đăng nhập của tài khoản mẫu vẫn giữ được; tài khoản vừa đăng ký thì bị đăng xuất (`3001`).
- **ID vai trò:** tài liệu chỉ chốt `3` = Bệnh nhân; `1` Admin, `2` Bác sĩ, `4`–`7` là giả định của mock, cần đối chiếu với backend.
- **Chỉnh hành vi** (độ trễ, thời hạn token, OTP…) trong `src/mocks/config.ts`. VD đặt `tokenTtlSeconds: 30` để thử luồng token hết hạn (`3002`).
- **Thêm mock cho module khác:** viết handler trong `src/mocks/handlers/`, khai báo route `[method, path, handler]` rồi đăng ký trong `src/mocks/server.ts`.

## 8. CSVC, bệnh nhân và bệnh án

Xem [hướng dẫn chạy thử, hợp đồng và các điểm cần đối chiếu backend](docs/module-integration.md). Tài liệu này mô tả phạm vi CSVC/bệnh nhân/bệnh án ban đầu, khi phiếu khám chỉ có chức năng đọc. Phần quản lý mẫu bổ sung được mô tả ở mục 9; renderer và dữ liệu mẫu bệnh án cũ được giữ nguyên.

## 9. Thông báo và bộ tạo mẫu phiếu khám động

Đã hoàn thiện frontend và mock trong bộ nhớ; **chưa có backend thật**. Báo cáo tích hợp, phạm vi thay đổi và đề xuất toast dùng chung: [docs/notifications-dynamic-form-integration.md](docs/notifications-dynamic-form-integration.md).
