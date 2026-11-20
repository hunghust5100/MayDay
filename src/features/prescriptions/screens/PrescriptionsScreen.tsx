import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, TextInput } from 'react-native';

import { ROLE_IDS, useSession } from '@/core/auth';
import { AppHeader, Button, Card, Screen, Text } from '@/shared/ui';
import { CreatePrescriptionPayload, PrescriptionItem, prescriptionsApi } from '../api/prescriptions-api';

const MOCK_RECORD_ID = '123';

export const PrescriptionsScreen = () => {
  // Kiểm tra Role của người dùng đang đăng nhập
  const { user } = useSession();
  const isPatient = user?.role_id === ROLE_IDS.PATIENT;

  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instruction, setInstruction] = useState('');
  const [note, setNote] = useState('');

  const submitMutation = useMutation({
    mutationFn: (payload: CreatePrescriptionPayload) => prescriptionsApi.create(payload),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã lưu đơn thuốc cho bệnh nhân');
      setMedicineName('');
      setDosage('');
      setFrequency('');
      setDuration('');
      setInstruction('');
      setNote('');
    },
    onError: (err: any) => Alert.alert('Lỗi', err.message || 'Không thể tạo đơn thuốc')
  });

  const onSubmit = () => {
    if (!medicineName) return Alert.alert('Lỗi', 'Vui lòng nhập tên thuốc');
    
    const items: PrescriptionItem[] = [{
      medicine_name: medicineName,
      dosage,
      frequency,
      duration,
      instruction
    }];

    submitMutation.mutate({
      medical_record_id: MOCK_RECORD_ID,
      note,
      items,
    });
  };

  return (
    <Screen header={<AppHeader title="Đơn Thuốc" />} scroll>
      
      {/* Ẩn form kê đơn nếu là tài khoản Bệnh Nhân */}
      {!isPatient && (
        <Card className="p-4 mb-4 mt-2">
          <Text className="text-lg font-bold text-gray-800 mb-4">Kê Đơn Thuốc Mới</Text>
          
          <Text className="mb-1 text-gray-600">Tên thuốc (Bắt buộc):</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            placeholder="VD: Loratadine"
            value={medicineName}
            onChangeText={setMedicineName}
          />

          <Text className="mb-1 text-gray-600">Liều dùng:</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            placeholder="VD: 10mg"
            value={dosage}
            onChangeText={setDosage}
          />

          <Text className="mb-1 text-gray-600">Tần suất:</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            placeholder="VD: 1 viên/ngày"
            value={frequency}
            onChangeText={setFrequency}
          />
          
          <Text className="mb-1 text-gray-600">Thời gian (Số ngày):</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            placeholder="VD: 7 ngày"
            value={duration}
            onChangeText={setDuration}
          />

          <Text className="mb-1 text-gray-600">Hướng dẫn sử dụng:</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            placeholder="VD: Uống sau bữa ăn sáng"
            value={instruction}
            onChangeText={setInstruction}
          />

          <Text className="mb-1 text-gray-600">Ghi chú chung cho đơn:</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-4 bg-white"
            value={note}
            onChangeText={setNote}
          />

          <Button 
            onPress={onSubmit} 
            disabled={submitMutation.isPending}
            title={submitMutation.isPending ? "Đang lưu..." : "Lưu Đơn Thuốc"}
          />
        </Card>
      )}

      {/* Danh sách này cả bệnh nhân và bác sĩ đều xem được */}
      <Card className="p-4 mt-2">
        <Text className="text-lg font-bold text-gray-800 mb-3">Danh sách Đơn thuốc</Text>
        <Text className="text-gray-500 italic">Hiện tại chưa có dữ liệu đơn thuốc.</Text>
      </Card>
    </Screen>
  );
};