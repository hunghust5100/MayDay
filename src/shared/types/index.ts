// Public API: kiểu dữ liệu dùng chung

/** Sắc thái màu ngữ nghĩa dùng chung cho Badge, Toast, ProgressBar... */
export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** Trạng thái hồ sơ bệnh án (`medical_records.status`). */
export type MedicalRecordStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/** Mức độ trên thang 0–3 (UAS7: ngứa ISS7, sẩn phù HSS7). */
export type SeverityLevel = 0 | 1 | 2 | 3;

/** Giới tính theo enum của API. */
export type Gender = 'male' | 'female' | 'other';
