import { Pencil, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Badge, Button, Card, IconButton, Text } from '@/shared/ui';

import type { TemplateDetail, TemplateQuestion, TemplateSection } from '../types';
import { describeRule } from '../utils/rule-editor';
import { byOrder, FILLED_BY_LABELS, QUESTION_LABELS, questionTree } from '../utils/tree';

export function TemplateTree({
  template,
  onSection,
  onQuestion,
  onDeleteSection,
  onDeleteQuestion,
}: {
  template: TemplateDetail;
  onSection: (section?: TemplateSection) => void;
  onQuestion: (section: TemplateSection, question?: TemplateQuestion) => void;
  onDeleteSection: (section: TemplateSection) => void;
  onDeleteQuestion: (section: TemplateSection, question: TemplateQuestion) => void;
}) {
  const questions = template.sections.flatMap((section) => section.questions);
  return (
    <View className="mt-5 gap-3">
      <Text variant="h2">Nội dung mẫu phiếu</Text>
      <Button title="Thêm phần" variant="soft" onPress={() => onSection()} />
      {!template.sections.length && <Text tone="muted">Thêm phần để bắt đầu.</Text>}
      {byOrder(template.sections).map((section, sectionIndex) => (
        <Card key={section.section_id} className="gap-3">
          <View className="flex-row items-start gap-2">
            <Text variant="h3" className="flex-1">
              {sectionIndex + 1}. {section.title}
            </Text>
            <IconButton
              icon={Pencil}
              variant="ghost"
              accessibilityLabel={`Sửa phần ${section.title}`}
              onPress={() => onSection(section)}
            />
            <IconButton
              icon={Trash2}
              variant="ghost"
              accessibilityLabel={`Xóa phần ${section.title}`}
              onPress={() => onDeleteSection(section)}
            />
          </View>
          <Text variant="caption" tone="muted">
            {FILLED_BY_LABELS[section.filled_by]} ·{' '}
            {section.is_required === 1 ? 'Bắt buộc' : 'Không bắt buộc'} · {section.questions.length} câu hỏi
          </Text>
          {questionTree(section.questions).map(({ question: q, depth }, questionIndex) => {
            const parent = section.questions.find((item) => item.question_id === q.parent_question_id);
            const answers = q.show_if_answer?.option_values.map(
              (value) =>
                parent?.options.find((o) => o.option_value === value)?.option_text ??
                'Lựa chọn không còn tồn tại',
            );
            return (
              <View
                key={q.question_id}
                className="gap-2 border-t border-border pt-4"
                style={{ marginLeft: Math.min(depth, 2) * 6 }}
              >
                <View className="flex-row items-start gap-1">
                  <Text weight="semibold" className="flex-1">
                    {questionIndex + 1}. {q.question_text}
                  </Text>
                  <IconButton
                    icon={Pencil}
                    variant="ghost"
                    accessibilityLabel={`Sửa câu ${q.question_text}`}
                    onPress={() => onQuestion(section, q)}
                  />
                  <IconButton
                    icon={Trash2}
                    variant="ghost"
                    accessibilityLabel={`Xóa câu ${q.question_text}`}
                    onPress={() => onDeleteQuestion(section, q)}
                  />
                </View>
                <View className="flex-row flex-wrap gap-2">
                  <Badge label={QUESTION_LABELS[q.type_question]} tone="info" />
                  {q.is_required === 1 && <Badge label="Bắt buộc" tone="warning" />}
                  {q.allow_image === 1 && <Badge label="Cho phép ảnh" tone="primary" />}
                </View>
                {Boolean(q.parent_question_id) && (
                  <Text variant="caption" tone="muted">
                    Theo câu hỏi: {parent?.question_text ?? 'Câu hỏi không còn tồn tại'}
                  </Text>
                )}
                {answers && (
                  <Text variant="caption">Hiện khi chọn: {answers.join(', ') || 'Chưa chọn đáp án'}</Text>
                )}
                {q.condition_rules != null && (
                  <View className="gap-1">
                    <Text variant="caption" weight="semibold">
                      {q.condition_rules.logic === 'AND'
                        ? 'Khi đủ các điều kiện:'
                        : 'Khi có một điều kiện đúng:'}
                    </Text>
                    {q.condition_rules.rules.map((rule, i) => (
                      <Text key={i} variant="caption">
                        {describeRule(rule, questions)}
                      </Text>
                    ))}
                  </View>
                )}
                {byOrder(q.options).map((option, optionIndex) => (
                  <Text key={option.id} variant="caption" tone="muted">
                    {optionIndex + 1}. {option.option_text}
                    {option.trigger_image_upload === 1 ? ' · Yêu cầu ảnh khi chọn' : ''}
                  </Text>
                ))}
              </View>
            );
          })}
          <Button
            title="Thêm câu hỏi"
            accessibilityLabel={`Thêm câu hỏi vào ${section.title}`}
            variant="outline"
            fullWidth
            onPress={() => onQuestion(section)}
          />
        </Card>
      ))}
    </View>
  );
}
