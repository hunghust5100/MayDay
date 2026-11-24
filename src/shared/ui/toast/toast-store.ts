export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
  /** Thời gian hiển thị (ms). */
  duration: number;
  /** Opt-in stationary feedback; other modules keep their existing animation. */
  motion?: 'fade';
};

type Listener = () => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

function show(type: ToastType, message: string, duration = 3000, motion?: 'fade') {
  const id = nextId++;
  // Thông báo mới thay thông báo cũ để tránh che nhiều nội dung trên màn hình nhỏ.
  items = [{ id, type, message, duration, ...(motion ? { motion } : {}) }];
  emit();
  return id;
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts() {
  return items;
}

/**
 * Gọi được ở bất cứ đâu, kể cả ngoài component (VD xử lý lỗi API):
 * `toast.success('Đã lưu')`, `toast.error('Sai mật khẩu')`.
 */
export const toast = {
  success: (message: string, duration?: number, motion?: 'fade') => show('success', message, duration, motion),
  error: (message: string, duration?: number) => show('error', message, duration),
  warning: (message: string, duration?: number) => show('warning', message, duration),
  info: (message: string, duration?: number) => show('info', message, duration),
  dismiss: dismissToast,
};
