// Model theo tài liệu "Quản lý CSVC và Hạ tầng tổ chức".

export type Branch = { id: number; name: string; address: string; phone: string; created_at: string; updated_at: string };

export type Department = {
  id: number;
  name: string;
  description: string | null;
  branch_id: number;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: number;
  name: string;
  description: string | null;
  /** `null` khi khoa đã bị xóa. */
  department_id: number | null;
  created_at: string;
  updated_at: string;
};
