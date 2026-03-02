import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StepHeader } from '../components/StepHeader';

export const FeedbackScreen = ({ navigation, route }: any) => {
  const [orderName, setOrderName] = useState(route?.params?.orderId || '');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (!orderName || rating === 0 || !feedback.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      // Thay thế bằng URL API thực từ hình ảnh Postman
      const response = await fetch('https://your-api.com/api/feedback', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Thêm Authorization nếu cần: 'Authorization': 'Bearer your-token',
        },
        body: JSON.stringify({
          order_id: orderName,
          rating: rating,
          comment: feedback,
        }),
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Gửi feedback thành công!');
        navigation.popToTop();
      } else {
        Alert.alert('Lỗi', 'Gửi thất bại, vui lòng thử lại');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không kết nối được server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StepHeader step={3} title="Feedback" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên đơn hàng</Text>
          <TextInput 
            style={styles.input} 
            value={orderName}
            onChangeText={setOrderName}
            placeholder="Nhập tên đơn hàng"
          />
        </View>

        {/* Star Rating */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Đánh giá số sao</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons 
                  name={i <= rating ? "star" : "star-outline"} 
                  size={24} 
                  color={i <= rating ? "#FBBF24" : "#9CA3AF"} 
                  style={{ marginHorizontal: 4 }} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Feedback</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            multiline 
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Nhập nội dung feedback..."
          />
        </View>

        {/* Links */}
        <View style={styles.linkRow}>
          <Text style={styles.linkBlue}>Thêm tài liệu đính kèm</Text>
          <Text style={styles.linkRed}>Báo cáo sai phạm</Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={submitFeedback}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.sendButtonText}>Đang gửi...</Text>
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { 
    backgroundColor: '#E5E7EB', 
    borderRadius: 6, 
    padding: 12, 
    color: '#000',
    fontSize: 16,
  },
  textArea: { height: 96, textAlignVertical: 'top' },
  starContainer: {
    backgroundColor: '#E5E7EB', 
    padding: 12, 
    borderRadius: 6,
    flexDirection: 'row', 
    alignItems: 'center'
  },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  linkBlue: { color: '#3B82F6', textDecorationLine: 'underline', fontSize: 12 },
  linkRed: { color: '#EF4444', textDecorationLine: 'underline', fontSize: 12 },
  sendButton: {
    backgroundColor: '#2563EB', 
    paddingVertical: 14, 
    borderRadius: 6,
    alignItems: 'center', 
    marginTop: 32
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
