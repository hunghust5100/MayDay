/** Lấy chữ cái đầu của tên: "Nguyễn Văn An" → "NA", "An" → "A". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Rút gọn tên (giống `display_name` của API): "Nguyễn Văn An" → "Nguyễn An". */
export function shortName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : words.join(' ');
}

/** Bỏ dấu tiếng Việt, chữ thường — dùng để tìm kiếm không phân biệt dấu. */
export function removeDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Băm chuỗi thành số nguyên không âm (ổn định giữa các lần chạy) — dùng để chọn màu cố định theo tên. */
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Dung lượng tệp: 1536 → "1.5 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
