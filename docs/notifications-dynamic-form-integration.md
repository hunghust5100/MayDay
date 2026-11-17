# Báo cáo tích hợp Notifications và Dynamic Form Builder

## 1. Phạm vi và trạng thái

Tích hợp hai module frontend đã hoàn thành vào nền `main` tại commit `89568ee` (đã có CSVC, bệnh nhân và bệnh án). Phần tích hợp được phát triển trên branch `feature/notifications-dynamic-form`.

- Đã có hộp thư thông báo và bộ tạo/xem thử mẫu phiếu, dùng REST client và mock trong bộ nhớ.
- Chưa có backend thật; không bổ sung backend, Firebase, FCM native hoặc push nền.
- Người dùng đã xác nhận hai module hoạt động ổn định khi tự test Android thật. Khi test nhanh chức năng khác, người dùng ghi nhận toast còn “nảy tưng tưng”; giữ nguyên và chỉ đề xuất ở mục 6.
- Không coi kết quả kiểm tra là bảo đảm mọi tính năng/thiết bị đều không còn lỗi. Mục tiêu là bảo toàn hành vi cũ và kiểm chứng các điểm giao nhau trong phạm vi đã thử.

### 1.1. Chức năng đã hoàn thiện

- **Thông báo:** hộp thư bệnh nhân/nhân viên, số chưa đọc, đọc một/đọc tất cả, xóa có xác nhận, phân trang, làm mới, loading/empty/error/retry. Khi không có màn đích phù hợp, mở toàn bộ nội dung bằng hộp thoại; link đơn thuốc/xét nghiệm chỉ đi tới route đã có, có thể vẫn là màn giữ chỗ.
- **Mẫu phiếu:** CRUD mẫu/phần/câu hỏi/lựa chọn, lọc hoạt động/ngừng hoạt động, phiên bản, validation, điều kiện cha/con và AND/OR. Hỗ trợ thiết kế và preview 6 loại: text, number, date, radio, checkbox, image_upload.
- **Preview:** câu trả lời/ảnh chỉ ở state cục bộ, có reset và kiểm tra bắt buộc; không lưu bệnh án hoặc upload ảnh. Khả năng renderer bệnh án cũ không bị thay thế bằng preview builder.
- **Bảo vệ dữ liệu mock:** không ghi đè mã mẫu clinical cũ; mẫu có bệnh án tham chiếu bị chặn xóa cấu trúc (`4105`). Tăng phiên bản hoặc ngừng hoạt động không mở khóa xóa. Mẫu đang hoạt động nhưng chưa sử dụng vẫn có thể xóa.
- Popup chọn/ngày và toast fade của hai module là tùy chọn riêng; các module khác giữ hành vi mặc định hiện có.

### 1.2. Chạy thử không cần backend

Đặt `EXPO_PUBLIC_API_MOCK=true` trong `.env`, khởi động lại bằng `npm start`, nhấn `w` để mở web hoặc quét QR trên Android bằng client tương thích SDK 58 (cùng Wi-Fi). Không cần server tại `EXPO_PUBLIC_API_URL` khi dùng mock.

| Tài khoản (mật khẩu `123456`) | Kết quả ban đầu sau reload |
|---|---|
| Admin `0900000001` → Mẫu phiếu khám | 26 mẫu: 14 hoạt động, 12 ngừng hoạt động; có phân trang |
| Bệnh nhân `0912345678` → Thông báo | 25 thông báo, 16 chưa đọc |
| Bác sĩ `0911111111` → Thông báo | Hộp thư riêng: 25 thông báo, 16 chưa đọc |
| Bệnh nhân `0971000017` → Thông báo | Hộp thư rỗng |

- `TMPL_DEMO`: thử 6 kiểu câu hỏi, chọn Có ở câu ngứa → hiện mức độ; mức độ ≥ 7 → hiện câu giấc ngủ; lựa chọn được cấu hình yêu cầu ảnh → hiện khối chọn ảnh.
- `TMPL_USED`: thử chặn xóa/đổi cấu trúc và hướng dẫn ngừng hoạt động khi gặp `4105`.
- Dữ liệu mock reset khi reload; **web và điện thoại không đồng bộ dữ liệu**. Quyền mock `manage_templates`/`manage_own_notifications` là fixture, chưa xác nhận mapping với backend.
- Chưa tích hợp FCM/Firebase, tự đăng ký token native, push nền/thanh trạng thái hoặc cache offline bền vững. Có REST client/mock đăng ký token để dành cho hạ tầng push sau này.

## 2. Chuẩn bị và kiểm thử nền main

Đã đối chiếu `AGENTS.md`, `README.md`, `docs/module-integration.md`, scripts trong `package.json`, `scripts/test-modules.cjs`, đặc tả và kế hoạch hai module.

