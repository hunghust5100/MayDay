import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { View } from 'react-native';
import type { z } from 'zod';

import { FormField, MultiSelectField, NumberField, SelectField, SwitchField, TextField, useZodForm } from '@/shared/form';
import { Button, ConfirmDialog, Text } from '@/shared/ui';

import { questionSchemaForTemplate, type questionSchema } from '../schemas';
import type { TemplateDetail, TemplateQuestion, TemplateSection } from '../types';
import { QUESTION_LABELS } from '../utils/tree';
import { newContentCode, QUESTION_FIELD_LABELS } from '../utils/rule-editor';
import { BranchingRuleEditor, parseRulesDraft, rulesToDraft } from './BranchingRuleEditor';
import { OptionEditor } from './OptionEditor';

export type QuestionValues = z.output<typeof questionSchema>;

export function QuestionForm({ template, section, initial, loading, errorMessage, onSubmit, onCancel }: {
  template: TemplateDetail; section: TemplateSection; initial?: TemplateQuestion; loading: boolean; errorMessage?: string;
  onSubmit: (values: QuestionValues) => void; onCancel: () => void;
}) {
  const [questionId] = useState(() => initial?.question_id ?? newContentCode('Q'));
  const [rules, setRules] = useState(() => rulesToDraft(initial?.condition_rules));
  const [ruleError, setRuleError] = useState<string>();
  const [confirming, setConfirming] = useState<QuestionValues | null>(null);
  const form = useZodForm(questionSchemaForTemplate(template, section.section_id, initial?.question_id), { defaultValues: {
    question_id: questionId, question_text: initial?.question_text ?? '', type_question: initial?.type_question ?? 'text',
    order: initial?.order ?? Math.max(0, ...section.questions.map((q) => q.order)) + 1,
    placeholder: initial?.placeholder ?? '', help_text: initial?.help_text ?? '', is_required: initial?.is_required ?? 0,
    allow_image: initial?.allow_image ?? 0, parent_question_id: initial?.parent_question_id ?? null,
    show_if_answer: initial?.show_if_answer ?? null, condition_rules: initial?.condition_rules ?? null, options: initial?.options ?? [],
  } });
  const values = useWatch({ control: form.control });
  const options = useWatch({ control: form.control, name: 'options' });
  const parent = section.questions.find((q) => q.question_id === values.parent_question_id);
  const choices = values.type_question === 'radio' || values.type_question === 'checkbox';
  const submit = () => {
    if (loading) return;
    try { form.setValue('condition_rules', parseRulesDraft(rules, template.sections.flatMap((s) => s.questions))); setRuleError(undefined); }
    catch (error) { setRuleError(error instanceof Error ? error.message : 'Vui lòng kiểm tra lại điều kiện hiển thị.'); return; }
    void form.handleSubmit((data) => {
      const destructive = initial && (data.type_question !== initial.type_question || initial.options.some((o) => !data.options.some((n) => n.id === o.id)));
      if (destructive) setConfirming(data); else onSubmit(data);
    })();
  };
  const errors = form.formState.errors;
  return <View className="gap-4">
    <Text tone="muted">Phần: {section.title}</Text>
    <FormField control={form.control} name="question_id" render={(field) => (
      <TextField
        {...field}
        label="Mã câu hỏi"
        required
        maxLength={50}
        disabled={Boolean(initial) || loading}
        placeholder="VD: Q_ITCH"
        autoCapitalize="characters"
        autoCorrect={false}
        hint="Chữ in hoa, số và dấu gạch dưới. Mã không thể đổi sau khi tạo."
      />
    )} />
    <FormField control={form.control} name="question_text" render={(field) => <TextField {...field} label="Nội dung câu hỏi" required disabled={loading} multiline />} />
    <FormField control={form.control} name="type_question" render={(field) => <SelectField {...field} presentation="dialog" label="Loại câu hỏi" disabled={loading}
      options={Object.entries(QUESTION_LABELS).map(([value, label]) => ({ value: value as TemplateQuestion['type_question'], label }))}
      onChange={(type) => {
        field.onChange(type);
        if (!['radio', 'checkbox'].includes(type)) form.setValue('options', []);
      }} />} />
    <FormField control={form.control} name="order" render={(field) => <NumberField {...field} onChange={(v) => field.onChange(v ?? 0)} label="Thứ tự câu hỏi" required disabled={loading} />} />
    <FormField control={form.control} name="placeholder" render={(field) => <TextField {...field} label="Gợi ý nhập liệu" disabled={loading} />} />
    <FormField control={form.control} name="help_text" render={(field) => <TextField {...field} label="Giải thích thêm" disabled={loading} multiline />} />
    <FormField control={form.control} name="is_required" render={({ value, onChange }) => <SwitchField label="Câu hỏi bắt buộc" value={value === 1} onChange={(v) => onChange(v ? 1 : 0)} disabled={loading} />} />
    <FormField control={form.control} name="allow_image" render={({ value, onChange }) => <SwitchField label="Cho phép đính kèm ảnh" value={value === 1} onChange={(v) => onChange(v ? 1 : 0)} disabled={loading} />} />
    {choices && <OptionEditor value={options} onChange={(v) => form.setValue('options', v.map((o) => ({ ...o, trigger_image_upload: o.trigger_image_upload ?? 0 })))} disabled={loading} />}
    <Text variant="h3">Rẽ nhánh</Text>
    <FormField control={form.control} name="parent_question_id" render={({ value, onChange, error }) => <SelectField presentation="dialog" label="Câu hỏi cha" error={error} value={value ?? ''} disabled={loading}
      options={[{ value: '', label: 'Không có câu cha' }, ...section.questions.filter((q) => q.question_id !== initial?.question_id).map((q) => ({ value: q.question_id, label: q.question_text }))]}
      onChange={(id) => { onChange(id || null); form.setValue('show_if_answer', null); }} />} />
    <SwitchField label="Hiện theo đáp án câu cha" value={values.show_if_answer != null} disabled={loading || !parent || !['radio', 'checkbox'].includes(parent.type_question)}
      onChange={(v) => form.setValue('show_if_answer', v ? { option_values: [] } : null)} />
    {values.show_if_answer != null && <MultiSelectField presentation="dialog" label="Đáp án để hiện câu con" value={values.show_if_answer.option_values ?? []} disabled={loading}
      options={(parent?.options ?? []).map((o) => ({ value: o.option_value, label: o.option_text }))}
      onChange={(option_values) => form.setValue('show_if_answer', { option_values })} />}
    <BranchingRuleEditor value={rules} onChange={(value) => { setRules(value); setRuleError(undefined); }} questions={template.sections.flatMap((s) => s.questions).filter((q) => q.question_id !== initial?.question_id)} disabled={loading} />
    {Object.entries(errors).map(([key, error]) => <Text key={key} tone="danger" accessibilityRole="alert">{QUESTION_FIELD_LABELS[key] ?? 'Thông tin câu hỏi'}: {error?.message ? String(error.message) : 'Vui lòng kiểm tra các thông tin trong mục này.'}</Text>)}
    {Boolean(ruleError) && <Text tone="danger" accessibilityRole="alert">{ruleError}</Text>}
    {Boolean(errorMessage) && <Text tone="danger" accessibilityRole="alert">{errorMessage}</Text>}
    <Button title="Lưu câu hỏi" loading={loading} onPress={submit} />
    <Button title="Hủy chỉnh sửa" variant="ghost" disabled={loading} onPress={onCancel} />
    <ConfirmDialog visible={confirming !== null} title="Thay đổi cấu trúc câu hỏi?" destructive
      description="Đổi loại hoặc bỏ lựa chọn có thể làm mất lựa chọn cũ. Nếu mẫu đã được dùng trong bệnh án, bạn cần tạo mẫu mới để giữ nguyên dữ liệu đã ghi nhận."
      confirmLabel="Lưu thay đổi cấu trúc" onCancel={() => setConfirming(null)} onConfirm={() => {
        if (confirming) onSubmit(confirming); setConfirming(null);
      }} />
  </View>;
}
