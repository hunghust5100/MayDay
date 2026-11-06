# DrMayDay App

Ứng dụng di động của **Hệ thống Quản lý khám bệnh & Theo dõi Mề đay (DrMayDay)**, xây dựng bằng **React Native + Expo** (TypeScript, Expo Router).

| Thành phần    | Phiên bản |
|---------------|-----------|
| Expo SDK      | 58        |
| React Native  | 0.88      |
| React         | 19.3      |
| TypeScript    | 6.0       |
| Điều hướng    | Expo Router (file-based routing) |

---

## 1. Yêu cầu môi trường

- **Node.js** LTS v18 trở lên (kèm npm)
- **Git**

Kiểm tra:

```bash
node -v
npm -v
git --version
```

Nếu chưa có Node.js, tải bản LTS tại <https://nodejs.org>.

---

## 2. Cài đặt

```bash
git clone <repo-url> drmayday-app
cd drmayday-app
npm install
```

> **Lưu ý về npm registry:** nếu máy cấu hình registry nội bộ (Nexus) mà tài khoản chưa có quyền truy cập, `npm install` sẽ báo lỗi `403 Forbidden`. Có 2 cách xử lý:
>
> 1. Đăng nhập Nexus: `npm login --registry=<nexus-registry-url>`
> 2. Cài một lần từ registry công khai (nếu chính sách cho phép):
>    ```bash
>    npm install --registry=https://registry.npmjs.org
>    ```

Khi thêm thư viện mới, luôn dùng `npx expo install <package>` (thay vì `npm install <package>`) để Expo chọn phiên bản tương thích với SDK.

---

## 3. Chuẩn bị thiết bị kiểm thử

Chọn **1 trong 2** cách:

### Cách 1 — Điện thoại thật (nhanh nhất)

1. Cài **Expo Go** từ App Store (iOS) hoặc Google Play (Android).
2. Điện thoại và máy tính phải dùng **chung một mạng Wi-Fi**.

### Cách 2 — Máy giả lập

- **Android Emulator:** cài Android Studio → tải Android SDK → mở **Virtual Device Manager (AVD)** → tạo thiết bị ảo (VD: Pixel 7).
- **iOS Simulator** (chỉ trên macOS): cài Xcode từ Mac App Store → **Settings › Components** → tải iOS Simulator.

---

## 4. Chạy ứng dụng

Khởi động Metro Bundler:

```bash
npx expo start
# hoặc
npm start
```

Terminal sẽ hiển thị mã QR và các phím tắt:

| Thao tác                    | Cách làm                                                        |
|-----------------------------|-----------------------------------------------------------------|
| Mở trên điện thoại          | Quét QR bằng **Expo Go** (Android) hoặc **Camera** (iOS)        |
| Mở trên Android Emulator    | Nhấn `a`                                                        |
| Mở trên iOS Simulator       | Nhấn `i`                                                        |
| Mở trên trình duyệt (web)   | Nhấn `w`                                                        |
| Tải lại ứng dụng            | Nhấn `r`                                                        |
| Mở Developer menu           | Nhấn `m`                                                        |

Nếu điện thoại không kết nối được qua Wi-Fi (mạng công ty chặn, khác subnet…), dùng chế độ tunnel:

```bash
npx expo start --tunnel
```

---

## 5. Các lệnh npm

| Lệnh                     | Mô tả                                                                 |
|--------------------------|-----------------------------------------------------------------------|
| `npm start`              | Khởi động dev server (`expo start`)                                   |
| `npm run android`        | Khởi động và mở trên Android                                          |
| `npm run ios`            | Khởi động và mở trên iOS (cần macOS)                                  |
| `npm run web`            | Khởi động và mở trên trình duyệt                                      |
| `npm run lint`           | Kiểm tra code bằng ESLint (`expo lint`)                               |
| `npm run reset-project`  | Chuyển code mẫu sang thư mục `example/` và tạo `src/app` trống        |
| `npx tsc --noEmit`       | Kiểm tra kiểu TypeScript                                              |
| `npx expo-doctor`        | Chẩn đoán lỗi cấu hình / phiên bản thư viện                           |

---

## 6. Cấu trúc thư mục

```
drmayday-app/
├── app.json              # Cấu hình Expo (tên app, icon, splash, plugins…)
├── package.json
├── tsconfig.json         # Alias "@/*" → "src/*"
├── assets/               # Ảnh, icon, splash
├── scripts/
│   └── reset-project.js
└── src/
    ├── app/              # Màn hình (Expo Router): mỗi file = 1 route
    │   ├── _layout.tsx   # Layout gốc / navigator
    │   ├── index.tsx     # Màn hình "/"
    │   └── explore.tsx   # Màn hình "/explore"
    ├── components/       # Component dùng chung
    ├── constants/        # Theme, hằng số
    └── hooks/            # Custom hooks
```

Quy ước: chỉ đặt **màn hình** trong `src/app/`; component, hook, service, util đặt ngoài `src/app/`.

---

## 7. Tài liệu nghiệp vụ & API

Đặc tả API backend nằm ngoài repo, tại thư mục `../API/`:

- `Xác thực, quản lý tài khoản, người dùng, phân quyền.md` — 23 API cốt lõi: đăng ký, đăng nhập, hồ sơ, quản trị người dùng, vai trò, quyền hạn (RBAC).

Base URL API: `/api/v1` · Xác thực bằng JWT qua header `Authorization: Bearer <token>`.

---

## 8. Tham khảo

- Expo docs (SDK 58): <https://docs.expo.dev/versions/v58.0.0/>
- Expo Router: <https://docs.expo.dev/router/introduction/>
- React Native: <https://reactnative.dev>
