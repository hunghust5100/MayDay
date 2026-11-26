import { View } from 'react-native';
import type { ReactNode } from 'react';
import { CheckboxGroup, DateField, NumberField, RadioGroup, TextField } from '@/shared/form';
import { Text } from '@/shared/ui';
import { formatDate } from '@/shared/utils';
import type { ClinicalTemplate, FormActor, FormQuestion, FormValues } from '@/shared/types/clinical-form';
import { canFill, isRequired, ordered, questionVisible } from '../utils/form';

export function ClinicalForm({
  template,
  values,
  onChange,
  actor,
  errors = {},
  renderAttachments,
}: {
  template: ClinicalTemplate;
  values: FormValues;
  onChange: (values: FormValues) => void;
  actor: FormActor;
  errors?: Record<string, string>;
  renderAttachments?: (question: FormQuestion, editable: boolean) => ReactNode;
}) {
  const allQuestions = template.sections.flatMap((s) => s.questions);
  return (
    <View className="gap-5">
      {ordered(template.sections).map((section) => (
        <View key={section.section_id} className="gap-4">
          <Text variant="h3">{section.title}</Text>
          {ordered(section.questions)
            .filter((q) => questionVisible(q, values, allQuestions))
            .map((q) => {
              const value = values[q.question_id];
              const editable = canFill(section.filled_by, actor);
              const props = {
                label: q.question_text,
                required: isRequired(q.is_required),
                hint: q.help_text,
                error: errors[q.question_id],
              };
              const set = (next: FormValues[string]) => onChange({ ...values, [q.question_id]: next });
              const options = ordered(q.options ?? []).map((o) => ({
                value: o.option_value,
                label: o.option_text,
              }));
              const renderField = () => {
                if (q.type_question === 'image_upload' && renderAttachments)
                  return (
                    <View>
                      <Text weight="semibold">
                        {q.question_text}
                        {isRequired(q.is_required) ? ' *' : ''}
                      </Text>
                      {props.error && <Text tone="danger">{props.error}</Text>}
                    </View>
                  );
                if (!editable) {
                  const display =
                    q.type_question === 'date' && typeof value === 'string' && value
                      ? formatDate(value, value)
                      : (Array.isArray(value) ? value : [value])
                          .map((v) => options.find((o) => o.value === v)?.label ?? v)
                          .filter((v) => v != null && v !== '')
                          .join(', ');
                  return (
                    <View key={q.question_id} className="gap-1">
                      <Text weight="medium">{q.question_text}</Text>
                      <Text tone="muted">{display || 'Chưa trả lời'}</Text>
                    </View>
                  );
                }
                if (q.type_question === 'text')
                  return (
                    <TextField
                      key={q.question_id}
                      {...props}
                      multiline
                      placeholder={q.placeholder}
                      value={typeof value === 'string' ? value : ''}
                      onChange={set}
                    />
                  );
                if (q.type_question === 'number')
                  return (
                    <NumberField
                      key={q.question_id}
                      {...props}
                      decimal
                      value={typeof value === 'number' ? value : null}
                      onChange={set}
                    />
                  );
                if (q.type_question === 'date')
                  return (
                    <DateField
                      key={q.question_id}
                      {...props}
                      placeholder={q.placeholder}
                      value={typeof value === 'string' ? value : null}
                      onChange={set}
                    />
                  );
                if (q.type_question === 'radio')
                  return (
                    <RadioGroup
                      key={q.question_id}
                      {...props}
                      value={typeof value === 'string' ? value : null}
                      onChange={set}
                      options={options}
                    />
                  );
                if (q.type_question === 'checkbox')
                  return (
                    <CheckboxGroup
                      key={q.question_id}
                      {...props}
                      value={Array.isArray(value) ? value : []}
                      onChange={set}
                      options={options}
                    />
                  );
                return (
                  <View key={q.question_id}>
                    <Text>{q.question_text}</Text>
                    <Text tone="muted">
                      Câu hỏi {q.type_question}: chưa hỗ trợ nhập ở module này. Ảnh cần tích hợp module kho
                      ảnh.
                    </Text>
                    {props.error && <Text tone="danger">{props.error}</Text>}
                  </View>
                );
              };
              return (
                <View key={q.question_id} className="gap-3">
                  {renderField()}
                  {renderAttachments?.(q, editable)}
                </View>
              );
            })}
        </View>
      ))}
    </View>
  );
}
