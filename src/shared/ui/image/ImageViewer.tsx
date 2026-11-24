import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../icon/Icon';
import { Text } from '../text/Text';

export type ImageViewerProps = {
  visible: boolean;
  onClose: () => void;
  images: readonly string[];
  initialIndex?: number;
  /** Chú thích theo từng ảnh (VD mốc "Khởi phát · 02/11"). */
  captions?: readonly (string | undefined)[];
};

/** Xem ảnh toàn màn hình, vuốt ngang qua lại. */
export function ImageViewer({ visible, onClose, images, initialIndex = 0, captions }: ImageViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const list = useRef<FlatList<string>>(null);
  const move = (offset: number) => {
    const next = index + offset;
    if (next < 0 || next >= images.length) return;
    list.current?.scrollToIndex({ index: next });
    setIndex(next);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => setIndex(initialIndex)}>
      <View className="flex-1 bg-black">
        <FlatList
          ref={list}
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onScroll={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width);
            if (page >= 0 && page < images.length) setIndex(page);
          }}
          scrollEventThrottle={32}
          renderItem={({ item }) => (
            <View style={{ width, height }}>
              <Image source={{ uri: item }} style={{ flex: 1 }} contentFit="contain" />
            </View>
          )}
        />

        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}>
          <Text weight="semibold" tone="inverse">
            {images.length > 1 ? `${index + 1} / ${images.length}` : ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            onPress={onClose}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <Icon as={X} size={22} color="on-primary" />
          </Pressable>
        </View>

        {images.length > 1 && (
          <View pointerEvents="box-none" className="absolute left-3 right-3 flex-row justify-between" style={{ top: '46%' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ảnh trước"
              disabled={index === 0}
              onPress={() => move(-1)}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/70 disabled:opacity-40">
              <Icon as={ChevronLeft} size={24} color="on-primary" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ảnh tiếp theo"
              disabled={index >= images.length - 1}
              onPress={() => move(1)}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/70 disabled:opacity-40">
              <Icon as={ChevronRight} size={24} color="on-primary" />
            </Pressable>
          </View>
        )}

        {captions?.[index] && (
          <View className="absolute left-4 right-4 items-center" style={{ bottom: insets.bottom + 24 }}>
            <View className="rounded-full bg-white/15 px-4 py-2">
              <Text weight="medium" tone="inverse">
                {captions[index]}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
