import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/shared/ui';
import { cn } from '@/shared/utils';

/** Vòng tròn radio. */
export function RadioMark({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <View
      className={cn(
        'h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-subtle bg-surface',
        checked && 'border-primary',
        disabled && 'opacity-50',
      )}>
      {checked && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
    </View>
  );
}

/** Ô vuông checkbox. */
export function CheckMark({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <View
      className={cn(
        'h-[22px] w-[22px] items-center justify-center rounded-md border-2 border-subtle bg-surface',
        checked && 'border-primary bg-primary',
        disabled && 'opacity-50',
      )}>
      {checked && <Icon as={Check} size={14} strokeWidth={3} color="on-primary" />}
    </View>
  );
}
