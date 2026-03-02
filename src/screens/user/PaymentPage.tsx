import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StepHeader } from '../../components/toast/StepHeader';

export const PaymentScreen = ({ navigation }: any) => {
  const InputGroup = ({ label }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} editable={false} placeholder="..." />
    </View>
  );

  return (
    <View style={styles.container}>
      <StepHeader step={2} title="Thanh Toán" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <InputGroup label="Thông tin yêu cầu" />

        {/* Price Table Placeholder */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thống kê giá tiền</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>[Bảng giá hiển thị ở đây]</Text>
          </View>
        </View>

        <InputGroup label="Phương thức thanh toán" />

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnPay]}
            onPress={() => navigation.navigate('Feedback')}
          >
            <Text style={styles.btnText}>Thanh toán</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnCancel]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.btnText, { color: '#000' }]}>Hủy đơn</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#E5E7EB', borderRadius: 6, padding: 12, height: 48 },
  placeholderBox: {
    backgroundColor: '#E5E7EB', height: 96, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center'
  },
  placeholderText: { color: '#9CA3AF' },
  buttonGroup: { flexDirection: 'row', gap: 16, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnPay: { backgroundColor: '#3B82F6' },
  btnCancel: { backgroundColor: '#D1D5DB' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
