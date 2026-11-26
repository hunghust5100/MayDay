import { useRouter } from 'expo-router';
import { Phone, UserRound } from 'lucide-react-native';
import { View } from 'react-native';
import { z } from 'zod';

import { getErrorMessage } from '@/core/api';
import { DateField, FormField, NumberField, RadioGroup, rules, TextField, useZodForm } from '@/shared/form';
import { GENDER_OPTIONS } from '@/shared/constants';
import { AppHeader, Button, ErrorState, Screen, Spinner, Text, toast } from '@/shared/ui';
import { isValidPhone } from '@/shared/utils';

import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import type { PatientProfile } from '../types';

const text = () => z.string().trim();

const schema = z.object({
  full_name: rules.required('họ và tên'),
  gender: z.enum(['male', 'female', 'other']).nullable(),
  year_of_birth: rules.yearOfBirth().nullable(),
  ethnic: text(),
  career: text(),
  work_place: text(),
  hamlet_address: text(),
  commune_address: text(),
  city_address: text(),
  health_insurance_number: text(),
  health_insurance_validate: z.string().nullable(),
  next_of_kin_name: text(),
  next_of_kin_phone: text().refine((v) => v === '' || isValidPhone(v), 'Số điện thoại không hợp lệ'),
});

type FormValues = z.input<typeof schema>;

const toForm = (p: PatientProfile): FormValues => ({
  full_name: p.full_name,
  gender: p.gender,
  year_of_birth: p.year_of_birth,
  ethnic: p.ethnic ?? '',
  career: p.career ?? '',
  work_place: p.work_place ?? '',
  hamlet_address: p.hamlet_address ?? '',
  commune_address: p.commune_address ?? '',
  city_address: p.city_address ?? '',
  health_insurance_number: p.health_insurance_number ?? '',
  health_insurance_validate: p.health_insurance_validate,
  next_of_kin_name: p.next_of_kin_name ?? '',
  next_of_kin_phone: p.next_of_kin_phone ?? '',
});

function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="h3" className="mt-4">
      {children}
    </Text>
  );
}

function EditForm({ profile }: { profile: PatientProfile }) {
  const router = useRouter();
  const update = useUpdateProfile();
  const form = useZodForm(schema, { defaultValues: toForm(profile) });
  const { control } = form;

  const submit = form.handleSubmit((values) => {
    // Chuỗi rỗng → null (xóa giá trị); API là cập nhật một phần nên gửi đủ để đơn giản.
    const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? null : v]));
    update.mutate(body, {
      onSuccess: () => {
        toast.success('Đã cập nhật hồ sơ.');
        router.back();
      },
    });
  });

  const textField = (name: keyof FormValues, label: string, placeholder?: string) => (
    <FormField
      control={control}
      name={name}
      render={(field) => <TextField label={label} placeholder={placeholder} {...field} value={(field.value as string) ?? ''} />}
    />
  );

  return (
    <Screen
      header={<AppHeader title="Sửa hồ sơ" onBack={() => router.canGoBack() ? router.back() : router.replace('/patient/account')} />}
      footer={<Button title="Lưu thay đổi" fullWidth loading={update.isPending} onPress={() => submit()} />}>
      <View className="gap-[18px] pb-4">
        <SectionTitle>Thông tin cơ bản</SectionTitle>
        <FormField
          control={control}
          name="full_name"
          render={(field) => <TextField label="Họ và tên" required leftIcon={UserRound} autoCapitalize="words" {...field} />}
        />
        <FormField
          control={control}
          name="gender"
          render={({ value, onChange, error }) => (
            <RadioGroup label="Giới tính" direction="row" options={GENDER_OPTIONS} value={value} onChange={onChange} error={error} />
          )}
        />
        <FormField
          control={control}
          name="year_of_birth"
          render={(field) => <NumberField label="Năm sinh" placeholder="VD: 1990" maxLength={4} {...field} />}
        />
        {textField('ethnic', 'Dân tộc', 'VD: Kinh')}
        {textField('career', 'Nghề nghiệp')}
        {textField('work_place', 'Nơi làm việc')}

        <SectionTitle>Địa chỉ</SectionTitle>
        {textField('hamlet_address', 'Thôn / xóm / số nhà')}
        {textField('commune_address', 'Xã / phường')}
        {textField('city_address', 'Tỉnh / thành phố')}

        <SectionTitle>Bảo hiểm y tế</SectionTitle>
        {textField('health_insurance_number', 'Số thẻ BHYT')}
        <FormField
          control={control}
          name="health_insurance_validate"
          render={(field) => <DateField label="Hạn sử dụng thẻ" {...field} />}
        />

        <SectionTitle>Người nhà</SectionTitle>
        {textField('next_of_kin_name', 'Họ tên người nhà')}
        <FormField
          control={control}
          name="next_of_kin_phone"
          render={(field) => (
            <TextField label="Số điện thoại người nhà" leftIcon={Phone} keyboardType="phone-pad" maxLength={10} {...field} />
          )}
        />
      </View>
    </Screen>
  );
}

/** profile02 — Bệnh nhân sửa hồ sơ. */
export function ProfileEditScreen() {
  const router = useRouter();
  const { data: profile, error, refetch, isLoading } = useProfile();
  if (profile) return <EditForm profile={profile} />;
  return (
    <Screen header={<AppHeader title="Sửa hồ sơ" onBack={() => router.canGoBack() ? router.back() : router.replace('/patient/account')} />}>
      {isLoading ? <Spinner className="mt-10" /> : <ErrorState fill description={getErrorMessage(error)} onRetry={() => refetch()} />}
    </Screen>
  );
}
