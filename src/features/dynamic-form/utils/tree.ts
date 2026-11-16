import type { TemplateQuestion } from '../types';

export const byOrder = <T extends { order: number }>(items: readonly T[]) => [...items].sort((a, b) => a.order - b.order);

/** API returns a flat list. Keep every question visible, even for malformed/orphan trees. */
export function questionTree(questions: readonly TemplateQuestion[]) {
  const ordered = byOrder(questions);
  const ids = new Set(ordered.map((q) => q.question_id));
  const children = new Map<string, TemplateQuestion[]>();
  for (const q of ordered) {
    if (!q.parent_question_id) continue;
    children.set(q.parent_question_id, [...(children.get(q.parent_question_id) ?? []), q]);
  }
  const result: { question: TemplateQuestion; depth: number }[] = [];
  const visited = new Set<string>();
  const visit = (root: TemplateQuestion) => {
    const stack = [{ question: root, depth: 0 }];
    while (stack.length) {
      const node = stack.pop()!;
      if (visited.has(node.question.question_id)) continue;
      visited.add(node.question.question_id);
      result.push(node);
      const descendants = children.get(node.question.question_id) ?? [];
      for (let i = descendants.length - 1; i >= 0; i--) stack.push({ question: descendants[i], depth: node.depth + 1 });
    }
  };
  ordered.filter((q) => !q.parent_question_id || !ids.has(q.parent_question_id)).forEach(visit);
  ordered.forEach(visit);
  return result;
}

export function descendantIds(questions: readonly TemplateQuestion[], id: string) {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of questions) {
      if (q.parent_question_id && ids.has(q.parent_question_id) && !ids.has(q.question_id)) {
        ids.add(q.question_id); changed = true;
      }
    }
  }
  return ids;
}

export const QUESTION_LABELS = {
  text: 'Văn bản', number: 'Số', date: 'Ngày', radio: 'Chọn một', checkbox: 'Chọn nhiều', image_upload: 'Ảnh',
};
export const FILLED_BY_LABELS = { patient: 'Bệnh nhân', doctor: 'Bác sĩ', patdoc: 'Bệnh nhân và bác sĩ' };
