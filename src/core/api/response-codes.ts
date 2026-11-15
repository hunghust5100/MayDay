/**
 * Thông báo tiếng Việt cho người dùng theo bảng mã phản hồi chính thức của API.
 * `message` từ server là tiếng Anh kỹ thuật → không hiển thị trực tiếp.
 */
export const RESPONSE_MESSAGES: Record<string, string> = {
  // Validation
  '2001': 'Vui lòng nhập đầy đủ thông tin bắt buộc.',
  '2002': 'Dữ liệu không đúng định dạng.',
  '2003': 'Giá trị không hợp lệ.',
  '2004': 'Số điện thoại không hợp lệ (10 số, đầu 03/05/07/08/09).',
  '2005': 'Email không hợp lệ.',
  '2006': 'Ngày không hợp lệ.',
  '2007': 'Dữ liệu gửi lên không hợp lệ.',
  // Auth
  '3001': 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  '3002': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  '3003': 'Vui lòng đăng nhập để tiếp tục.',
  '3004': 'Mã OTP không đúng.',
  '3005': 'Mã OTP đã hết hạn. Vui lòng gửi lại mã.',
  '3006': 'Số điện thoại hoặc email đã được đăng ký.',
  '3007': 'Tài khoản không tồn tại.',
  '3008': 'Mật khẩu không đúng.',
  '3009': 'Mật khẩu cũ không đúng.',
  // Authorization
  '3101': 'Bạn không có quyền thực hiện thao tác này.',
  '3102': 'Chức năng chỉ dành cho quản trị viên.',
  '3103': 'Chức năng chỉ dành cho bác sĩ.',
  '3104': 'Chức năng chỉ dành cho bệnh nhân.',
  '3105': 'Bạn không phụ trách bệnh án này.',
  '3106': 'Bạn không thể xem dữ liệu của người khác.',
  // Medical record
  '4001': 'Không tìm thấy bệnh án.',
  '4002': 'Bạn cần có bệnh án đang hoạt động.',
  '4003': 'Bệnh án đã hoàn thành, không thể chỉnh sửa.',
  '4004': 'Chỉ tiếp nhận được bệnh án đang chờ.',
  '4005': 'Bệnh án đã được bác sĩ khác tiếp nhận.',
  '4006': 'Vui lòng trả lời đầy đủ các câu hỏi phân loại.',
  '4007': 'Vui lòng trả lời ít nhất một câu hỏi.',
  '4008': 'Câu hỏi không thuộc phiếu khám của bệnh án.',
  '4009': 'Trạng thái bệnh án không hợp lệ.',
  // Template
  '4101': 'Không tìm thấy mẫu phiếu khám.',
  '4102': 'Mã mẫu phiếu đã tồn tại.',
  '4103': 'Không tìm thấy phần (section) của phiếu.',
  '4104': 'Không tìm thấy câu hỏi.',
  '4105': 'Mẫu phiếu đang được sử dụng, không thể xóa.',
  // UAS7
  '5001': 'Bạn chưa đủ điều kiện chấm điểm UAS7 (cần bệnh án mề đay mạn tính đang hoạt động).',
  '5002': 'Bạn đã chấm điểm cho ngày này.',
  '5003': 'Điểm ngứa phải từ 0 đến 3.',
  '5004': 'Điểm sẩn phù phải từ 0 đến 3.',
  '5005': 'Vui lòng chọn ngày chấm điểm.',
  // Image
  '6001': 'Vui lòng chọn ảnh.',
  '6002': 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP.',
  '6003': 'Ảnh vượt quá dung lượng cho phép (5 MB).',
  '6004': 'Chỉ được tải tối đa 10 ảnh mỗi lần.',
  '6005': 'Không tìm thấy ảnh.',
  '6006': 'Ảnh đã được gắn với câu trả lời này.',
  '6007': 'Lỗi lưu trữ ảnh. Vui lòng thử lại.',
  // Lesion
  '7001': 'Không tìm thấy đợt tổn thương.',
  '7002': 'Không tìm thấy vị trí tổn thương.',
  '7003': 'Không tìm thấy ảnh tổn thương.',
  '7004': 'Vui lòng nhập tên đợt tổn thương.',
  '7005': 'Vui lòng chọn vị trí trên cơ thể.',
  '7006': 'Mốc tiến triển không hợp lệ.',
  '7007': 'Điểm triệu chứng phải từ 0 đến 10.',
  // Prescription / Lab
  '8001': 'Đơn thuốc phải có ít nhất 1 thuốc.',
  '8002': 'Vui lòng nhập tên thuốc.',
  '8003': 'Bệnh án này đã được kê đơn.',
  '8101': 'Vui lòng chọn ít nhất 1 xét nghiệm.',
  '8102': 'Vui lòng nhập tên xét nghiệm.',
  '8103': 'Không tìm thấy yêu cầu xét nghiệm.',
  // AI / Notification
  '9001': 'Hệ thống AI gặp lỗi. Vui lòng thử lại sau.',
  '9002': 'Dịch vụ AI tạm thời không phản hồi.',
  '9003': 'Điểm ngứa cho AI phải từ 0 đến 3.',
  '9101': 'Thiếu mã thiết bị nhận thông báo.',
  '9102': 'Không tìm thấy thông báo.',
  // System
  '9901': 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  '9902': 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  '9903': 'Dịch vụ bên ngoài đang gặp sự cố. Vui lòng thử lại sau.',
};

/** Giữ mã cũ để tương thích; API tạo mới có thể trả 1001. */
export const SUCCESS_CODE = '1000';
export const SUCCESS_CODES = new Set([SUCCESS_CODE, '1001']);

/** Mã khiến phiên đăng nhập bị hủy (token sai/hết hạn/thiếu). */
export const SESSION_EXPIRED_CODES = new Set(['3001', '3002', '3003']);
