import { View } from 'react-native';

import { DateField, MultiSelectField, SelectField, SwitchField, TextField } from '@/shared/form';
import { Button, Text } from '@/shared/ui';

import type { ConditionOperator, TemplateQuestion } from '../types';
import { multipleValues, operatorLabels, type RuleDraft, type RulesDraft } from '../utils/rule-editor';

export { parseRulesDraft, rulesToDraft, type RuleDraft, type RulesDraft } from '../utils/rule-editor';
const basicOperators: ConditionOperator[] = ['eq', 'neq', 'in', 'not_in'];
const allOperators: ConditionOperator[] = [...basicOperators, 'gt', 'gte', 'lt', 'lte'];

export function BranchingRuleEditor({ value, onChange, questions, disabled }: {
  value: RulesDraft; onChange: (value: RulesDraft) => void; questions: TemplateQuestion[]; disabled: boolean;
}) {
  return <View className="gap-4">
    <SwitchField label="Thêm điều kiện hiển thị" value={value !== null} disabled={disabled} onChange={(v) => onChange(v ? { logic: 'AND', rules: [] } : null)} />
    {value !== null && <>
      <SelectField presentation="dialog" label="Hiển thị câu hỏi khi" value={value.logic} onChange={(logic) => onChange({ ...value, logic })} disabled={disabled}
        options={[{ value: 'AND', label: 'Tất cả điều kiện đều đúng' }, { value: 'OR', label: 'Ít nhất một điều kiện đúng' }]} />
      {value.rules.map((rule, i) => {
        const patch = (change: Partial<RuleDraft>) => onChange({ ...value, rules: value.rules.map((r, index) => index === i ? { ...r, ...change } : r) });
        const question = questions.find((q) => q.question_id === rule.question_id);
        const labels = operatorLabels(question);
        const choice = question?.type_question === 'radio' || question?.type_question === 'checkbox';
        const multiple = multipleValues(rule.operator);
        const operators = question?.type_question === 'number' || question?.type_question === 'date' ? allOperators : basicOperators;
        // Keep existing saved rules editable even if their operator is unusual for the field type.
        const available = operators.includes(rule.operator) ? operators : [...operators, rule.operator];
        const options = (question?.options ?? []).map((o) => ({ value: o.option_value, label: o.option_text }));
        const patchValue = (index: number, next: string) => patch({ values: rule.values.map((v, j) => j === index ? next : v) });
        return <View key={i} className="gap-3 border-b border-border pb-4">
          <Text weight="semibold">Điều kiện {i + 1}</Text>
          <SelectField presentation="dialog" label={`Câu hỏi điều kiện ${i + 1}`} value={rule.question_id} onChange={(question_id) => patch({ question_id, operator: 'eq', values: [] })} disabled={disabled}
            options={questions.map((q) => ({ value: q.question_id, label: q.question_text }))} />
          <SelectField presentation="dialog" label={`Cách so sánh ${i + 1}`} value={rule.operator} onChange={(operator) => patch({ operator, values: multipleValues(operator) ? rule.values : rule.values.slice(0, 1) })} disabled={disabled || !question}
            options={available.map((operator) => ({ value: operator, label: labels[operator] }))} />
          {question && (choice ? (multiple
            ? <MultiSelectField presentation="dialog" label={`Đáp án điều kiện ${i + 1}`} value={rule.values.map(String)} options={options} disabled={disabled} onChange={(values) => patch({ values })} />
            : <SelectField presentation="dialog" label={`Đáp án điều kiện ${i + 1}`} value={rule.values[0] == null ? '' : String(rule.values[0])} options={options} disabled={disabled} onChange={(v) => patch({ values: [v] })} />)
            : <>
              {(multiple ? rule.values : [rule.values[0] ?? '']).map((v, j) => <View key={j} className="gap-2">
                {question.type_question === 'date'
                  ? <DateField presentation="dialog" label={`Ngày điều kiện ${i + 1}${multiple ? ` — giá trị ${j + 1}` : ''}`} value={String(v)} disabled={disabled} onChange={(next) => multiple ? patchValue(j, next) : patch({ values: [next] })} />
                  : <TextField label={`Giá trị điều kiện ${i + 1}${multiple ? ` — giá trị ${j + 1}` : ''}`} value={String(v)} disabled={disabled}
                    keyboardType={question.type_question === 'number' ? 'numbers-and-punctuation' : 'default'}
                    placeholder={question.type_question === 'number' ? 'Nhập số' : 'Nhập nội dung so sánh'}
                    onChange={(next) => multiple ? patchValue(j, next) : patch({ values: [next] })} />}
                {multiple && <Button title={`Bỏ giá trị ${j + 1} của điều kiện ${i + 1}`} variant="ghost" disabled={disabled} onPress={() => patch({ values: rule.values.filter((_, index) => index !== j) })} />}
              </View>)}
              {multiple && <Button title={`Thêm giá trị cho điều kiện ${i + 1}`} variant="outline" disabled={disabled} onPress={() => patch({ values: [...rule.values, ''] })} />}
            </>)}
          <Button title={`Bỏ điều kiện ${i + 1}`} variant="ghost" disabled={disabled} onPress={() => onChange({ ...value, rules: value.rules.filter((_, index) => index !== i) })} />
        </View>;
      })}
      <Button title="Thêm điều kiện" variant="outline" disabled={disabled} onPress={() => onChange({ ...value, rules: [...value.rules, { question_id: '', operator: 'eq', values: [] }] })} />
    </>}
  </View>;
}
