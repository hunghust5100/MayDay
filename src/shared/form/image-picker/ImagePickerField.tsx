import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, Images } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { IMAGE_UPLOAD } from '@/shared/constants';
import { useDisclosure } from '@/shared/hooks';
import {
  BottomSheet,
  Icon,
  IconTile,
  ImageThumbnailGrid,
  ImageViewer,
  ListItem,
  Text,
  toast,
  type ImageItem,
} from '@/shared/ui';
import { cn, formatFileSize } from '@/shared/utils';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';

/** Ảnh đã chọn trên máy, sẵn sàng tải lên (multipart). */
export type PickedImage = ImageItem & {
  /** Tên tệp. */
  name: string;
  /** `image/jpeg` | `image/png` | `image/webp`. */
  mimeType: string;
  /** Dung lượng (byte), nếu hệ điều hành cung cấp. */
  size?: number;
};

export type ImagePickerFieldProps = FieldBaseProps & {
  value: readonly PickedImage[] | null | undefined;
  onChange: (value: PickedImage[]) => void;
  /** Số ảnh tối đa (mặc định 10 — giới hạn của API). */
  max?: number;
  /** Bấm "Thử lại" trên ảnh tải lỗi. */
  onRetry?: (index: number) => void;
  columns?: number;
  disabled?: boolean;
};

function guessMimeType(uri: string, fallback?: string | null): string {
  if (fallback) return fallback;
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/** Chọn ảnh từ camera/thư viện, kiểm tra định dạng (jpg/png/webp), dung lượng (≤ 5 MB) và số lượng. */
export function ImagePickerField({
  value,
  onChange,
  max = IMAGE_UPLOAD.maxBatch,
  onRetry,
  columns = 3,
  disabled,
  ...shell
}: ImagePickerFieldProps) {
  const images = value ?? [];
  const sourceSheet = useDisclosure();
  const viewer = useDisclosure();
  const [viewerIndex, setViewerIndex] = useState(0);
  const remaining = max - images.length;

  const accept = (assets: ImagePicker.ImagePickerAsset[]) => {
    const accepted: PickedImage[] = [];
    let rejected = 0;
    for (const asset of assets) {
      const mimeType = guessMimeType(asset.uri, asset.mimeType);
      const tooLarge = asset.fileSize !== undefined && asset.fileSize > IMAGE_UPLOAD.maxFileSize;
      if (!IMAGE_UPLOAD.mimeTypes.includes(mimeType) || tooLarge) {
        rejected++;
        continue;
      }
      accepted.push({
        uri: asset.uri,
        name: asset.fileName ?? `image-${Date.now()}-${accepted.length}.${mimeType.split('/')[1]}`,
        mimeType,
        size: asset.fileSize,
        status: 'idle',
      });
    }
    const kept = accepted.slice(0, remaining);
    if (rejected > 0) {
      toast.warning(
        `Bỏ qua ${rejected} ảnh: chỉ nhận JPG, PNG, WEBP và tối đa ${formatFileSize(IMAGE_UPLOAD.maxFileSize)}/ảnh.`,
      );
    }
    if (accepted.length > kept.length) toast.warning(`Chỉ được chọn tối đa ${max} ảnh.`);
    if (kept.length) onChange([...images, ...kept]);
  };

  const pick = async (source: 'camera' | 'library') => {
    if (disabled || remaining <= 0) return;
    sourceSheet.close();
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.error(
          source === 'camera' ? 'Chưa được cấp quyền dùng camera.' : 'Chưa được cấp quyền truy cập ảnh.',
        );
        return;
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync({
              ...options,
              allowsMultipleSelection: remaining > 1,
              selectionLimit: remaining,
            });
      if (!result.canceled) accept(result.assets);
    } catch {
      toast.error('Không mở được ảnh. Vui lòng thử lại hoặc kiểm tra quyền camera/thư viện.');
    }
  };

  const onAdd = () => {
    // Web không có camera qua expo-image-picker → mở thẳng thư viện.
    if (Platform.OS === 'web') pick('library');
    else sourceSheet.open();
  };

  const addTile =
    remaining > 0 && !disabled ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thêm ảnh"
        onPress={onAdd}
        className={cn(
          'flex-1 items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-primary bg-primary-soft/40 active:opacity-70',
          shell.error && 'border-danger',
        )}
      >
        <Icon as={ImagePlus} size={24} color="primary" />
        <Text variant="tiny" weight="semibold" tone="primary">
          {images.length}/{max}
        </Text>
      </Pressable>
    ) : undefined;

  return (
    <FieldShell {...shell}>
      <ImageThumbnailGrid
        images={images}
        columns={columns}
        trailing={addTile}
        onPress={(index) => {
          setViewerIndex(index);
          viewer.open();
        }}
        onRemove={disabled ? undefined : (index) => onChange(images.filter((_, i) => i !== index))}
        onRetry={onRetry}
      />

      <BottomSheet visible={sourceSheet.isOpen} onClose={sourceSheet.close} title="Thêm ảnh">
        <View>
          <ListItem
            title="Chụp ảnh"
            description="Dùng camera của máy"
            leading={<IconTile icon={Camera} tone="teal" />}
            onPress={() => pick('camera')}
          />
          <ListItem
            title="Chọn từ thư viện"
            description={`Còn chọn được ${remaining} ảnh`}
            leading={<IconTile icon={Images} tone="indigo" />}
            onPress={() => pick('library')}
          />
        </View>
      </BottomSheet>

      <ImageViewer
        visible={viewer.isOpen}
        onClose={viewer.close}
        images={images.map((image) => image.uri)}
        initialIndex={viewerIndex}
      />
    </FieldShell>
  );
}
