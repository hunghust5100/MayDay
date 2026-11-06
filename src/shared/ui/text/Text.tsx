import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { tv, type VariantProps } from '@/shared/utils';

const text = tv({
  base: 'font-sans text-base text-text',
  variants: {
    variant: {
      display: 'font-sans-extrabold text-3xl tracking-[-0.6px]',
      h1: 'font-sans-extrabold text-2xl tracking-[-0.5px]',
      h2: 'font-sans-bold text-lg',
      h3: 'font-sans-bold text-md',
      body: 'text-base',
      'body-lg': 'text-md',
      label: 'font-sans-semibold text-base',
      caption: 'text-sm',
      tiny: 'text-xs',
    },
    tone: {
      default: 'text-text',
      muted: 'text-muted',
      subtle: 'text-subtle',
      primary: 'text-primary-strong',
      success: 'text-success-strong',
      warning: 'text-warning-strong',
      danger: 'text-danger',
      inverse: 'text-on-primary',
    },
    weight: {
      regular: 'font-sans',
      medium: 'font-sans-medium',
      semibold: 'font-sans-semibold',
      bold: 'font-sans-bold',
      extrabold: 'font-sans-extrabold',
    },
    align: { left: 'text-left', center: 'text-center', right: 'text-right' },
  },
  defaultVariants: { variant: 'body', tone: 'default' },
});

export type TextVariant = NonNullable<VariantProps<typeof text>['variant']>;
export type TextTone = NonNullable<VariantProps<typeof text>['tone']>;

export type TextProps = RNTextProps & VariantProps<typeof text> & { className?: string };

/**
 * Chữ chuẩn của ứng dụng (font Be Vietnam Pro).
 * Độ đậm đổi bằng `weight` (đổi file font), không dùng `font-bold` vì font tùy biến không tự in đậm trên Android.
 */
export function Text({ variant, tone, weight, align, className, ...props }: TextProps) {
  return <RNText className={text({ variant, tone, weight, align, className })} {...props} />;
}
