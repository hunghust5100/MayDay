import { useState } from 'react';
import { View } from 'react-native';

import { CheckboxGroup, DateField, RadioGroup, TextField } from '@/shared/form';
import { AppHeader, Button, Card, Screen, Text, type ImageItem } from '@/shared/ui';

import type { TemplateDetail, TemplateQuestion } from '../types';
import { evaluateBranching, previewErrors, requiresTriggeredImage, type Answer, type Answers } from '../utils/branching';
import { byOrder, FILLED_BY_LABELS, questionTree } from '../utils/tree';
import { PreviewImageField } from './PreviewImageField';

function PreviewQuestion({ question: q, answer, onChange, images, onImages, error }: {
  question: TemplateQuestion; answer: Answer | undefined; onChange: (value: Answer) => void;
  images: ImageItem[]; onImages: (images: ImageItem[]) => void; error?: string;
}) {
  const [numberText, setNumberText] = useState(answer == null ? '' : String(answer));
  const scalar = typeof answer === 'string' || typeof answer === 'number' ? String(answer) : '';
  const props = { label: q.question_text, required: q.is_required === 1, hint: q.help_text || undefined, error };
  const options = byOrder(q.options).map((o) => ({ value: o.option_value, label: o.option_text, description: o.trigger_image_upload === 1 ? 'Bắt buộc có ảnh khi chọn' : undefined }));
  const triggered = requiresTriggeredImage(q, answer);
  return <View className="gap-3 border-t border-border pt-4">
    {q.type_question === 'text' && <TextField {...props} value={scalar} onChange={onChange} placeholder={q.placeholder ?? undefined} multiline />}
    {q.type_question === 'number' && <TextField {...props} value={numberText} keyboardType="numbers-and-punctuation" placeholder={q.placeholder ?? undefined}
      onChange={(text) => { setNumberText(text); const n = Number(text.replace(',', '.')); onChange(text.trim() === '' ? null : Number.isFinite(n) ? n : text); }}
      error={numberText.trim() !== '' && !Number.isFinite(Number(numberText.replace(',', '.'))) ? 'Vui lòng nhập một số hợp lệ.' : error} />}
    {q.type_question === 'date' && <DateField {...props} presentation="dialog" value={scalar} onChange={onChange} placeholder={q.placeholder ?? undefined} />}
    {q.type_question === 'radio' && <RadioGroup {...props} options={options} value={scalar} onChange={onChange} />}
    {q.type_question === 'checkbox' && <CheckboxGroup {...props} options={options} value={Array.isArray(answer) ? answer : []} onChange={onChange} />}
    {q.type_question === 'image_upload' && Boolean(q.help_text) && <Text tone="muted">{q.help_text}</Text>}
    {(q.type_question === 'image_upload' || q.allow_image === 1 || triggered) && <PreviewImageField
      label={q.type_question === 'image_upload' ? q.question_text : triggered ? 'Tải ảnh lên — bắt buộc theo lựa chọn' : 'Ảnh đính kèm (tùy chọn)'}
      required={triggered || (q.type_question === 'image_upload' && q.is_required === 1)} value={images} onChange={onImages} error={error} />}
  </View>;
}

export function TemplatePreview({ template, onClose }: { template: TemplateDetail; onClose: () => void }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [images, setImages] = useState<Record<string, ImageItem[]>>({});
  const [checked, setChecked] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const result = evaluateBranching(template, answers);
  const errors = previewErrors(template, answers, Object.fromEntries(Object.entries(images).map(([id, items]) => [id, items.length])));
  const change = (id: string, value: Answer) => {
    const next = { ...answers, [id]: value };
    const evaluated = evaluateBranching(template, next);
    setAnswers(evaluated.answers);
    const questions = template.sections.flatMap((section) => section.questions);
    setImages(Object.fromEntries(Object.entries(images).filter(([key]) => {
      const q = questions.find((question) => question.question_id === key);
      return evaluated.visible[key] && q && (q.type_question === 'image_upload' || q.allow_image === 1 || requiresTriggeredImage(q, next[key]));
    })));
  };
  return <Screen header={<AppHeader title="Xem thử mẫu phiếu" onBack={onClose} />} contentClassName="gap-4">
    <Text variant="h2">{template.name}</Text>
    <Text tone="muted">Câu trả lời và ảnh thử không được lưu.</Text>
    <Button title="Xóa câu trả lời thử" variant="outline" onPress={() => { setAnswers({}); setImages({}); setChecked(false); setResetKey((v) => v + 1); }} />
    {!template.sections.length && <Text tone="muted">Mẫu chưa có nội dung để xem thử.</Text>}
    {byOrder(template.sections).map((section) => <Card key={section.section_id} className="gap-3">
      <Text variant="h3">{section.title}</Text>
      <Text variant="caption" tone="muted">{FILLED_BY_LABELS[section.filled_by]} · {section.is_required === 1 ? 'Phần bắt buộc' : 'Phần không bắt buộc'}</Text>
      {questionTree(section.questions).filter(({ question }) => result.visible[question.question_id]).map(({ question }) => <PreviewQuestion
        key={`${resetKey}-${question.question_id}`} question={question} answer={answers[question.question_id]} onChange={(value) => change(question.question_id, value)}
        images={images[question.question_id] ?? []} onImages={(value) => setImages({ ...images, [question.question_id]: value })} error={checked ? errors[question.question_id] : undefined} />)}
      {section.questions.length > 0 && !section.questions.some((q) => result.visible[q.question_id]) && <Text tone="muted">Chưa có câu hỏi thỏa điều kiện hiển thị.</Text>}
    </Card>)}
    <Button title="Kiểm tra câu trả lời thử" onPress={() => setChecked(true)} />
    {checked && <Text accessibilityRole="alert" tone={Object.keys(errors).length ? 'danger' : 'primary'}>{Object.keys(errors).length ? `Còn ${Object.keys(errors).length} câu cần trả lời hoặc bổ sung ảnh.` : 'Các câu đang hiển thị đã đủ thông tin bắt buộc.'}</Text>}
  </Screen>;
}