`../MayDay-main-baseline` là **Git worktree độc lập tại snapshot main sạch**, không phải thư mục ứng dụng mới hoặc bản copy backup để đưa vào repository. Worktree giúp chạy baseline mà không ghi đè code tích hợp trong thư mục chính. Backup WIP local riêng là branch `backup/wip-notifications-dynamic-form` tại `5751e92`.

Lưu ý trình tự: khi bắt đầu lượt kiểm thử baseline độc lập, các file module đã được áp vào worktree chính. Baseline được chạy trên worktree sạch `89568ee`, không phải trên code tích hợp; các chỉnh sửa tương thích tiếp theo được thực hiện sau đối chiếu baseline.

Kết quả nền main đã ghi nhận:

- Typecheck đạt; lint có 2 warning `import/no-duplicates` ở `ProfileEditScreen.tsx:7–8`, không có error.
- Hai lượt `npm run test:modules`, mỗi lượt đạt 13 tình huống.
- Hai lượt browser cho bệnh nhân (phân loại/tạo/sửa bệnh án), bác sĩ (tìm bệnh nhân/tiếp nhận/lưu/chốt), admin (CSVC/người dùng/RBAC/đọc bệnh án); không ghi nhận page error hoặc console warning trong các luồng đó.
- Android Hermes export đạt; không thay thế kiểm thử native.
- Expo Doctor ở thời điểm baseline: 19/20, báo 8 package lệch bản vá. Không sửa những cảnh báo đó trong lượt tích hợp ban đầu.

## 3. Những thay đổi cần thiết để tích hợp

### 3.1. Code hai module và route

Giữ API/types/hooks/schemas/components/screens/utils trong `src/features/notifications/` và `src/features/dynamic-form/`. Thêm ba route mỏng cho tạo, chi tiết, sửa mẫu dưới `src/app/(app)/admin/templates/`; dùng role guard hiện có, không tạo cơ chế điều hướng riêng.

Notifications có phân trang, unread count, đọc một/tất cả, xóa có xác nhận, fallback nội dung đầy đủ, điều hướng đúng vai trò. Builder có CRUD mẫu/phần/câu hỏi/options, validation và preview sáu kiểu câu hỏi với điều kiện phụ thuộc. Preview không ghi dữ liệu bệnh án hoặc upload ảnh.

### 3.2. Bảo toàn dữ liệu và hợp đồng mẫu của bệnh án

Các file chính: `src/mocks/db/{seed,store,module-seed,template-reader}.ts`, `src/mocks/handlers/{templates,medical-records}.ts`.

- Giữ clinical fixtures trong `db.templates`; builder dùng `db.form_templates` và các bảng section/question/option riêng, tránh ghi đè dữ liệu khi ghép seed.
- GET template vẫn đọc được mẫu clinical với shape và ID cũ. Public exports của renderer, `useTemplate` cũ và các utility bệnh án được giữ lại.
- Không cho tạo mã mẫu builder trùng mã clinical. CRUD builder không sửa/xóa fixture clinical của module bệnh án.
- `template-reader.ts` ghép cây builder và chuyển section ID/null sang dạng phù hợp khi mock bệnh án sử dụng; không đổi type hoặc renderer clinical cũ.
- Mock bệnh án đọc được mẫu builder mới; mẫu builder ngừng hoạt động bị chặn khi tạo bệnh án mới, nhưng bệnh án đã có vẫn đọc/sửa theo quyền và trạng thái hiện hữu.
- Bảo vệ mẫu đang sử dụng dựa cả trên bệnh án thật trong mock (`medical_records`) và fixture `used_template_codes`: chặn xóa mẫu/phần/câu, đổi kiểu câu hoặc bỏ option được bảo vệ. Không mở khóa khi đổi version/deactivate.
- Giữ luồng phân loại acute/chronic và các mẫu cũ. Không tự đưa mọi mẫu builder vào thuật toán phân loại của đồng đội.

### 3.3. Cache và API dùng chung

Các file chính: `src/core/api/{client,usePaginatedQuery}.ts`, hooks/API của builder.

- Mở rộng metadata phân trang để giữ `unread_count`, vẫn giữ `items`/`total`; metadata không được ghi đè các trường chuẩn này.
- Xử lý signal đã abort trước lúc gọi API.
- Cache builder dùng `['templates', 'builder-detail', code]`, không dùng chung entry DTO với cache clinical `['templates', 'detail', code]`. Mutation vẫn invalidate prefix templates.
- Kiểm tra cấu trúc DTO builder để khi mở nhầm mẫu clinical từ URL admin thì báo lỗi có kiểm soát thay vì crash cây/form.
- Phản hồi lỗi trang tiếp theo/manual retry là tùy chọn `pageErrorFeedback`; chỉ hai module mới bật, caller cũ giữ props mặc định.

### 3.4. Mock routes, quyền và cleanup

