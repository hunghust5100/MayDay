import { ApiError, queryClient } from '@/core/api';
import { sameImageSet, syncAnswerImages } from '@/features/media';
import type { ClinicalTemplate, FormActor, FormValues, ImageSelections } from '@/shared/types/clinical-form';
import { canFill, questionVisible } from '@/shared/utils/clinical-form';
import { recordsApi } from './records-api';

/** Remove mappings hidden by branching; never touch another role's section. */
export function visibleRecordImages(
  template: ClinicalTemplate,
  values: FormValues,
  images: ImageSelections,
): ImageSelections {
  const questions = template.sections.flatMap((s) => s.questions);
  return Object.fromEntries(
    questions.map((q) => {
      const selected = values[q.question_id];
      return [
        q.question_id,
        questionVisible(q, values, questions)
          ? (images[q.question_id] ?? []).filter(
              (image) =>
                !image.option_value ||
                (Array.isArray(selected)
                  ? selected.includes(image.option_value)
                  : selected === image.option_value),
            )
          : [],
      ];
    }),
  );
}
export async function saveRecordImages(
  id: number,
  template: ClinicalTemplate,
  values: FormValues,
  images: ImageSelections,
  actor: FormActor,
  current: ImageSelections = {},
) {
  const desired = visibleRecordImages(template, values, images);
  const editable = new Set(
    template.sections
      .filter((s) => canFill(s.filled_by, actor))
      .flatMap((s) => s.questions.map((q) => q.question_id)),
  );
  const changed = [...editable].filter(
    (questionId) => !sameImageSet(desired[questionId], current[questionId]),
  );
  if (!changed.length) return;
  const answers = await recordsApi.answers(id);
  for (const questionId of changed) {
    const answer = answers.find((a) => a.question_id === questionId);
    if (!answer) {
      if (desired[questionId]?.length) throw new ApiError('4008');
      continue;
    }
    await syncAnswerImages(answer.id, desired[questionId] ?? []);
  }
  await queryClient.invalidateQueries({ queryKey: ['media'] });
}
