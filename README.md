# DrMayDay App

Ứng dụng di động của **Hệ thống Quản lý khám bệnh & Theo dõi Mề đay (DrMayDay)**, dành cho **bệnh nhân** và **bác sĩ**:

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

Cấu hình địa chỉ API: sao chép `.env.example` thành `.env` rồi sửa `EXPO_PUBLIC_API_URL` (chạy trên điện thoại thật thì dùng IP LAN của máy chạy backend, không dùng `localhost`).

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

---

## 5. Các lệnh

| Lệnh               | Mô tả |
|--------------------|-------|
| `npm start`        | Khởi động dev server |
| `npm run android`  | Mở trên Android |
| `npm run ios`      | Mở trên iOS (cần macOS) |
| `npm run web`      | Mở trên trình duyệt |
| `npm run lint`     | Kiểm tra code (ESLint) |
| `npx tsc --noEmit` | Kiểm tra kiểu TypeScript |
| `npx expo-doctor`  | Chẩn đoán cấu hình / phiên bản thư viện |

---

## 6. Kiến trúc

Kiến trúc phân lớp, chia module theo nghiệp vụ (feature-based) để tái sử dụng tối đa: hạ tầng và UI dùng chung viết một lần ở `core/` và `shared/`, mỗi nghiệp vụ gói gọn trong một thư mục `features/<module>`.

### 6.1. Cấu trúc thư mục

```
src/
├── app/                      # CHỈ định tuyến (Expo Router) — file route mỏng, render screen từ features
│   ├── _layout.tsx           # Layout gốc
│   ├── (auth)/               # Nhóm route chưa đăng nhập: đăng nhập, đăng ký, quên mật khẩu
│   ├── (patient)/            # Nhóm route bệnh nhân
│   └── (doctor)/             # Nhóm route bác sĩ
│
├── core/                     # Hạ tầng toàn ứng dụng (khởi tạo một lần)
│   ├── api/                  # HTTP client, gắn JWT, chuẩn hóa Base Response, mã lỗi
│   ├── auth/                 # Phiên đăng nhập, token, chặn route theo vai trò
│   ├── config/               # Biến môi trường, cấu hình
│   ├── storage/              # Secure storage, cache cục bộ
│   ├── notifications/        # Khởi tạo push notification (FCM)
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
└── features/                 # Module nghiệp vụ
    ├── auth/                 # Xác thực tài khoản
    ├── profile/              # Hồ sơ cá nhân
    ├── facilities/           # Chi nhánh, khoa, phòng khám
    ├── patients/             # Bác sĩ tìm kiếm & tạo bệnh nhân
    ├── medical-records/      # Hồ sơ bệnh án
    ├── dynamic-form/         # Hiển thị mẫu phiếu khám động
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

- `app/` không chứa logic hay UI — mỗi route chỉ render một screen từ `features`.
- Thứ gì dùng ở **từ 2 feature trở lên** chuyển xuống `shared/` (UI, hook, util) hoặc `core/` (hạ tầng).
- Import theo alias `@/` (trỏ tới `src/`), ví dụ `@/shared/ui`, `@/features/auth`.
