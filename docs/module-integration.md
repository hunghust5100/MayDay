# Hai module CSVC, bệnh nhân và bệnh án

## Chạy và kiểm tra

```sh
npm ci
npm run lint
npm run typecheck
npm run test:modules
```

Sao chép `.env.example` thành `.env`, đặt `EXPO_PUBLIC_API_MOCK=true`, rồi chạy `npm run web` hoặc `npm start`.
Để nối server, đặt `EXPO_PUBLIC_API_MOCK=false` và `EXPO_PUBLIC_API_URL=<server>/api/v1`, sau đó khởi động lại Expo.
Ứng dụng chỉ có REST client và mock trong bộ nhớ; không bổ sung backend.

ESLint dùng cấu hình chính thức `eslint-config-expo/flat`. Lệnh `expo lint` của CLI SDK 58 đang báo sai phiên bản ESLint trên môi trường Node 24 này dù đã cài ESLint 9; `npm run lint` gọi ESLint trực tiếp theo gợi ý của CLI. Khai báo `*.css` giúp TypeScript 6 kiểm tra side-effect import CSS của Metro. SearchBar đồng bộ callback ref trong effect để tương thích React Compiler.

## Màn hình và tài khoản thử

Mật khẩu tất cả tài khoản mẫu: `123456`.

| Vai trò | SĐT | Thử nghiệm |
|---|---|---|
| Admin | 0900000001 | Tab Cơ sở → tạo/sửa/xóa chi nhánh, khoa, phòng; Tổng quan → Hồ sơ bệnh án → xem/xóa |
| Bác sĩ A | 0911111111 | Bệnh nhân → tìm/lọc/thêm → lịch sử → tạo bệnh án; Bệnh án → tiếp nhận → điền phần bác sĩ → chốt |
| Bác sĩ B | 0911111112 | Thử tiếp nhận ca đã được bác sĩ A nhận và xem hồ sơ do bác sĩ khác phụ trách |
| Điều dưỡng | 0922222222 | Tìm/tạo bệnh nhân, tạo và xem bệnh án; không có thao tác tiếp nhận/chốt |
| Bệnh nhân | 0912345678 | Bệnh án → khai báo → phân loại → điền phần bệnh nhân → tạo → xem/sửa khi đang chờ |

Seed có 28 bệnh án, nhiều trạng thái và bệnh nhân để thử phân trang. Câu hỏi, mẫu phân loại là **fixture kiểm thử**, không phải bộ câu hỏi chuyên môn. Tải lại app sẽ đặt lại toàn bộ mock về seed.

Một bệnh nhân được mở từ kết quả tìm kiếm hoặc sau khi tạo có thông tin hồ sơ lưu trong query cache. Khi mở trực tiếp URL sau reload, màn lịch sử vẫn hoạt động với ID; không gọi API quản trị hay tự thêm endpoint lấy hồ sơ chi tiết không có trong đặc tả.

## Hợp đồng và ranh giới

