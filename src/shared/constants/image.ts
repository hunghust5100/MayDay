/** Ràng buộc ảnh tải lên (tài liệu Kho ảnh: mã 6002–6004). */
export const IMAGE_UPLOAD = {
  /** Định dạng chấp nhận. */
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as readonly string[],
  /** Tối đa 5 MB / tệp. */
  maxFileSize: 5 * 1024 * 1024,
  /** Tối đa 10 ảnh / lần tải. */
  maxBatch: 10,
} as const;
