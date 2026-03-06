import { useState } from 'react';
import { Alert } from 'react-native';
import { submitFeedback } from '../../../../shared/api/userService';

interface UseFeedbackParams {
  navigation: any;
  serviceRequestId: string;
}

export const useFeedback = ({ navigation, serviceRequestId }: UseFeedbackParams) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!serviceRequestId) {
      Alert.alert('Loi', 'Khong xac dinh duoc yeu cau dich vu');
      return;
    }
    if (rating === 0) {
      Alert.alert('Thieu thong tin', 'Vui long chon so sao danh gia');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Thieu thong tin', 'Vui long nhap nhan xet cua ban');
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({ serviceRequestId, rating, comment: comment.trim() });
      Alert.alert('Cam on!', 'Danh gia cua ban da duoc ghi nhan.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (errorResponse: any) {
      const message =
        errorResponse?.response?.data?.message ??
        errorResponse?.message ??
        'Khong the gui danh gia';
      Alert.alert('Loi', message);
    } finally {
      setLoading(false);
    }
  };

  return {
    rating,
    comment,
    loading,
    setRating,
    setComment,
    handleSubmit,
  };
};
