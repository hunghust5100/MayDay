import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { ROLE_IDS, useSession } from '@/core/auth';
import { AppHeader, Button, Card, Screen, Text } from '@/shared/ui';
import { CreateLabRequestPayload, LabRequestItem, labsApi } from '../api/labs-api';

const MOCK_RECORD_ID = '123'; 

export const LabsScreen = () => {
  // Kiểm tra Role của người dùng đang đăng nhập
  const { user } = useSession();
  const isPatient = user?.role_id === ROLE_IDS.PATIENT;

  const queryClient = useQueryClient();
  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['lab-results', MOCK_RECORD_ID],
    queryFn: () => labsApi.getResults(MOCK_RECORD_ID)
  });

  const submitMutation = useMutation({
    mutationFn: (payload: CreateLabRequestPayload) => labsApi.createRequest(payload),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã lưu yêu cầu xét nghiệm');
      setTestName('');
      setDescription('');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['lab-results', MOCK_RECORD_ID] });
    },
    onError: (err: any) => Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu')
  });

  const onSubmit = () => {
    if (!testName) return Alert.alert('Lỗi', 'Vui lòng nhập tên xét nghiệm');
    
    const items: LabRequestItem[] = [{ test_name: testName, description }];
    submitMutation.mutate({
      medical_record_id: MOCK_RECORD_ID,
      note,
      items,
    });
  };

  return (
    <Screen header={<AppHeader title="Cận Lâm Sàng" />} scroll>
      
      {/* Ẩn form yêu cầu xét nghiệm nếu là tài khoản Bệnh Nhân */}
      {!isPatient && (
        <Card className="p-4 mb-4 mt-2">
          <Text className="text-lg font-bold text-gray-800 mb-4">Chỉ định Xét nghiệm mới</Text>
          
          <Text className="mb-1 text-gray-600">Tên xét nghiệm (Bắt buộc):</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            placeholder="Ví dụ: Định lượng IgE đặc hiệu"
            value={testName}
            onChangeText={setTestName}
          />

          <Text className="mb-1 text-gray-600">Mô tả/Chỉ định chi tiết:</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            value={description}
            onChangeText={setDescription}
          />

          <Text className="mb-1 text-gray-600">Ghi chú chung:</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-4 bg-white"
            value={note}
            onChangeText={setNote}
          />

          <Button 
            onPress={onSubmit} 
            disabled={submitMutation.isPending}
            title={submitMutation.isPending ? "Đang lưu..." : "Lưu chỉ định"}
          />
        </Card>
      )}

      {/* Thẻ này hiện ra cho cả bác sĩ lẫn bệnh nhân để xem kết quả */}
      <Card className="p-4 mt-2">
        <Text className="text-lg font-bold text-gray-800 mb-3">Kết quả Cận lâm sàng</Text>
        {isLoading ? (
          <Text className="text-gray-500">Đang tải dữ liệu...</Text>
        ) : (results?.length ?? 0) > 0 ? (
          results?.map((lab: any, index: number) => (
            <View key={index} className="border-b border-gray-200 py-3">
              <Text className="font-semibold">{lab.test_name}</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Kết quả: {lab.result_value || 'Chưa có kết quả (Pending)'}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-500 italic">Chưa có chỉ định/kết quả xét nghiệm nào.</Text>
        )}
      </Card>
    </Screen>
  );
};