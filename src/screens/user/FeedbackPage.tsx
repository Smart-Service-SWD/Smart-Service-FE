import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StepHeader } from '../components/StepHeader';

export const FeedbackScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <StepHeader step={3} title="Feedback" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên đơn hàng</Text>
          <TextInput style={styles.input} />
        </View>

        {/* Star Rating */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Đánh giá số sao</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons key={i} name="star" size={24} color="#9CA3AF" style={{ marginHorizontal: 4 }} />
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Feedback</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline />
        </View>

        {/* Links */}
        <View style={styles.linkRow}>
          <Text style={styles.linkBlue}>Thêm tài liệu đính kèm</Text>
          <Text style={styles.linkRed}>Báo cáo sai phạm</Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={() => navigation.popToTop()} // Quay về Home
        >
          <Text style={styles.sendButtonText}>Send</Text>
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
  input: { backgroundColor: '#E5E7EB', borderRadius: 6, padding: 12, color: '#000' },
  textArea: { height: 96, textAlignVertical: 'top' },
  starContainer: {
    backgroundColor: '#E5E7EB', padding: 12, borderRadius: 6,
    flexDirection: 'row', alignItems: 'center'
  },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  linkBlue: { color: '#3B82F6', textDecorationLine: 'underline', fontSize: 12 },
  linkRed: { color: '#EF4444', textDecorationLine: 'underline', fontSize: 12 },
  sendButton: {
    backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 6,
    alignItems: 'center', marginTop: 32
  },
  sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
