import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { getErrorMessage } from '@/core/api';
import { ImagePickerField, type PickedImage } from '@/shared/form';
import { Button, Text } from '@/shared/ui';
import { useUploadMedia } from '../hooks/useMedia';
import type { MediaAttachment, UploadContext } from '../types';

export function MediaUploadPanel({
  context,
  onUploaded,
  onBusyChange,
  max = 10,
}: {
  context?: UploadContext;
  onUploaded?: (attachment: MediaAttachment) => void;
  onBusyChange?: (busy: boolean) => void;
  max?: number;
}) {
  const [files, setFiles] = useState<PickedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const active = useRef(false);
  const uploadedCallback = useRef(onUploaded);
  useEffect(() => {
    uploadedCallback.current = onUploaded;
  }, [onUploaded]);
  const upload = useUploadMedia();
  const run = async (only?: number) => {
    if (active.current || max <= 0) return;
    const batch = files
      .filter((file, index) => file.status !== 'done' && (only == null || index === only))
      .slice(0, max);
    active.current = true;
    setUploadError(undefined);
    setBusy(true);
    onBusyChange?.(true);
    const batchContext = { ...context };
    try {
      for (const file of batch) {
        const status = (next: PickedImage['status']) =>
          setFiles((current) =>
            current.map((item) => (item.uri === file.uri ? { ...item, status: next } : item)),
          );
        status('uploading');
        try {
          const attachment = await upload.mutateAsync({ file, context: batchContext });
          status('done');
          uploadedCallback.current?.(attachment);
        } catch (error) {
          status('error');
          setUploadError(getErrorMessage(error));
        }
      }
    } finally {
      active.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  if (!max && !files.length) return null;
  return (
    <View className="gap-3">
      <ImagePickerField
        label="Chọn ảnh từ máy"
        hint={`JPG, PNG, WEBP · tối đa 5 MB/ảnh · ${max} ảnh/lượt`}
        max={max}
        value={files}
        onChange={(next) =>
          setFiles(next.filter((file, index) => next.findIndex((f) => f.uri === file.uri) === index))
        }
        disabled={busy || !max}
        onRetry={(index) => {
          void run(index);
        }}
      />
      {uploadError && files.some((file) => file.status === 'error') && (
        <Text tone="danger" accessibilityRole="alert">
          Tải ảnh thất bại. {uploadError}
        </Text>
      )}
      {max > 0 && files.some((f) => f.status !== 'done') && (
        <Button
          title="Tải ảnh lên kho"
          loading={busy}
          onPress={() => {
            void run();
          }}
        />
      )}
      {!!files.length && files.every((f) => f.status === 'done') && (
        <>
          <Text tone="muted">Đã tải xong. Ảnh nằm trong kho và có thể dùng lại.</Text>
          <Button title="Chọn đợt ảnh khác" variant="ghost" onPress={() => setFiles([])} />
        </>
      )}
    </View>
  );
}
