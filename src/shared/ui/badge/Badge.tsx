import { View } from 'react-native';

import { MEDICAL_RECORD_STATUS } from '@/shared/constants';
import type { MedicalRecordStatus, Tone } from '@/shared/types';
import { tv } from '@/shared/utils';

import { Text } from '../text/Text';

const badge = tv({
  slots: {
    base: 'h-[26px] flex-row items-center gap-1.5 self-start rounded-full px-2.5',
    dot: 'h-1.5 w-1.5 rounded-full',
    label: 'font-sans-semibold text-xs',
  },
  variants: {
    tone: {
      neutral: { base: 'bg-neutral-soft', dot: 'bg-neutral-strong', label: 'text-neutral-strong' },
      primary: { base: 'bg-primary-soft', dot: 'bg-primary-strong', label: 'text-primary-strong' },
      success: { base: 'bg-success-soft', dot: 'bg-success-strong', label: 'text-success-strong' },
      warning: { base: 'bg-warning-soft', dot: 'bg-warning-strong', label: 'text-warning-strong' },
      danger: { base: 'bg-danger-soft', dot: 'bg-danger-strong', label: 'text-danger-strong' },
      info: { base: 'bg-info-soft', dot: 'bg-info-strong', label: 'text-info-strong' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type BadgeProps = {
  label: string;
  tone?: Tone;
  /** Chấm tròn phía trước nhãn (mặc định có). */
  dot?: boolean;
  className?: string;
};

export function Badge({ label, tone = 'neutral', dot = true, className }: BadgeProps) {
  const styles = badge({ tone });
  return (
    <View className={styles.base({ className })}>
      {dot && <View className={styles.dot()} />}
      <Text className={styles.label()}>{label}</Text>
    </View>
  );
}

/** Nhãn trạng thái bệnh án — tự chọn màu và nhãn tiếng Việt. */
export function StatusBadge({ status, className }: { status: MedicalRecordStatus; className?: string }) {
  const { label, tone } = MEDICAL_RECORD_STATUS[status];
  return <Badge label={label} tone={tone} className={className} />;
}