- CSVC: `branch01–05`, `dept01–05`, `room01–05`, tương ứng GET/POST `/branches|departments|rooms`, GET/PUT/DELETE `/:id`.
- Bệnh nhân: `docpat01` GET `/doctor/patients/search`, `docpat02` POST `/doctor/patients/`; hỗ trợ keyword, gender, min_year, max_year, page, limit.
- Bệnh án: `medrec01/02/03/04/05/06/07/08/10/11/13/14` theo SLIDE5; giữ dấu gạch dưới trong `/medical_records`.
- Phiếu khám: chỉ đọc `tmpl03` GET `/templates/:code_template`; renderer và types được export qua public API của feature dynamic-form. Không triển khai builder hay CRUD template.
- Client nhận mã thành công `1000` và `1001`. Public hooks CSVC cũ vẫn giữ chữ ký và cache key.
- DTO giữ ID mẫu/câu hỏi là chuỗi; chuẩn hóa ID CSVC chuỗi/số thành number tại lớp API. ID option là số hoặc chuỗi số.
- Mẫu hỗ trợ text, number, radio, checkbox. `answer_text` chứa text, `answer_value: { value }` chứa số/lựa chọn nhiều; radio gửi thêm `question_option_id`. Khi cập nhật, câu trả lời thuộc section không được điền giữ nguyên.
- `filled_by`: patient, doctor hoặc both. Thiếu metadata này thì section cho phép vai trò đang chỉnh sửa điền. Chỉ kiểm tra câu hỏi bắt buộc đang hiển thị và được phép điền.
- `show_if_answer` được hiểu là option_value hoặc mảng option_value, dưới dạng JSON hoặc giá trị trực tiếp. Hỗ trợ chuỗi phụ thuộc nhiều tầng, chống vòng lặp; không thực thi biểu thức. Câu trả lời bị ẩn được gửi null để xóa giá trị cũ.
- Câu hỏi ảnh/kiểu chưa hỗ trợ được thông báo rõ; loại bắt buộc chưa hỗ trợ hoặc lựa chọn bắt buộc tải ảnh sẽ chặn gửi. Không lưu tệp giả hay triển khai module media.
- Bệnh nhân chỉ sửa bệnh án của mình ở pending. Bác sĩ phụ trách sửa ở in_progress. completed/cancelled chỉ đọc. Admin có thể xem/xóa nhưng không tiếp nhận/chốt thay bác sĩ.
- UI tiếp tục dùng quy ước role_id của repo: admin=1, patient=3; bác sĩ=2, trưởng khoa=6, điều dưỡng=4. Đây là giả định seed, cần đối chiếu khi nhóm có backend. Mock kiểm tra các quyền tương ứng trong bảng role_permissions; server thật quyết định quyền cuối cùng.
- Xóa khoa đặt phòng con về null. Chi nhánh/phòng có dữ liệu phụ thuộc bị chặn. Khoa có nhân viên hoặc thao tác chuyển khoa/phòng làm sai nơi công tác của nhân viên cũng bị chặn, không tự ý điều chuyển nhân sự.
- Chỉ mock bệnh án/câu trả lời và mẫu đọc. Xóa bệnh án không xóa bệnh nhân/mẫu. Kho ảnh chưa có dữ liệu mock nên không giả lập các bảng ảnh; giữ yêu cầu backend phải bảo toàn media gốc.

## Điểm không nhất quán trong slide

Nguồn: SLIDE4 (CSVC), SLIDE5 (bệnh nhân/bệnh án, ưu tiên bản cập nhật 11/10/2026), SLIDE11 (đọc cấu trúc mẫu).

- SLIDE4 có bảng GET danh sách ghi code 1001 và data object/string; client nhận cả hai code thành công, danh sách vẫn là mảng theo mô tả và API đã có. dept01 chấp nhận kết quả tạo là object hoặc mảng một phần tử tại adapter.
- room03/room04 có bảng bị lặp nội dung tạo/sửa; dùng mô tả nhóm API: GET chi tiết, PUT cập nhật.
- medrec05 và medrec13 có bảng sao chép danh sách; dùng mô tả riêng: GET object chi tiết và GET lịch sử bệnh nhân.
- medrec02 mô tả nhắc cấu trúc mẫu nhưng bảng output chỉ có template_id/template_name; client tải cây mẫu bằng tmpl03.
- medrec11 nhận status completed/cancelled theo bảng; completed_at chỉ gán khi completed. draft được hiển thị nếu backend trả về; ứng dụng không tự tạo luồng nháp.
- Mock phân loại chỉ phục vụ kiểm thử. Logic phân loại chuyên môn và các định dạng JSON phức tạp ngoài cấu trúc trên cần được backend cung cấp, không suy đoán từ bản aistudio.

## Kiểm chứng

`npm run test:modules` chạy các hợp đồng và tình huống nghiệp vụ trên handler/adapter thật của repo, gồm CRUD, FK, phân trang, phân loại, tạo/tiếp nhận/chốt/hủy/xóa, upsert câu trả lời, quyền truy cập và logic biểu mẫu. Harness Node dùng TypeScript hiện có và mô phỏng môi trường native, không thêm test framework.

Kiểm tra giao diện web dùng tài khoản mock. Chưa có URL/tài khoản backend thật để xác minh server; môi trường hiện tại không có Android SDK/adb nên chưa chạy trên Android.
