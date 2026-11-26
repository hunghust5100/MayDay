import type { ImageSelections } from '@/shared/types/clinical-form';
import { mediaApi } from './media-api';

/** Reconcile mappings, never delete the original media file. Retry is safe after partial success. */
export async function syncAnswerImages(answerId: number, desired: ImageSelections[string]) {
  const existing = await mediaApi.answerImages(answerId);
  const same = (
    attachmentId: string,
    option: string | null | undefined,
    otherId: string,
    otherOption: string | null | undefined,
  ) => attachmentId === otherId && (option || null) === (otherOption || null);
  for (const link of existing)
    if (
      !desired.some((d) =>
        same(d.attachment_id, d.option_value, link.attachment.attachment_id, link.option_value),
      )
    )
      await mediaApi.detach(link.id);
  for (const item of desired)
    if (
      !existing.some((link) =>
        same(item.attachment_id, item.option_value, link.attachment.attachment_id, link.option_value),
      )
    ) {
      await mediaApi.attach({
        answer_id: String(answerId),
        attachment_id: item.attachment_id,
        option_value: item.option_value ?? null,
      });
    }
}

export function sameImageSet(a: ImageSelections[string] = [], b: ImageSelections[string] = []) {
  return (
    a.length === b.length &&
    a.every((left) =>
      b.some(
        (right) =>
          left.attachment_id === right.attachment_id &&
          (left.option_value || null) === (right.option_value || null),
      ),
    )
  );
}
