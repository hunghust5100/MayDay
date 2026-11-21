import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSession } from '@/core/auth';
import {
  Button,
  ContentModal,
  EmptyState,
  ErrorState,
  ImageThumbnailGrid,
  ImageViewer,
  Spinner,
  Text,
} from '@/shared/ui';
import type { ImageSelection } from '@/shared/types/clinical-form';
import { useMedia } from '../hooks/useMedia';
import type { UploadContext } from '../types';
import { MediaUploadPanel } from './MediaUploadPanel';

export function AttachmentPicker({
  value,
  onChange,
  label = 'Ảnh đính kèm',
  disabled = false,
  context,
  max = 10,
}: {
  value: ImageSelection[];
  onChange: (value: ImageSelection[]) => void;
  label?: string;
  disabled?: boolean;
  context?: UploadContext;
  max?: number;
}) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const library = useMedia(open && !disabled ? user?.user_id : undefined);
  const [viewer, setViewer] = useState<number | null>(null);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const add = (image: ImageSelection) => {
    const next = [...latest.current.filter((v) => v.attachment_id !== image.attachment_id), image].slice(
      0,
      max,
    );
    latest.current = next;
    onChange(next);
  };
  const items = (library.data ?? []).filter(
    (a) =>
      a.file_type.startsWith('image/') &&
      (!context?.medical_record_id ||
        a.medical_record_id == null ||
        a.medical_record_id === context.medical_record_id),
  );
  return (
    <View className="gap-2">
      <Text weight="semibold">{label}</Text>
      {!!value.length && (
        <ImageThumbnailGrid
          images={value.map((a) => ({ uri: a.file_url, key: a.attachment_id }))}
          onPress={setViewer}
          onRemove={disabled ? undefined : (index) => onChange(value.filter((_, i) => i !== index))}
        />
      )}
      {!value.length && disabled && <Text tone="muted">Chưa có ảnh.</Text>}
      {!disabled && (
        <Button
          title={value.length ? `Chọn ảnh (${value.length}/${max})` : 'Chọn hoặc tải ảnh'}
          variant="soft"
          disabled={value.length >= max}
          onPress={() => setOpen(true)}
        />
      )}
      <ImageViewer
        visible={viewer !== null}
        images={value.map((a) => a.file_url)}
        initialIndex={viewer ?? 0}
        onClose={() => setViewer(null)}
      />
      <ContentModal visible={open} title={label} onClose={() => setOpen(false)}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
        >
          <MediaUploadPanel
            context={context}
            max={max}
            onUploaded={(a) => {
              if (latest.current.length < max)
                add({ attachment_id: a.id, file_url: a.file_url, file_name: a.file_name });
            }}
          />
          <Text variant="h3">Chọn ảnh đã tải lên</Text>
          {library.isLoading ? (
            <Spinner />
          ) : library.isError ? (
            <ErrorState onRetry={() => library.refetch()} />
          ) : !items.length ? (
            <EmptyState title="Kho ảnh trống" />
          ) : (
            <>
              <ImageThumbnailGrid
                images={items.map((a) => ({ uri: a.file_url, key: a.id }))}
                onPress={(index) => {
                  const a = items[index];
                  add({ attachment_id: a.id, file_url: a.file_url, file_name: a.file_name });
                  setOpen(false);
                }}
              />
              <Text tone="muted">Chạm ảnh để chọn. Việc gỡ lựa chọn không xóa tệp gốc.</Text>
            </>
          )}
          <Button title="Xong" onPress={() => setOpen(false)} />
        </ScrollView>
      </ContentModal>
    </View>
  );
}