- Đăng ký đủ 5 endpoint notifications và 11 endpoint templates, ưu tiên route cố định `/all`, `/read-all` trước route tham số.
- Thêm mã lỗi và metadata trong response, không thay hợp đồng thành công của các module cũ.
- Quyền mock cho hộp thư được append để không dịch ID grant cũ. Test đối chiếu các bảng seed cũ, bệnh án, câu trả lời và ID role_permission với main.
- Logout chỉ bổ sung cleanup FCM token của người dùng nếu request có token; xóa user bổ sung cleanup thông báo/token mới, không refactor auth.
- Cấu hình scenario empty/error trong `src/mocks/config.ts` là chức năng hỗ trợ mock runtime, không phải test artifact; giữ mặc định empty=false, failures=0.

### 3.5. UI dùng chung chỉ mở rộng có lựa chọn

- `SelectField`/`MultiSelectField`/`DateField` thêm `presentation="dialog"`; mặc định vẫn BottomSheet cho caller cũ.
- `ContentModal` là component runtime cần cho các popup của hai module, không phải file thử nghiệm.
- Toast thêm tùy chọn fade cho lời gọi success của hai module. **Không đổi animation mặc định cho module khác.**
- Không sửa màn hình facilities/patients/medical-records, `ProfileEditScreen`, `SearchBar` hoặc nghiệp vụ của họ để xử lý warning ngoài phạm vi.
- Lỗi route typing facilities trong môi trường local sau tích hợp được giải quyết bằng Expo sinh lại `.expo/types/router.d.ts`; không ép kiểu hay sửa route facilities.

## 4. Phạm vi file và quy tắc Git

| Nhóm | Quyết định |
|---|---|
| 55 file runtime `src/` của phần tích hợp | Giữ: route, feature, API, mock, shared extensions trực tiếp phục vụ tích hợp |
| `.gitignore`, `README.md`, báo cáo này | Giữ trong repository để nhóm có hướng dẫn và thông tin tích hợp |
| `/API/` | Ignore ở gốc: tài liệu tham khảo/kế hoạch local, không phải source runtime |
| `/tests/frontend-modules/` | Ignore: suite, browser scripts, báo cáo và artifacts local theo yêu cầu; không xóa trên máy |
| `scripts/test-modules.cjs`, `docs/module-integration.md` | Giữ nguyên tài liệu/script đã có của đồng đội, không ignore hoặc untrack |
| `.env`, `.expo/`, `node_modules/`, exports/build output | Đã được các rule hiện hữu bỏ qua; không đưa vào commit |
| `.vscode/`, `.claude/` đang tracked | Không tự xóa/untrack cấu hình chung đã có chỉ vì không phải runtime |
| `app.json`, `package.json`, `package-lock.json` | Là file cấu hình/dependency cần được quản lý phiên bản, tuyệt đối không ignore |

Dùng rule **`/API/`**, không dùng `API/` không có dấu `/` đầu: trên filesystem không phân biệt hoa/thường, rule rộng có thể vô tình bỏ qua `src/features/*/api/`. Đã kiểm tra source API của cả hai feature không bị ignore. Không thêm rule rộng cho `*.md`, `tests/` hoặc `scripts/`.

### Môi trường của lượt kiểm chứng bổ sung

Lượt kiểm chứng bổ sung chạy trên môi trường local có các cập nhật cấu hình/dependency sau, ngoài phần tích hợp runtime hai module:

- `package.json`: tăng patch Expo `58.0.23 → 58.0.25`, linking/router/secure-store/splash-screen/status-bar.
- `package-lock.json`: cập nhật cây dependency tương ứng.
- `app.json`: thêm plugin `expo-status-bar`.

Các cập nhật môi trường này được ghi nhận riêng để phân biệt với thay đổi nghiệp vụ của hai module và được đưa cùng bộ thay đổi tích hợp. Đã đối chiếu các dependency trực tiếp giữa package.json, lockfile và node_modules; phiên bản cài đặt khớp lockfile, Expo là 58.0.25. Đã export lại Android và web với cache sạch (`--clear`) và `EXPO_PUBLIC_API_MOCK=true`, cả hai đều đạt.

## 5. Kết quả kiểm chứng

Đã kiểm thử browser các luồng hai module và hồi quy bệnh án/CSVC trên nền `main` tại `89568ee`; export web/Android đạt. Người dùng đã xác nhận hai module hoạt động ổn định khi tự test Android thật. Không coi xác nhận này là nghiệm thu mọi thiết bị, backend thật hoặc toàn bộ module khác.

### Trong lượt tích hợp trước bàn giao

