/** Trạng thái tải lên của một ảnh (feature cập nhật khi gọi API upload). */
export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export type ImageItem = {
  uri: string;
  /** Khóa ổn định (VD image_id); mặc định dùng uri. */
  key?: string | number;
  status?: UploadStatus;
  /** Tiến độ 0–1 khi `status = 'uploading'`. */
  progress?: number;
};
