import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { FieldShell } from '@/shared/form';
import { Button, ImageThumbnailGrid, ImageViewer, Text, type ImageItem } from '@/shared/ui';

/** Preview only: no upload and no medical-record file/count limits imposed on this contract. */
export function PreviewImageField({ value, onChange, required, label, error }: {
  value: ImageItem[]; onChange: (images: ImageItem[]) => void; required: boolean; label: string; error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [pickerError, setPickerError] = useState<string>();
  const [viewing, setViewing] = useState<number | null>(null);
  const pick = async (camera: boolean) => {
    if (busy) return;
    setBusy(true); setPickerError(undefined);
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
        setPickerError('Chưa được cấp quyền camera. Hãy cấp quyền trong cài đặt hoặc chọn ảnh từ thư viện.'); return;
      }
      const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 0 });
      if (!result.canceled) onChange([...value, ...result.assets.map((asset, i) => ({ uri: asset.uri, key: `${Date.now()}-${i}`, status: 'idle' as const }))]);
    } catch { setPickerError('Chưa mở được ảnh. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  return <FieldShell label={label} required={required} error={error ?? pickerError}>
    <View className="gap-3">
      <Text variant="caption" tone="muted">{value.length} ảnh đã chọn</Text>
      <ImageThumbnailGrid images={value} onRemove={(index) => onChange(value.filter((_, i) => i !== index))} onPress={setViewing} />
      <Button title="Chọn ảnh xem thử" variant="outline" leftIcon={ImagePlus} loading={busy} onPress={() => pick(false)} />
      {Platform.OS !== 'web' && <Button title="Chụp ảnh xem thử" variant="soft" leftIcon={Camera} disabled={busy} onPress={() => pick(true)} />}
      {viewing !== null && <ImageViewer visible images={value.map((image) => image.uri)} initialIndex={viewing} onClose={() => setViewing(null)} />}
    </View>
  </FieldShell>;
}
