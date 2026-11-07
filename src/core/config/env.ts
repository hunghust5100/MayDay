/**
 * Cấu hình ứng dụng. Biến môi trường khai báo trong `.env` (xem `.env.example`);
 * chỉ biến có tiền tố `EXPO_PUBLIC_` mới được đưa vào bundle.
 */
export const env = {
  /** Gốc REST API, không có dấu `/` ở cuối. VD `https://api.drmayday.vn/api/v1`. */
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1').replace(/\/+$/, ''),
  /** Thời gian chờ tối đa mỗi request (ms). */
  apiTimeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 20000),
  /** Dùng mock API trong app thay cho backend thật (xem `src/mocks`). */
  apiMock: process.env.EXPO_PUBLIC_API_MOCK === 'true',
  /** Số bản ghi mặc định mỗi trang (API mặc định 20). */
  pageSize: 20,
} as const;
