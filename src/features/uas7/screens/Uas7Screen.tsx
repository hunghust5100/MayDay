import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Alert, TextInput } from 'react-native';

import { AppHeader, Button, Card, Screen, Text } from '@/shared/ui';
import { uas7Api } from '../api/uas7-api';
import { CreateUas7Payload } from '../types';

export const Uas7Screen = () => {
  const queryClient = useQueryClient();
  const [iss7, setIss7] = useState('');
  const [hss7, setHss7] = useState('');
  const [note, setNote] = useState('');

  const { data: eligibility, isLoading: checking } = useQuery({
    queryKey: ['uas7-eligibility'],
    queryFn: uas7Api.checkEligibility
  });

  const submitMutation = useMutation({
    mutationFn: (payload: CreateUas7Payload) => uas7Api.createScore(payload),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã ghi nhận điểm UAS7 hôm nay');
      queryClient.invalidateQueries({ queryKey: ['uas7-history'] });
    },
    onError: (err: any) => Alert.alert('Lỗi', err.message || 'Không thể gửi điểm')
  });

  const onSubmit = () => {
    if (!eligibility?.medical_record_id) return;
    submitMutation.mutate({
      medical_record_id: eligibility.medical_record_id,
      score_date: dayjs().format('YYYY-MM-DD'),
      iss7,
      hss7,
      note,
    });
  };

  if (checking) return (
    <Screen header={<AppHeader title="Thang điểm UAS7" />}>
      <Text className="p-4 text-center">Đang kiểm tra dữ liệu...</Text>
    </Screen>
  );

  return (
    <Screen header={<AppHeader title="Thang điểm UAS7" />} scroll>
      {eligibility?.eligible === 'true' ? (
        <Card className="p-4 mb-4 mt-2">
          <Text className="text-lg font-bold text-gray-800 mb-4">Chấm điểm UAS7 Hôm nay</Text>
          
          <Text className="mb-1 text-gray-600">Điểm mảng sẩn (ISS7 - từ 0 đến 3):</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            keyboardType="numeric"
            value={iss7}
            onChangeText={setIss7}
          />

          <Text className="mb-1 text-gray-600">Điểm ngứa (HSS7 - từ 0 đến 3):</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-3 bg-white"
            keyboardType="numeric"
            value={hss7}
            onChangeText={setHss7}
          />

          <Text className="mb-1 text-gray-600">Ghi chú:</Text>
          <TextInput 
            className="border border-gray-300 rounded p-2 mb-4 bg-white"
            value={note}
            onChangeText={setNote}
          />

          <Button 
            onPress={onSubmit} 
            disabled={submitMutation.isPending || !iss7 || !hss7}
            title={submitMutation.isPending ? "Đang gửi..." : "Gửi kết quả"}
          />
        </Card>
      ) : (
        <Card className="p-4 bg-yellow-50 border-yellow-200 mt-2">
          <Text className="text-yellow-700">Bạn hiện không có bệnh án nào đang được điều trị để chấm điểm.</Text>
        </Card>
      )}
    </Screen>
  );
};