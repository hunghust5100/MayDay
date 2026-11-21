/** Request đã được mock server phân tích từ lời gọi `fetch`. */
export type MockRequest = {
  method: string;
  /** Đường dẫn sau Base URL, VD `/admin/users/15`. */
  path: string;
  query: Record<string, string>;
  /** Tham số trên đường dẫn, VD `{ id: '15' }` cho `/admin/users/:id`. */
  params: Record<string, string>;
  /** Header, tên viết thường. */
  headers: Record<string, string>;
  /** Body JSON đã parse hoặc FormData cho upload (`undefined` nếu không gửi body). */
  body: unknown;
};

export type MockResponse = { status: number; body: BaseResponse };

type BaseResponse = { code: string; message: string; data: unknown; total?: number; unread_count?: number };

/** Message theo bảng mã phản hồi chính thức (server trả tiếng Anh, client tự dịch). */
const MESSAGES: Record<string, string> = {
  '1000': 'OK',
  '2001': 'Missing required parameter',
  '2002': 'Invalid parameter type',
  '2003': 'Invalid parameter value',
  '2004': 'Invalid phone number format',
  '2005': 'Invalid email format',
  '2006': 'Invalid date format',
  '2007': 'Request body invalid',
  '3001': 'Token is invalid',
  '3002': 'Token expired',
  '3003': 'User not authenticated',
  '3004': 'OTP incorrect',
  '3005': 'OTP expired',
  '3006': 'User phone or email already exists',
  '3007': 'User account not found',
  '3008': 'Password incorrect',
  '3009': 'Old password incorrect',
  '3101': 'Permission denied',
  '3102': 'Admin role required',
  '3103': 'Doctor role required',
  '3104': 'Patient role required',
  '3105': 'Doctor not assigned to this record',
  '3106': "Cannot access another user's data",
  '4001': 'Medical record not found',
  '4002': 'Active medical record required',
  '4003': 'Medical record already completed',
  '4004': 'Medical record not in pending status',
  '4005': 'Already accepted by another doctor',
  '4006': 'Classification options incomplete',
  '4007': 'At least one answer required',
  '4008': 'Question does not belong to this template',
  '4009': 'Invalid medical record status',
  '4101': 'Template not found',
  '4102': 'Template code already exists',
  '4103': 'Section not found',
  '4104': 'Question not found',
  '4105': 'Template in use cannot be deleted',
  '6001': 'Image file is required',
  '6002': 'Unsupported image format',
  '6003': 'File size exceeds limit',
  '6004': 'Too many files',
  '6005': 'Attachment not found',
  '6006': 'Image already mapped to answer',
  '6007': 'Image storage failed',
  '7001': 'Lesion episode not found',
  '7002': 'Lesion location not found',
  '7003': 'Lesion photo not found',
  '7004': 'Lesion name cannot be empty',
  '7005': 'Body part cannot be empty',
  '7006': 'Invalid milestone value',
  '7007': 'Symptom score out of range',
  '9101': 'FCM token is required',
  '9102': 'Notification not found',
  '9901': 'Internal server error',
};

/** HTTP status đi kèm mã nghiệp vụ (client chỉ dựa vào `code`, status để giống server thật). */
function httpStatusOf(code: string): number {
  if (code === '1000') return 200;
  if (code === '3001' || code === '3002' || code === '3003') return 401;
  if (code === '4102' || code === '4105') return 409;
  if (['4101', '4103', '4104', '9102'].includes(code)) return 404;
  if (code === '9101') return 400;
  if (code === '3006') return 409;
  if (code === '3007') return 404;
  if (code.startsWith('31')) return 403;
  if (['6005', '7001', '7002', '7003'].includes(code)) return 404;
  if (code === '6006') return 409;
  if (code === '6007') return 500;
  if (code.startsWith('6') || code.startsWith('7')) return 400;
  if (code === '4001' || code === '4101') return 404;
  if (code === '4003' || code === '4004' || code === '4005') return 409;
  if (code.startsWith('4')) return 400;
  if (code.startsWith('2') || code.startsWith('3')) return 400;
  return 500;
}

/** Lỗi nghiệp vụ: handler `throw` ở bất kỳ đâu, server chuyển thành Base Response tương ứng. */
export class MockApiError extends Error {
  constructor(
    readonly code: string,
    message?: string,
  ) {
    super(message ?? MESSAGES[code] ?? 'Error');
  }
}

/** Dừng xử lý và trả mã lỗi `code`. */
export function reject(code: string, message?: string): never {
  throw new MockApiError(code, message);
}

/** Thành công: `{ code: "1000", message: "OK", data }` (+ `total` khi phân trang). */
export function ok(data: unknown = {}, total?: number, metadata?: { unread_count: number }): MockResponse {
  const body: BaseResponse = { code: '1000', message: 'OK', data };
  if (total !== undefined) body.total = total;
  if (metadata) body.unread_count = metadata.unread_count;
  return { status: 200, body };
}

export function created(data: unknown): MockResponse {
  return { status: 201, body: { code: '1001', message: 'Created successfully', data } };
}

export function errorResponse(error: MockApiError): MockResponse {
  return { status: httpStatusOf(error.code), body: { code: error.code, message: error.message, data: {} } };
}