- 60/60 test local; 13/13 tình huống contract của main.
- Browser hồi quy các luồng main đạt; browser hai module với mock thật đạt 7 nhóm/101 request, fixture HTTP đạt 7 nhóm/36 request, không page/console error.
- Export web và Android đạt ở thời điểm đó.
- Audit runtime trước cập nhật tài liệu: 56 file chỉ thuộc phần thay đổi của đồng đội giữ nguyên, 8 điểm giao được chỉnh có chủ đích. Con số này là mốc audit trước khi cập nhật README và các dependency local mới, không phải khẳng định tất cả 56 file vẫn nguyên tại mọi thời điểm.

### Lượt kiểm chứng bổ sung

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` | 0 error; 2 warning import trùng có sẵn ở ProfileEditScreen |
| `npm run typecheck` | Đạt |
| `npm run test:modules` | 13/13 đạt |
| `node --test tests/frontend-modules/*.test.cjs` (local) | 60/60 đạt, gồm preservation seed và defaults |
| `npx expo-doctor` | 20/20 trên môi trường hiện tại |
| Export Android với dependency cập nhật | Đạt; tạo Hermes bundle và metadata, dùng `--clear` |
| Export web với dependency cập nhật | Đạt; tạo bundles, index.html và metadata, dùng `--clear` |
| Android thật | Người dùng xác nhận hai module ổn định; không có trace/model thiết bị trong báo cáo này |

Lượt kiểm chứng dependency cập nhật đã chạy lại export Android/web, lint, typecheck, 13 contract scenarios và Expo Doctor; không chạy lại browser hoặc native runtime trong lượt này. Export Android xác nhận khả năng tạo bundle, không thay thế kiểm thử thiết bị. Các log/ảnh/test chi tiết được giữ local, không đưa lên Git; báo cáo này là bản tóm tắt chia sẻ cho nhóm, không thay thế nghiệm thu backend hoặc kiểm thử mọi thiết bị.

## 6. Ghi nhận và đề xuất toast không còn “nảy tưng tưng”

### Hiện trạng — giữ nguyên, chưa sửa

Người dùng ghi nhận toast ở các chức năng khác khi test nhanh Android có hiệu ứng nảy. Đây là **toast phản hồi thao tác**, không phải hộp thư notifications hoặc FCM push.

Đối chiếu `ToastHost.tsx` trên main `89568ee`, animation mặc định đã dùng:

- Vào: `SlideInUp.springify().damping(18)`.
- Ra: `FadeOutUp`.
- Đổi bố cục: `LinearTransition`.

Nhánh mặc định này vẫn được giữ trong bản tích hợp. Hai module mới chọn fade cho success toast, không thay đổi chính sách của toàn app. Spring là một nguồn chuyển động nảy được xác nhận trong code; **chưa có đo đạc Android main sạch** để kết luận toàn bộ mức độ rung/nảy trên máy chỉ do một nguyên nhân. Khi nhiều toast chồng nhau cần kiểm tra thêm layout transition.

### Đề xuất để nhóm phụ trách shared UI xem xét trong thay đổi riêng

1. Thống nhất UX chung trước khi đổi mặc định; không sửa âm thầm từ module khác.
2. Cân nhắc fade tại vị trí cố định, không spring/slide dọc, thời gian vào khoảng 160 ms và ra khoảng 120 ms; tôn trọng reduced-motion.
3. Rà soát layout transition khi nhiều toast xuất hiện/biến mất, giữ giới hạn số toast và vị trí theo safe area.
4. Áp dụng nhất quán cho success/error/warning/info nếu nhóm chấp thuận; giữ nội dung, thời gian tự đóng, bấm đóng và semantics accessibility.
5. Test riêng trên web + Android: một toast, nhiều toast liên tiếp, bàn phím đang mở, chuyển route, màn nhỏ, reduced-motion. Kiểm tra cả lỗi API/toast tự sinh, không chỉ success của từng màn.

**Quyết định hiện tại:** chỉ ghi nhận/đề xuất trong báo cáo, chưa áp dụng thay đổi animation cho các module khác.

## 7. Giới hạn và bàn giao

Bộ kiểm thử riêng và artifacts ở `tests/frontend-modules/` chỉ lưu local, không đưa vào Git. Script `npm run test:modules` của nhóm vẫn được giữ trong repository. Tài liệu tham khảo `/API/` cũng chỉ lưu local; không bỏ qua các thư mục mã nguồn `src/**/api/`.

- Mock chạy trong JS app, reset khi reload; dữ liệu web/Android không đồng bộ.
- Preview có sáu kiểu không đồng nghĩa renderer bệnh án cũ đã hỗ trợ thêm tất cả kiểu hoặc upload ảnh.
- Chưa nghiệm thu backend, quyền server, FCM token native, push nền hoặc persistent offline cache.
- Tài liệu `docs/module-integration.md` của đồng đội được giữ nguyên như phạm vi ban đầu; README liên kết thêm báo cáo này để phân biệt phần bổ sung.
