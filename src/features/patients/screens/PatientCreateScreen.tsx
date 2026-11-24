import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { applyFieldErrors } from '@/core/api';
import { canCreatePatient, useSession } from '@/core/auth';
import { GENDER_OPTIONS } from '@/shared/constants';
import {
  DateField,
  FormField,
  NumberField,
  PasswordField,
  PhoneField,
  RadioGroup,
  TextField,
  useZodForm,
} from '@/shared/form';
import { AppHeader, Button, EmptyState, Screen, Text, toast } from '@/shared/ui';
import { useCreatePatient } from '../hooks/usePatients';
import { patientSchema } from '../schemas';

const EXTRA_FIELDS = [
  ['career', 'Nghề nghiệp'],
  ['ethnic', 'Dân tộc'],
  ['hamlet_address', 'Thôn / xóm / số nhà'],
  ['commune_address', 'Xã / phường'],
  ['city_address', 'Tỉnh / thành phố'],
  ['work_place', 'Nơi làm việc'],
  ['health_insurance_number', 'Số thẻ BHYT'],
  ['next_of_kin_name', 'Họ tên người nhà'],
] as const;
export function PatientCreateScreen() {
  const router = useRouter();
  const create = useCreatePatient();
  const { user } = useSession();
  const form = useZodForm(patientSchema, {
    defaultValues: {
      full_name: '',
      phone: '',
      password: '',
      gender: null,
      year_of_birth: null,
      career: '',
      ethnic: '',
      hamlet_address: '',
      commune_address: '',
      city_address: '',
      work_place: '',
      health_insurance_number: '',
      health_insurance_validate: null,
      next_of_kin_name: '',
      next_of_kin_phone: '',
    },
  });
  const submit = form.handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: (patient) => {
        toast.success('Đã tạo bệnh nhân.');
        router.replace(`/doctor/patients/${patient.user_id}`);
      },
      onError: (e) =>
        applyFieldErrors(e, form.setError, {
          '3006': ['phone', 'Số điện thoại đã được đăng ký'],
          '2004': ['phone', 'Số điện thoại không hợp lệ'],
        }),
    }),
  );
  if (!user || !canCreatePatient(user.role_id))
    return (
      <Screen header={<AppHeader title="Thêm bệnh nhân" onBack={() => router.canGoBack() ? router.back() : router.replace('/doctor/patients')} />}>
        <EmptyState title="Bạn không có quyền tạo bệnh nhân" />
      </Screen>
    );
  return (
    <Screen
      header={<AppHeader title="Thêm bệnh nhân" onBack={() => router.canGoBack() ? router.back() : router.replace('/doctor/patients')} />}
      footer={<Button title="Tạo bệnh nhân" loading={create.isPending} fullWidth onPress={() => submit()} />}
    >
      <View className="gap-3 roomy:gap-4">
        <Text variant="h3">Thông tin tài khoản</Text>
        <FormField
          control={form.control}
          name="full_name"
          render={(field) => <TextField label="Họ và tên" required {...field} />}
        />
        <FormField
          control={form.control}
          name="phone"
          render={(field) => <PhoneField label="Số điện thoại" required {...field} />}
        />
        <FormField
          control={form.control}
          name="password"
          render={(field) => <PasswordField label="Mật khẩu khởi tạo" required {...field} />}
        />
        <FormField
          control={form.control}
          name="gender"
          render={(field) => <RadioGroup label="Giới tính" options={GENDER_OPTIONS} {...field} />}
        />
        <FormField
          control={form.control}
          name="year_of_birth"
          render={(field) => <NumberField label="Năm sinh" maxLength={4} {...field} />}
        />
        <Text variant="h3">Thông tin hồ sơ (tùy chọn)</Text>
        {EXTRA_FIELDS.map(([name, label]) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={(field) => <TextField label={label} {...field} />}
          />
        ))}
        <FormField
          control={form.control}
          name="next_of_kin_phone"
          render={(field) => <PhoneField label="SĐT người nhà" {...field} />}
        />
        <FormField
          control={form.control}
          name="health_insurance_validate"
          render={(field) => <DateField label="Hạn BHYT" {...field} />}
        />
      </View>
    </Screen>
  );
}
