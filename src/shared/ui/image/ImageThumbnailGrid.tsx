import { Image } from 'expo-image';
import { RotateCw, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { cn } from '@/shared/utils';

import { Icon } from '../icon/Icon';
import { ProgressBar } from '../progress-bar/ProgressBar';
import { Text } from '../text/Text';
import type { ImageItem } from './types';

export type ImageThumbnailGridProps = {
  images: readonly ImageItem[];
  /** Số cột (mặc định 3). */
  columns?: number;
  /** Bấm vào ảnh — thường mở ImageViewer. */
  onPress?: (index: number) => void;
  /** Có thì hiện nút xóa góc trên phải. */
  onRemove?: (index: number) => void;
  /** Có thì ảnh lỗi hiện nút "Thử lại". */
  onRetry?: (index: number) => void;
  /** Ô thêm vào cuối lưới (VD nút "Thêm ảnh"). */
  trailing?: ReactNode;
  className?: string;
};

/** Lưới ảnh vuông thu nhỏ, có trạng thái đang tải / lỗi. */
export function ImageThumbnailGrid({
  images,
  columns = 3,
  onPress,
  onRemove,
  onRetry,
  trailing,
  className,
}: ImageThumbnailGridProps) {
  const cellStyle = { width: `${100 / columns}%` as const };

  return (
    <View className={cn('-m-1 flex-row flex-wrap', className)}>
      {images.map((image, index) => (
        <View key={image.key ?? image.uri} className="aspect-square p-1" style={cellStyle}>
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={`Ảnh ${index + 1}`}
            disabled={!onPress}
            onPress={() => onPress?.(index)}
            className="flex-1 overflow-hidden rounded-xl bg-surface-2">
            <Image source={{ uri: image.uri }} style={{ flex: 1 }} contentFit="cover" transition={150} />

            {image.status === 'uploading' && (
              <View className="absolute inset-0 items-center justify-center gap-2 bg-text/40 px-3">
                <ActivityIndicator color="#FFFFFF" />
                {image.progress !== undefined && <ProgressBar value={image.progress} className="w-full" />}
              </View>
            )}
            {image.status === 'error' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tải lại ảnh"
                disabled={!onRetry}
                onPress={() => onRetry?.(index)}
                className="absolute inset-0 items-center justify-center gap-1 bg-danger/70">
                <Icon as={RotateCw} size={20} color="on-primary" />
                <Text variant="tiny" weight="semibold" tone="inverse">
                  {onRetry ? 'Thử lại' : 'Lỗi'}
                </Text>
              </Pressable>
            )}
          </Pressable>

          {onRemove && image.status !== 'uploading' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Xóa ảnh ${index + 1}`}
              hitSlop={8}
              onPress={() => onRemove(index)}
              className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-text/60">
              <Icon as={X} size={14} strokeWidth={2.5} color="on-primary" />
            </Pressable>
          )}
        </View>
      ))}
      {trailing && (
        <View className="aspect-square p-1" style={cellStyle}>
          {trailing}
        </View>
      )}
    </View>
  );
}
