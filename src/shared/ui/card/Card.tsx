import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';

import { shadowStyle } from '@/shared/theme';
import { tv, type VariantProps } from '@/shared/utils';

const card = tv({
  base: 'rounded-card border border-border bg-surface',
  variants: {
    padding: { none: 'p-0', sm: 'p-2.5 roomy:p-3', md: 'p-3 roomy:p-4', lg: 'p-3 roomy:p-5' },
    pressable: { true: 'active:opacity-80' },
  },
  defaultVariants: { padding: 'md' },
});

type CardBaseProps = VariantProps<typeof card> & { className?: string };

export type CardProps =
  | (ViewProps & CardBaseProps & { onPress?: undefined })
  | (Omit<PressableProps, 'style'> & Pick<ViewProps, 'style'> & CardBaseProps & { onPress: PressableProps['onPress'] });

/** Khung thẻ: nền trắng, bo 16, viền mảnh, bóng nhẹ. Truyền `onPress` để thành thẻ bấm được. */
export function Card({ padding, className, style, ...props }: CardProps) {
  if (props.onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        className={card({ padding, pressable: true, className })}
        style={[shadowStyle.card, style]}
        {...(props as PressableProps)}
      />
    );
  }
  return <View className={card({ padding, className })} style={[shadowStyle.card, style]} {...(props as ViewProps)} />;
}
